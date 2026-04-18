import { focusAPI } from "./api.js";

const FOCUS_STATE_KEY = "hq-focus-state";
const FOCUS_HISTORY_KEY = "hq-focus-sessions";
const FOCUS_DAILY_KEY = "hq-focus-history";
const FOCUS_LAST_MINS_KEY = "hq-focus-last-mins";

export const DEFAULT_FOCUS_MINUTES = 15;
export const DEFAULT_FOCUS_LABEL = "FOCUS SESSION";

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function toInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function readRawState() {
    try {
        return JSON.parse(localStorage.getItem(FOCUS_STATE_KEY) || "{}");
    } catch {
        return {};
    }
}

function writeRawState(state) {
    localStorage.setItem(FOCUS_STATE_KEY, JSON.stringify(state));
    return state;
}

export function calcFocusXp(minutes) {
    if (minutes <= 15) return 15;
    if (minutes <= 30) return 30;
    if (minutes <= 60) return 60;
    if (minutes <= 90) return 100;
    return 150;
}

export function getStoredFocusMinutes() {
    return clamp(toInt(localStorage.getItem(FOCUS_LAST_MINS_KEY), DEFAULT_FOCUS_MINUTES), 1, 240);
}

function buildBaseState() {
    const durationSeconds = getStoredFocusMinutes() * 60;

    return {
        durationSeconds,
        remainingSeconds: durationSeconds,
        isRunning: false,
        endsAt: null,
        activeSessionId: null,
        sessionName: DEFAULT_FOCUS_LABEL,
        completionRecorded: false,
    };
}

function normalizeState(raw = readRawState()) {
    const base = buildBaseState();
    const durationSeconds = clamp(
        toInt(raw.durationSeconds, base.durationSeconds),
        60,
        240 * 60
    );

    let remainingSeconds = clamp(
        toInt(raw.remainingSeconds, durationSeconds),
        0,
        durationSeconds
    );

    const running = Boolean(raw.isRunning);
    const endsAt = Number.isFinite(Number(raw.endsAt)) ? Number(raw.endsAt) : null;

    if (running && endsAt) {
        remainingSeconds = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    }

    return {
        durationSeconds,
        remainingSeconds,
        isRunning: running && remainingSeconds > 0,
        endsAt: running && remainingSeconds > 0 ? endsAt : null,
        activeSessionId: raw.activeSessionId || null,
        sessionName:
            typeof raw.sessionName === "string" && raw.sessionName.trim()
                ? raw.sessionName.trim()
                : DEFAULT_FOCUS_LABEL,
        completionRecorded: Boolean(raw.completionRecorded) && remainingSeconds === 0,
    };
}

function persistNormalizedState(state) {
    return writeRawState({
        durationSeconds: state.durationSeconds,
        remainingSeconds: state.remainingSeconds,
        isRunning: state.isRunning,
        endsAt: state.endsAt,
        activeSessionId: state.activeSessionId,
        sessionName: state.sessionName,
        completionRecorded: Boolean(state.completionRecorded),
    });
}

export function getFocusState() {
    return normalizeState();
}

export function ensureFocusState() {
    const state = normalizeState();
    persistNormalizedState(state);
    return state;
}

export function setFocusConfig({ minutes, sessionName }) {
    const safeMinutes = clamp(toInt(minutes, getStoredFocusMinutes()), 1, 240);
    const durationSeconds = safeMinutes * 60;
    localStorage.setItem(FOCUS_LAST_MINS_KEY, String(safeMinutes));

    const state = {
        durationSeconds,
        remainingSeconds: durationSeconds,
        isRunning: false,
        endsAt: null,
        activeSessionId: null,
        sessionName: sessionName?.trim() || DEFAULT_FOCUS_LABEL,
        completionRecorded: false,
    };

    persistNormalizedState(state);
    return state;
}

