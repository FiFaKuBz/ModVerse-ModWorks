// Projects API helper --------------------------------------------------------
// Centralizes all project CRUD calls. Falls back to localStorage to keep the
// app responsive when the backend is offline or still under development.
const STORAGE_KEY = "mv_user_projects";
const API_BASE = "/api/projects";

const ensureArray = (value) => (Array.isArray(value) ? [...value] : []);

const readLocalProjects = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return ensureArray(parsed);
    } catch {
        return [];
    }
};

const writeLocalProjects = (list) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
};

const request = async(endpoint, options) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...options,
    });
    if (!res.ok) throw new Error("API request failed");
    if (res.status === 204) return null;
    return res.json();
};

const mapProject = (p = {}) => {
    if (!p || typeof p !== "object") return p;
    const id = p._id || p.id;
    const ownerId = p.ownerId || p.owner_id;
    const createdAt = p.createdAt || p.created_at || p.created;
    const updatedAt = p.updatedAt || p.updated_at || p.updated;
    const metrics7d =
        p.metrics7d && typeof p.metrics7d === "object" ? p.metrics7d : {};
    return {
        ...p,
        ...(id ? { id } : {}),
        ...(ownerId ? { ownerId } : {}),
        ...(createdAt ? { createdAt } : {}),
        ...(updatedAt ? { updatedAt } : {}),
        metrics7d: {
            likes: Number.isFinite(metrics7d.likes) ? metrics7d.likes : 0,
            saves: Number.isFinite(metrics7d.saves) ? metrics7d.saves : 0,
            comments: Number.isFinite(metrics7d.comments) ? metrics7d.comments : 0,
        },
    };
};

// GET /api/projects
export async function listProjects() {
    try {
        const remote = await request("/public", { method: "GET" });
        if (remote && remote.success && Array.isArray(remote.projects)) {
            const projectsWithId = remote.projects.map(mapProject);
            return ensureArray(projectsWithId);
        }
        throw new Error("Invalid response format from public projects API.");
    } catch {
        return ensureArray(readLocalProjects().map(mapProject));
    }
}

// GET /api/projects/:id
export async function getProject(id) {
    try {
        const remote = await request(`/${id}`, { method: "GET" });
        if (remote ?.project) return mapProject(remote.project);
        if (remote) return mapProject(remote);
    } catch {
        // fallback below
    }
    return (
        readLocalProjects()
        .map(mapProject)
        .find((p) => p.id === id) || null
    );
}

const generateLocalId = () => `u-${Date.now()}`;

// POST /api/projects
export async function createProject(project) {
    try {
        const created = await request("", {
            method: "POST",
            body: JSON.stringify(project),
        });
        if (created ?.project) return mapProject(created.project);
        if (created) return mapProject(created);
    } catch {
        // fall through to local storage
    }
    const list = readLocalProjects();
    const withId = project.id ? {...project } : {...project, id: generateLocalId() };
    list.unshift(withId);
    writeLocalProjects(list);
    return withId;
}

// PATCH /api/projects/:id
export async function updateProject(id, updates) {
    try {
        const updated = await request(`/${id}`, {
            method: "PATCH",
            body: JSON.stringify(updates),
        });
        if (updated) return updated;
    } catch {
        // fallback to local mutations
    }
    const list = readLocalProjects();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const merged = {...list[index], ...updates };
    list[index] = merged;
    writeLocalProjects(list);
    return merged;
}

// POST /api/projects/:id/comments
export async function addComment(projectId, text) {
    try {
        const res = await request(`/${projectId}/comments`, {
            method: "POST",
            body: JSON.stringify({ text }),
        });
        return res.comment;
    } catch (e) {
        console.error("Failed to add comment", e);
        return null;
    }
}

// GET /api/projects/:id/comments
export async function getComments(projectId) {
    try {
        const res = await request(`/${projectId}/comments`, { method: "GET" });
        return ensureArray(res.comments);
    } catch {
        return [];
    }
}

// POST /api/projects/:id/interact
export async function interactProject(id, action) {
    // action = 'like' | 'dislike'
    try {
        const res = await request(`/${id}/interact`, {
            method: "POST",
            body: JSON.stringify({ action }),
        });
        return res.data; // Returns { likes: n, dislikes: n, isLiked: bool, isDisliked: bool }
    } catch {
        return null;
    }
}

// POST /api/projects/:id/save
export async function toggleSaveProject(id) {
    try {
        const res = await request(`/${id}/save`, { method: "POST" });
        return res.isSaved;
    } catch {
        return false;
    }
}