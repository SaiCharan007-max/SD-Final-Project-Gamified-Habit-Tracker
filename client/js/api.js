const FALLBACK_API_ORIGIN = "http://localhost:3000";
const API_ORIGIN =
    window.location.protocol.startsWith("http") && /:(3000|3137)$/.test(window.location.origin)
        ? window.location.origin
        : FALLBACK_API_ORIGIN;
const BASE = `${API_ORIGIN}/api`;

export function getToken() {
    return localStorage.getItem("token");
}

export function isLoggedIn() {
    return !!getToken();
}

export function logout() {
    localStorage.removeItem("token");
    window.location.href = "index.html";
}

export function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = "index.html";
    }
}

export function getApiOrigin() {
    return API_ORIGIN;
}

async function api(method, path, body = null) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE}${path}`, options);

    if (res.status === 401) {
        logout();
        return;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const err = new Error(data.message || "Request failed");
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

const get = (path) => api("GET", path);
const post = (path, body) => api("POST", path, body);
const put = (path, body) => api("PUT", path, body);
const del = (path) => api("DELETE", path);

export const authAPI = {
    login: (email, password) => post("/auth/login", { email, password }),
    register: (username, email, password) =>
        post("/auth/register", { username, email, password }),
};

export const habitsAPI = {
    getAll: () => get("/habits"),
    create: (habit) => post("/habits/create", habit),
    complete: (id) => post(`/habits/complete/${id}`, {}),
    delete: (id) => del(`/habits/${id}`),
    update: (id, data) => put(`/habits/${id}`, data),
};

export const focusAPI = {
    start: () => post("/focus/start", {}),
    stop: (id) => post(`/focus/stop/${id}`, {}),
};

export const timetableAPI = {
    getAll: () => get("/timetable"),
    addSlot: (slot) => post("/timetable", slot),
    deleteSlot: (id) => del(`/timetable/${id}`),
};

export const leaderboardAPI = {
    get: () => get("/leaderboard"),
};

export const gamificationAPI = {
    getBadges: () => get("/gamification/badges"),
    checkBadges: () => post("/gamification/badges/check", {}),
};

export const puzzleAPI = {
    getCurrent: () => get("/puzzle/current"),
    unlock: (tileIndex) =>
        tileIndex === undefined || tileIndex === null
            ? post("/puzzle/unlock", {})
            : post("/puzzle/unlock", { tileIndex }),
};

export const statsAPI = {
    getMyStats: async () => {
        const lb = await get("/leaderboard");
        const token = getToken();
        if (!token) return null;

        const payload = JSON.parse(atob(token.split(".")[1]));
        const userId = payload.userId;

        const me = (lb.data || []).find((u) => u.userId === userId || u.id === userId);

        const streak = JSON.parse(localStorage.getItem("hq-streak") || "{}");
        const habits = JSON.parse(localStorage.getItem("habits") || "[]");
        const history = JSON.parse(localStorage.getItem("hq-habit-history") || "{}");
        const focusHistory = JSON.parse(localStorage.getItem("hq-focus-history") || "{}");

        const habitsCompleted = Object.values(history).reduce((a, b) => a + b, 0);
        const focusMin = Object.values(focusHistory).reduce((a, b) => a + b, 0);
        const habitsFormed = habits.filter(
            (habit) => (habit.doneDates || []).length >= (habit.goalDays || 21)
        ).length;

        return {
            xp: me?.total_points || 0,
            level: me?.level || 1,
            currentStreak: streak.current || 0,
            longestStreak: streak.longest || 0,
            habitsCompleted,
            habitsFormed,
            focusMin,
            totalHabits: habits.length,
        };
    },
};

export const profileAPI = {
    get: () => JSON.parse(localStorage.getItem("hq-profile") || "{}"),
    save: (data) => {
        const existing = JSON.parse(localStorage.getItem("hq-profile") || "{}");
        const merged = { ...existing, ...data };
        localStorage.setItem("hq-profile", JSON.stringify(merged));
        return merged;
    },
    getUsernameFromToken: () => {
        try {
            const token = getToken();
            if (!token) return null;
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.name || payload.username || null;
        } catch {
            return null;
        }
    },
};

export function calcLevel(xp) {
    return Math.floor((xp || 0) / 100) + 1;
}

export function xpForNextLevel(xp) {
    const level = calcLevel(xp);
    const nextXP = level * 100;
    const prevXP = (level - 1) * 100;

    return {
        current: xp - prevXP,
        needed: nextXP - prevXP,
        pct: Math.round(((xp - prevXP) / (nextXP - prevXP)) * 100),
    };
}

export const LEVEL_TITLES = [
    "NOVICE",
    "APPRENTICE",
    "WARRIOR",
    "KNIGHT",
    "CHAMPION",
    "LEGEND",
    "MASTER",
    "GRANDMASTER",
];

export function getLevelTitle(level) {
    return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}