export async function startFocusSessionState() {
    const state = getFocusState();

    if (state.remainingSeconds <= 0) {
        return state;
    }

    let activeSessionId = state.activeSessionId;

    if (!activeSessionId) {
        try {
            const response = await focusAPI.start();
            activeSessionId = response.data?.id || null;
        } catch (error) {
            if (error.status !== 409) {
                throw error;
            }
        }
    }

    const nextState = {
        ...state,
        isRunning: true,
        endsAt: Date.now() + state.remainingSeconds * 1000,
        activeSessionId,
        completionRecorded: false,
    };

    persistNormalizedState(nextState);
    return nextState;
}

export function pauseFocusSessionState() {
    const state = getFocusState();

    if (!state.isRunning) {
        return state;
    }

    const nextState = {
        ...state,
        isRunning: false,
        endsAt: null,
        completionRecorded: false,
    };

    persistNormalizedState(nextState);
    return nextState;
}

export function resetFocusSessionState() {
    const state = getFocusState();
    const durationSeconds = state.durationSeconds || getStoredFocusMinutes() * 60;

    const nextState = {
        ...state,
        durationSeconds,
        remainingSeconds: durationSeconds,
        isRunning: false,
        endsAt: null,
        activeSessionId: null,
        completionRecorded: false,
    };

    persistNormalizedState(nextState);
    return nextState;
}

export function formatFocusTime(totalSeconds) {
    const safeSeconds = Math.max(0, Number(totalSeconds || 0));
    const minutes = Math.floor(safeSeconds / 60)
        .toString()
        .padStart(2, "0");
    const seconds = Math.floor(safeSeconds % 60)
        .toString()
        .padStart(2, "0");

    return `${minutes}:${seconds}`;
}

export function getTodayFocusMinutes() {
    try {
        const history = JSON.parse(localStorage.getItem(FOCUS_DAILY_KEY) || "{}");
        return Number(history[todayKey()] || 0);
    } catch {
        return 0;
    }
}

function appendFocusHistory({ name, minutes, xp }) {
    const daily = JSON.parse(localStorage.getItem(FOCUS_DAILY_KEY) || "{}");
    daily[todayKey()] = Number(daily[todayKey()] || 0) + minutes;
    localStorage.setItem(FOCUS_DAILY_KEY, JSON.stringify(daily));

    const sessions = JSON.parse(localStorage.getItem(FOCUS_HISTORY_KEY) || "[]");
    sessions.unshift({
        name,
        mins: minutes,
        xp,
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        ts: Date.now(),
    });
    if (sessions.length > 50) {
        sessions.pop();
    }
    localStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(sessions));
}

export async function completeFocusSessionState() {
    const state = getFocusState();
    const minutes = Math.max(1, Math.floor(state.durationSeconds / 60));
    const sessionName = state.sessionName || DEFAULT_FOCUS_LABEL;

    if (state.completionRecorded) {
        return {
            name: sessionName,
            mins: minutes,
            xp: calcFocusXp(minutes),
            totalPoints: null,
            level: null,
            newBadges: [],
            alreadyRecorded: true,
        };
    }

    let xp = calcFocusXp(minutes);
    let totalPoints = null;
    let level = null;
    let newBadges = [];

    if (state.activeSessionId) {
        try {
            const response = await focusAPI.stop(state.activeSessionId);
            const data = response.data || {};
            xp = Number(data.xp_gained || xp);
            totalPoints = data.total_points ?? null;
            level = data.level ?? null;
            newBadges = Array.isArray(data.new_badges) ? data.new_badges : [];
        } catch (error) {
            if (error.status !== 404) {
                console.warn("Could not stop backend focus session:", error.message);
            }
        }
    }

    appendFocusHistory({ name: sessionName, minutes, xp });

    persistNormalizedState({
        ...state,
        remainingSeconds: 0,
        isRunning: false,
        endsAt: null,
        activeSessionId: null,
        completionRecorded: true,
    });

    return {
        name: sessionName,
        mins: minutes,
        xp,
        totalPoints,
        level,
        newBadges,
        alreadyRecorded: false,
    };
}
