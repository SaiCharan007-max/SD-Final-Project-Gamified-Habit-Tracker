// ============================================================
//  HABITQUEST — api.js
//  Central API helper. All pages import functions from here.
//  Base URL points to the Express backend on port 3137.
// ============================================================

const BASE = "http://localhost:3137/api";

// ── TOKEN HELPERS ──────────────────────────────────────────
export function getToken() {
    return localStorage.getItem("token");
}

export function isLoggedIn() {
    return !!getToken();
}

export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("hq-profile");
    window.location.href = "index.html";
}

// Redirect to login if no token (call on every protected page)
export function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = "index.html";
    }
}

// ── BASE FETCH WRAPPER ────────────────────────────────────
// Handles auth header, JSON parsing, and error throwing
async function api(method, path, body = null) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, options);

    // Token expired or invalid → kick to login
    if (res.status === 401) {
        logout();
        return;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const err = new Error(data.message || "Request failed");
        err.status = res.status;
        err.data   = data;
        throw err;
    }

    return data;
}

// Convenience wrappers
const get    = (path)        => api("GET",    path);
const post   = (path, body)  => api("POST",   path, body);
const put    = (path, body)  => api("PUT",    path, body);
const del    = (path)        => api("DELETE", path);
const patch  = (path, body)  => api("PATCH",  path, body);


// ── AUTH ──────────────────────────────────────────────────
export const authAPI = {
    login:    (email, password)              => post("/auth/login",    { email, password }),
    register: (username, email, password)    => post("/auth/register", { username, email, password }),
};


// ── HABITS ───────────────────────────────────────────────
// GET    /api/habits         → list all habits for current user
// POST   /api/habits/create  → create a new habit
// POST   /api/habits/complete/:id → mark habit done for today
// DELETE /api/habits/:id     → delete a habit  (need to add to backend)
// PUT    /api/habits/:id     → edit a habit    (need to add to backend)
export const habitsAPI = {
    getAll:   ()       => get("/habits"),
    create:   (habit)  => post("/habits/create", habit),
    complete: (id)     => post(`/habits/complete/${id}`, {}),
    delete:   (id)     => del(`/habits/${id}`),
    update:   (id, data) => put(`/habits/${id}`, data),
};


// ── FOCUS ────────────────────────────────────────────────
// POST /api/focus/start       → start a focus session
// POST /api/focus/stop/:id    → stop a focus session (returns XP)
export const focusAPI = {
    start: ()   => post("/focus/start", {}),
    stop:  (id) => post(`/focus/stop/${id}`, {}),
};


// ── TIMETABLE ────────────────────────────────────────────
// GET    /api/timetable       → get all timetable slots
// POST   /api/timetable       → add a slot { day, title, start_time, end_time }
// DELETE /api/timetable/:id   → remove a slot
export const timetableAPI = {
    getAll:     ()     => get("/timetable"),
    addSlot:    (slot) => post("/timetable", slot),
    deleteSlot: (id)   => del(`/timetable/${id}`),
};


// ── LEADERBOARD ──────────────────────────────────────────
// GET /api/leaderboard → top 20 users by XP
export const leaderboardAPI = {
    get: () => get("/leaderboard"),
};


// ── GAMIFICATION / BADGES ────────────────────────────────
// GET  /api/gamification/badges       → all badges + earned status
// POST /api/gamification/badges/check → trigger badge evaluation
export const gamificationAPI = {
    getBadges:   ()  => get("/gamification/badges"),
    checkBadges: ()  => post("/gamification/badges/check", {}),
};


// ── STATS (derived from user_stats table) ────────────────
// The backend returns total_points, tasks_completed, habits_completed
// We'll call leaderboard to get the current user's stats
// and supplement with localStorage for things not yet in backend
export const statsAPI = {
    // Get stats from the leaderboard endpoint (includes total_points & level)
    // Then merge with localStorage for streaks/focus until profile endpoint is added
    getMyStats: async () => {
        const lb     = await get("/leaderboard");
        const token  = getToken();
        if (!token) return null;

        // Decode JWT to get userId (no library needed — just parse payload)
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId  = payload.userId;

        const me = (lb.data || []).find(u => u.userId === userId || u.id === userId);

        // Supplement with localStorage streaks/focus until backend endpoints exist
        const streak  = JSON.parse(localStorage.getItem("hq-streak") || "{}");
        const habits  = JSON.parse(localStorage.getItem("habits")    || "[]");
        const history = JSON.parse(localStorage.getItem("hq-habit-history") || "{}");
        const focusH  = JSON.parse(localStorage.getItem("hq-focus-history") || "{}");

        const habitsCompleted = Object.values(history).reduce((a,b) => a+b, 0);
        const focusMin        = Object.values(focusH).reduce((a,b) => a+b, 0);
        const habitsFormed    = habits.filter(h => (h.doneDates||[]).length >= (h.goalDays||21)).length;

        return {
            xp:               me?.total_points  || 0,
            level:            me?.level         || 1,
            currentStreak:    streak.current    || 0,
            longestStreak:    streak.longest    || 0,
            habitsCompleted:  habitsCompleted,
            habitsFormed:     habitsFormed,
            focusMin:         focusMin,
            totalHabits:      habits.length,
        };
    }
};


// ── PROFILE HELPERS ──────────────────────────────────────
// Profile (name/avatar) not yet in backend — uses localStorage
// When backend adds a profile endpoint, update these functions
export const profileAPI = {
    get: () => {
        return JSON.parse(localStorage.getItem("hq-profile") || "{}");
    },
    save: (data) => {
        const existing = JSON.parse(localStorage.getItem("hq-profile") || "{}");
        const merged   = { ...existing, ...data };
        localStorage.setItem("hq-profile", JSON.stringify(merged));
        return merged;
    },
    // Get username from JWT token (saved at login)
    getUsernameFromToken: () => {
        try {
            const token   = getToken();
            if (!token) return null;
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.name || payload.username || null;
        } catch { return null; }
    },
};


// ── XP / LEVEL HELPERS ───────────────────────────────────
export function calcLevel(xp) {
    return Math.floor((xp || 0) / 100) + 1;
}

export function xpForNextLevel(xp) {
    const level   = calcLevel(xp);
    const nextXP  = level * 100;
    const prevXP  = (level - 1) * 100;
    return {
        current:  xp - prevXP,
        needed:   nextXP - prevXP,
        pct:      Math.round(((xp - prevXP) / (nextXP - prevXP)) * 100),
    };
}

export const LEVEL_TITLES = [
    "NOVICE", "APPRENTICE", "WARRIOR", "KNIGHT",
    "CHAMPION", "LEGEND", "MASTER", "GRANDMASTER"
];

export function getLevelTitle(level) {
    return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}