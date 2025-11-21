// Profile API helper ---------------------------------------------------------
// This module handles all interactions with the profile backend endpoints.
// Every function tries the remote API first and falls back to localStorage so
// the UI stays responsive even before the backend is fully available.

const STORAGE_KEY = "mv_user_profile";
const API_PROFILE = "/api/users/profile";
const API_USERS = "/api/users";

const slugify = (value = "") =>
    value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ก-๙\s-]/g, "")
    .replace(/\s+/g, "-");

const defaultProfile = () => ({
    avatar: "",
    username: "default-user",
    email: "Email@gmail.com",
    about: "description",
    followers: 0,
    following: 0,
    likes: 0,
    total_likes: 0,
    showSavedPublicly: true,
    twoFactorEnabled: true,
});

const readLocalProfile = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === "object") {
            return {...defaultProfile(), ...parsed };
        }
    } catch {
        // ignore
    }
    return defaultProfile();
};

const writeLocalProfile = (profile) => {
    const safe = profile && typeof profile === "object" ? profile : defaultProfile();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
};

const request = async(url, options) => {
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...options,
    });
    if (!res.ok) throw new Error("Profile API request failed");
    if (res.status === 204) return null;
    return res.json();
};

// Fetch the currently authenticated user's profile.
export async function getProfile() {
    try {
        const response = await request(API_PROFILE, { method: "GET" });
        // Backend returns { auth: true, user: {...} } or just user object depending on route
        // Adjusting based on your backend: whoami returns { auth: true, user: ... }
        const remote = response.user || response;

        if (remote) {
            writeLocalProfile(remote);
            return remote;
        }
    } catch (e) {
        console.warn("Fetch profile failed, using local", e);
    }
    return readLocalProfile();
}

// Update the authenticated user's profile data (PATCH /profile).
export async function updateProfile(updates) {
    const payload = updates && typeof updates === "object" ? updates : {};
    try {
        // [FIX] Changed PATCH to PUT to match Backend Route
        const response = await request(`${API_PROFILE}/update`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });

        const remote = response.user || response;

        if (remote) {
            writeLocalProfile(remote);
            return remote;
        }
    } catch (e) {
        console.error("Update profile failed", e);
        throw e; // Re-throw so UI knows it failed
    }

    // Optimistic update fallback (only if API totally fails connectivity)
    const next = {...readLocalProfile(), ...payload };
    writeLocalProfile(next);
    return next;
}

// Fetch a public profile by slug (used on OtherProfilePage).
export async function getProfileBySlug(slug) {
    if (!slug) return null;
    try {
        const remote = await request(`${API_USERS}/${slug}`, { method: "GET" });
        if (remote) return remote;
    } catch {
        // fallback to local cache
    }
    const local = readLocalProfile();
    return slugify(local.username) === slug ? local : null;
}