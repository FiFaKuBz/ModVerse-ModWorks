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

const request = async (endpoint, options) => {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) throw new Error("API request failed");
  if (res.status === 204) return null;
  return res.json();
};

// GET /api/projects
export async function listProjects() {
  try {
    const remote = await request("", { method: "GET" });
    return ensureArray(remote);
  } catch {
    return readLocalProjects();
  }
}

// GET /api/projects/:id
export async function getProject(id) {
  try {
    const remote = await request(`/${id}`, { method: "GET" });
    if (remote) return remote;
  } catch {
    // fallback below
  }
  return readLocalProjects().find((p) => p.id === id) || null;
}

const generateLocalId = () => `u-${Date.now()}`;

// POST /api/projects
export async function createProject(project) {
  try {
    const created = await request("", {
      method: "POST",
      body: JSON.stringify(project),
    });
    if (created) return created;
  } catch {
    // fall through to local storage
  }
  const list = readLocalProjects();
  const withId = project.id ? { ...project } : { ...project, id: generateLocalId() };
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
  const merged = { ...list[index], ...updates };
  list[index] = merged;
  writeLocalProjects(list);
  return merged;
}
