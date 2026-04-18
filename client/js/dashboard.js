import {
    gamificationAPI,
    leaderboardAPI,
    profileAPI,
    requireAuth,
    getToken,
    logout as apiLogout,
    habitsAPI,
    timetableAPI,
    puzzleAPI,
    getApiOrigin,
} from "./api.js";
import {
    completeFocusSessionState,
    ensureFocusState,
    formatFocusTime,
    getFocusState,
    getTodayFocusMinutes,
    pauseFocusSessionState,
    resetFocusSessionState,
    startFocusSessionState,
} from "./focus-session.js";

const BG_GRADIENTS = {
    default: "linear-gradient(135deg,#111016,#1a1020)",
    space: "linear-gradient(135deg,#0a0f1e,#0d1830)",
    forest: "linear-gradient(135deg,#0a1a10,#0d2818)",
    dusk: "linear-gradient(135deg,#180820,#100018)",
    steel: "linear-gradient(135deg,#0e1220,#141a2e)",
    crimson: "linear-gradient(135deg,#180808,#220d0d)",
};

const BG_GRADIENTS_LIGHT = {
    default: "linear-gradient(135deg,#f5f0eb,#ede4d8)",
    space: "linear-gradient(135deg,#e8f0f5,#d8e8f0)",
    forest: "linear-gradient(135deg,#e8f5ee,#d8f0e4)",
    dusk: "linear-gradient(135deg,#f0e8f5,#e8d8f0)",
    steel: "linear-gradient(135deg,#eaedf5,#d8dced)",
    crimson: "linear-gradient(135deg,#f5e8e8,#f0d8d8)",
};

const SWATCH_DARK = { ...BG_GRADIENTS };
const SWATCH_LIGHT = { ...BG_GRADIENTS_LIGHT };

let dashboardState = {
    habits: [],
    timetable: [],
    puzzle: null,
    badges: [],
    xp: 0,
    level: 1,
};

const BADGE_ICON_MAP = {
    "First Orbit": "fa-star",
    Centurion: "fa-trophy",
    "Task Runner": "fa-bolt",
    "Task Master": "fa-list-check",
    "Habit Starter": "fa-seedling",
    "Streak Keeper": "fa-fire",
    "Deep Diver": "fa-brain",
    "Time Bender": "fa-clock",
};

function savePrefs() {
    const prefs = {
        mode: document.documentElement.getAttribute("data-mode") || "dark",
        theme: document.documentElement.getAttribute("data-theme") || "orange",
        bg: localStorage.getItem("hq-bg") || "default",
        accent: localStorage.getItem("hq-custom-accent") || "",
    };
    localStorage.setItem("hq-prefs", JSON.stringify(prefs));
}

function loadPrefs() {
    const raw = localStorage.getItem("hq-prefs");
    if (!raw) {
        updateSwatchPreviews();
        return;
    }

    try {
        const prefs = JSON.parse(raw);
        if (prefs.mode) applyMode(prefs.mode, false);
        if (prefs.theme) applyTheme(prefs.theme, false);
        if (prefs.bg) applyBg(prefs.bg, false);
        if (prefs.accent) applyCustomAccent(prefs.accent, false);
    } catch {
        // no-op
    }

    updateSwatchPreviews();
}

function setMode(mode) {
    applyMode(mode, true);
}

function applyMode(mode, save) {
    document.documentElement.setAttribute("data-mode", mode);
    document.getElementById("btn-dark").classList.toggle("active", mode === "dark");
    document.getElementById("btn-light").classList.toggle("active", mode === "light");
    applyBg(localStorage.getItem("hq-bg") || "default", false);
    updateSwatchPreviews();
    if (save) savePrefs();
}

function setTheme(theme) {
    applyTheme(theme, true);
}

function applyTheme(theme, save) {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll(".preset-dot").forEach((dot) => {
        dot.classList.toggle("active", dot.dataset.theme === theme);
    });
    localStorage.removeItem("hq-custom-accent");
    [
        "--accent",
        "--accent-rgb",
        "--accent-dim",
        "--accent-border",
        "--accent-glow",
        "--bg-card",
        "--bg-header",
        "--bg-sidebar",
        "--text-primary",
        "--text-secondary",
        "--text-muted",
    ].forEach((variable) => document.documentElement.style.removeProperty(variable));
    if (save) savePrefs();
}

function setCustomAccent(hex) {
    applyCustomAccent(hex, true);
}

function applyCustomAccent(hex, save) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!match) return;

    const [r, g, b] = [
        parseInt(match[1], 16),
        parseInt(match[2], 16),
        parseInt(match[3], 16),
    ];

    const root = document.documentElement;
    root.style.setProperty("--accent", hex);
    root.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
    root.style.setProperty("--accent-dim", `rgba(${r},${g},${b},0.12)`);
    root.style.setProperty("--accent-border", `rgba(${r},${g},${b},0.25)`);
    root.style.setProperty("--accent-glow", `rgba(${r},${g},${b},0.4)`);
    document.getElementById("color-hex").textContent = hex.toUpperCase();
    document.getElementById("accent-picker").value = hex;
    document.querySelectorAll(".preset-dot").forEach((dot) => dot.classList.remove("active"));

    if (save) {
        localStorage.setItem("hq-custom-accent", hex);
        savePrefs();
    }
}

function setBg(bg) {
    applyBg(bg, true);
}

function applyBg(bg, save) {
    const mode = document.documentElement.getAttribute("data-mode") || "dark";
    const map = mode === "light" ? BG_GRADIENTS_LIGHT : BG_GRADIENTS;
    const gradient = map[bg] || map.default;
    document.documentElement.style.background = gradient;
    document.documentElement.style.backgroundAttachment = "fixed";
    document.documentElement.style.setProperty("--bg-gradient", gradient);
    document.querySelectorAll(".bg-swatch").forEach((swatch) => {
        swatch.classList.toggle("active", swatch.dataset.bg === bg);
    });
    localStorage.setItem("hq-bg", bg);
    if (save) savePrefs();
}

function updateSwatchPreviews() {
    const mode = document.documentElement.getAttribute("data-mode") || "dark";
    const map = mode === "light" ? SWATCH_LIGHT : SWATCH_DARK;
    document.querySelectorAll(".bg-swatch").forEach((swatch) => {
        swatch.style.background = map[swatch.dataset.bg] || map.default;
    });
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("overlay").classList.toggle("active");
}

function logout() {
    apiLogout();
}

function getMyUserId() {
    try {
        return JSON.parse(atob(getToken().split(".")[1])).userId;
    } catch {
        return null;
    }
}

function getMyNameFromToken() {
    try {
        const payload = JSON.parse(atob(getToken().split(".")[1]));
        return (payload.name || payload.username || "PLAYER").toUpperCase();
    } catch {
        return "PLAYER";
    }
}

function getTodayDayIndex() {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
}

function trimTime(value) {
    return value ? String(value).slice(0, 5) : "00:00";
}

function formatHabitSubtitle(habit) {
    if (habit.completed_today) {
        return "Completed today";
    }

    if (Number(habit.today_count || 0) > 0 && Number(habit.target_count || 1) > 1) {
        return `${habit.today_count}/${habit.target_count} today`;
    }

    return `${habit.frequency} habit`;
}

function getLevelProgress(xp) {
    const safeXp = Number(xp || 0);
    const level = Math.floor(safeXp / 100) + 1;
    const baseXp = (level - 1) * 100;
    const current = safeXp - baseXp;

    return {
        level,
        current,
        needed: 100,
        pct: Math.max(0, Math.min((current / 100) * 100, 100)),
    };
}

function resolvePuzzleImage(imagePath) {
    if (!imagePath) return "";
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    const normalized = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${getApiOrigin()}${normalized}`;
}

function getTilePreviewPosition(index, cols, rows) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = cols === 1 ? "50%" : `${(col * 100) / (cols - 1)}%`;
    const y = rows === 1 ? "50%" : `${(row * 100) / (rows - 1)}%`;
    return { x, y };
}

function getBadgeIconClass(badge) {
    if (!badge) return "fa-medal";

    if (BADGE_ICON_MAP[badge.name]) {
        return BADGE_ICON_MAP[badge.name];
    }

    switch (badge.condition_type) {
        case "total_points":
            return "fa-star";
        case "tasks_completed":
            return "fa-list-check";
        case "habits_completed":
            return "fa-seedling";
        case "best_habit_streak":
            return "fa-fire";
        case "focus_sessions_completed":
            return "fa-brain";
        case "long_focus_minutes":
            return "fa-clock";
        default:
            return "fa-medal";
    }
}

function cacheEarnedBadges(badges) {
    const earnedBadges = Array.isArray(badges) ? badges.filter((badge) => badge.earned) : [];
    localStorage.setItem("hq-earned-badges", JSON.stringify(earnedBadges));
    return earnedBadges;
}

function renderAchievementsPreview(badges, fallbackEarnedCount = 0) {
    const grid = document.getElementById("achievement-badge-grid");
    if (!grid) return;

    if (Array.isArray(badges) && badges.length > 0) {
        grid.innerHTML = badges
            .slice(0, 6)
            .map(
                (badge) => `
                    <div class="badge-item ${badge.earned ? "" : "locked"}" title="${badge.name}">
                        <i class="fa-solid ${getBadgeIconClass(badge)}"></i>
                    </div>
                `
            )
            .join("");
        return;
    }

    const fallbackIcons = [
        "fa-fire",
        "fa-bolt",
        "fa-trophy",
        "fa-gem",
        "fa-star",
        "fa-bullseye",
    ];

    grid.innerHTML = fallbackIcons
        .map(
            (icon, index) => `
                <div class="badge-item ${index < fallbackEarnedCount ? "" : "locked"}">
                    <i class="fa-solid ${icon}"></i>
                </div>
            `
        )
        .join("");
}

function showDashboardToast(message, isError = false) {
    const toast = document.getElementById("dashboard-toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");

    window.clearTimeout(showDashboardToast._timer);
    showDashboardToast._timer = window.setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.remove("error");
    }, 2600);
}

async function loadUserData() {
    const profile = profileAPI.get();
    let resolvedName = profile.username || getMyNameFromToken();
    const applyHeaderName = (value) => {
        const label = (value || "PLAYER").toUpperCase();
        document.getElementById("header-username").textContent = label;
        document.getElementById("welcome-username").textContent = label;
    };

    applyHeaderName(resolvedName);

    if (profile.avatar) {
        document.getElementById("header-avatar-img").src = profile.avatar;
        document.getElementById("header-avatar-img").style.display = "block";
        document.getElementById("header-avatar-icon").style.display = "none";
    }

    const hour = new Date().getHours();
    document.getElementById("greet-text").textContent =
        hour < 12 ? "GOOD MORNING" : hour < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";

    const focusHistory = JSON.parse(localStorage.getItem("hq-focus-history") || "{}");
    const focusMin = Object.values(focusHistory).reduce((sum, value) => sum + value, 0);
    const fallbackStats = JSON.parse(localStorage.getItem("stats") || "{}");

    const [leaderboardResult, habitsResult, timetableResult, puzzleResult, badgesResult] =
        await Promise.allSettled([
            leaderboardAPI.get(),
            habitsAPI.getAll(),
            timetableAPI.getAll(),
            puzzleAPI.getCurrent(),
            gamificationAPI.getBadges(),
        ]);

    let xp = fallbackStats.xp || 0;
    let level = fallbackStats.level || 1;
    let habits = [];
    let timetable = [];
    let puzzle = null;
    let badges = [];

    if (leaderboardResult.status === "fulfilled") {
        const myId = getMyUserId();
        const me = (leaderboardResult.value.data || []).find(
            (user) => user.userId === myId || user.id === myId
        );
        if (me) {
            xp = Number(me.total_points || 0);
            level = Number(me.level || 1);
            if ((!resolvedName || resolvedName === "PLAYER") && (me.username || me.name)) {
                resolvedName = me.username || me.name;
                profileAPI.save({ username: resolvedName });
                applyHeaderName(resolvedName);
            }
        }
    }

    if (habitsResult.status === "fulfilled") {
        habits = habitsResult.value.data || [];
    } else {
        habits = JSON.parse(localStorage.getItem("habits") || "[]");
    }

    if (timetableResult.status === "fulfilled") {
        timetable = timetableResult.value.data || [];
    } else {
        timetable = JSON.parse(localStorage.getItem("timetable") || "[]");
    }

    if (puzzleResult.status === "fulfilled") {
        puzzle = puzzleResult.value.data || null;
    }

    if (badgesResult.status === "fulfilled") {
        badges = badgesResult.value.data || [];
    }

    const cachedEarnedBadges =
        badges.length > 0
            ? cacheEarnedBadges(badges)
            : JSON.parse(localStorage.getItem("hq-earned-badges") || "[]");

    dashboardState = { habits, timetable, puzzle, badges, xp, level };

    const progress = getLevelProgress(xp);
    document.getElementById("xp-numbers").textContent = `${progress.current} / ${progress.needed} XP`;
    document.getElementById("header-level").textContent = `LEVEL ${progress.level}`;
    document.getElementById("header-level-tag").textContent = `LVL ${progress.level}`;
    setTimeout(() => {
        document.getElementById("xp-fill").style.width = `${progress.pct}%`;
    }, 250);

    document.getElementById("stat-habits").textContent = habits.length;
    document.getElementById("stat-focus").textContent = `${Math.floor(focusMin / 60)}h`;
    document.getElementById("stat-badges").textContent =
        cachedEarnedBadges.length || fallbackStats.badges || 0;
    document.getElementById("stat-longest-streak").textContent =
        puzzle?.streak?.best || 0;

    loadHabitsPreview(habits);
    loadTimetable(timetable);
    loadStreak(puzzle);
    loadPuzzlePreview(puzzle);
    renderAchievementsPreview(badges, cachedEarnedBadges.length || fallbackStats.badges || 0);
    renderDashboardFocus();
}

function loadStreak(puzzle) {
    const current = Number(puzzle?.streak?.current || 0);
    const best = Number(puzzle?.streak?.best || 0);
    const unlocks = Number(puzzle?.streak?.available_unlocks || 0);
    const nextUnlockAt = puzzle?.streak?.next_unlock_at_streak;
    const circles = document.getElementById("week-circles");
    circles.innerHTML = "";

    for (let index = 1; index <= 7; index += 1) {
        const wrapper = document.createElement("div");
        wrapper.className = "day-circle";

        const ring = document.createElement("div");
        ring.className = "day-circle-ring";
        ring.textContent = String(index).padStart(2, "0");

        if (current >= index) {
            ring.classList.add("completed");
        } else if (current + 1 === index) {
            ring.classList.add("today");
        }

        const label = document.createElement("div");
        label.className = "day-circle-label";
        label.textContent = `DAY ${index}`;

        wrapper.appendChild(ring);
        wrapper.appendChild(label);
        circles.appendChild(wrapper);
    }

    document.getElementById("streak-total-badge").textContent = `${current} DAYS`;

    const streakText = document.getElementById("streak-xp-text");
    const streakRow = document.getElementById("streak-xp-row");
    streakRow.style.borderColor = "";

    if (!puzzle || !puzzle.image) {
        streakText.textContent = "Add puzzle images in the backend to begin the reveal challenge.";
        return;
    }

    if (unlocks > 0) {
        streakText.textContent =
            unlocks === 1
                ? "A puzzle tile is ready. Open the board to reveal it."
                : `${unlocks} puzzle tiles are ready to reveal.`;
        streakRow.style.borderColor = "var(--accent)";
        return;
    }

    if (current === 0) {
        streakText.textContent = "Complete a habit on a new day to start your reveal streak.";
        return;
    }

    if (best > current) {
        streakText.textContent = `Best streak: ${best} days. Next tile unlocks at streak ${nextUnlockAt || current + 1}.`;
        return;
    }

    streakText.textContent = `Stay consistent. Next tile unlocks at streak ${nextUnlockAt || current + 1}.`;
}

function loadHabitsPreview(habits) {
    const list = document.getElementById("habit-list");

    if (!habits.length) {
        list.innerHTML = '<div class="empty-hint">No habits yet.</div>';
        return;
    }

    list.innerHTML = habits
        .slice(0, 5)
        .map(
            (habit) => `
                <div class="habit-item">
                    <div
                        class="habit-check ${habit.completed_today ? "done" : ""}"
                        onclick="event.stopPropagation();toggleHabit('${habit.id}')"
                    ></div>
                    <span>${habit.name}</span>
                    <span class="habit-preview-meta">${formatHabitSubtitle(habit)}</span>
                </div>
            `
        )
        .join("");
}

async function toggleHabit(id) {
    const habit = dashboardState.habits.find((item) => item.id === id);
    if (!habit) return;

    if (habit.completed_today) {
        showDashboardToast("That habit is already completed today.", true);
        return;
    }

    try {
        const res = await habitsAPI.complete(id);
        const data = res.data || {};

        if (data.xp_gained) {
            showDashboardToast(`Habit complete. +${data.xp_gained} XP`);
        }

        if (data.puzzle?.unlock_earned_today) {
            window.setTimeout(() => {
                showDashboardToast("Puzzle tile earned. Open the puzzle board to reveal it.");
            }, 500);
        }

        if (Array.isArray(data.new_badges) && data.new_badges.length > 0) {
            window.setTimeout(() => {
                showDashboardToast(`New badge unlocked: ${data.new_badges[0].name}`);
            }, 950);
        }

        await loadUserData();
    } catch (error) {
        if (error.status === 409) {
            showDashboardToast("That habit is already completed today.", true);
            return;
        }

        showDashboardToast(error.message || "Could not complete the habit.", true);
    }
}

function loadTimetable(timetable) {
    const list = document.getElementById("timetable-list");

    if (!Array.isArray(timetable) || !timetable.length) {
        list.innerHTML =
            '<div class="empty-state"><i class="fa-regular fa-calendar"></i><span>No schedule yet</span></div>';
        return;
    }

    const todayIndex = getTodayDayIndex();
    const todaysSlots = timetable
        .filter((slot) => Number(slot.day_of_week) === todayIndex)
        .sort((a, b) => trimTime(a.start_time).localeCompare(trimTime(b.start_time)));

    if (!todaysSlots.length) {
        list.innerHTML =
            '<div class="empty-state"><i class="fa-regular fa-calendar"></i><span>No schedule for today</span></div>';
        return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    list.innerHTML = todaysSlots
        .slice(0, 6)
        .map((slot) => {
            const start = trimTime(slot.start_time);
            const end = trimTime(slot.end_time);
            const [startHour, startMinute] = start.split(":").map(Number);
            const [endHour, endMinute] = end.split(":").map(Number);
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;
            const active = currentMinutes >= startMinutes && currentMinutes < endMinutes;

            return `
                <div class="timetable-row">
                    <span class="t-time">${start}</span>
                    <div class="t-bar ${active ? "active-slot" : ""}">
                        <div class="t-dot"></div>
                        ${slot.title}
                    </div>
                </div>
            `;
        })
        .join("");
}

function buildMiniPuzzleTiles(puzzle) {
    const totalTiles = Number(puzzle?.image?.total_tiles || 0);
    const revealed = new Set(puzzle?.progress?.revealed_tiles || []);
    const cols = Number(puzzle?.image?.grid_cols || 5);
    const rows = Number(puzzle?.image?.grid_rows || 5);
    const imageUrl = resolvePuzzleImage(puzzle?.image?.image_path);

    if (!totalTiles) {
        return '<div class="puzzle-preview-empty">No puzzle image assigned yet.</div>';
    }

    return Array.from({ length: totalTiles }, (_, index) => {
        const state = revealed.has(index) ? "revealed" : "locked";
        const { x, y } = getTilePreviewPosition(index, cols, rows);
        const backgroundStyle = revealed.has(index)
            ? `style="background-image:url('${imageUrl}');background-size:${cols * 100}% ${rows * 100}%;background-position:${x} ${y};"`
            : "";
        return `<span class="mini-puzzle-tile ${state}" ${backgroundStyle}></span>`;
    }).join("");
}

function loadPuzzlePreview(puzzle) {
    const media = document.getElementById("puzzle-preview-media");
    const title = document.getElementById("puzzle-preview-title");
    const status = document.getElementById("puzzle-preview-status");
    const count = document.getElementById("puzzle-preview-count");
    const action = document.getElementById("puzzle-preview-action");
    const overlay = document.getElementById("puzzle-preview-grid");

    if (!puzzle || !puzzle.image) {
        media.style.backgroundImage =
            "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))";
        title.textContent = "Puzzle awaiting images";
        status.textContent = "Backend ready";
        count.textContent = puzzle?.message || "Insert rows into puzzle_images to activate the reveal board.";
        action.textContent = "Open setup notes";
        overlay.innerHTML = '<div class="puzzle-preview-empty">No active board</div>';
        return;
    }

    media.style.backgroundImage =
        "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01)), radial-gradient(circle at top left, rgba(var(--accent-rgb),0.18), transparent 48%)";
    title.textContent = puzzle.image.title;
    status.textContent = puzzle.streak.can_unlock_now ? "Reveal ready" : "Streak locked";
    count.textContent = `${puzzle.progress.revealed_count} / ${puzzle.image.total_tiles} tiles revealed`;
    action.textContent = puzzle.streak.can_unlock_now
        ? "Tap to reveal your next tile"
        : `Next tile at streak ${puzzle.streak.next_unlock_at_streak}`;
    overlay.style.setProperty("--mini-cols", String(puzzle.image.grid_cols || 5));
    overlay.innerHTML = buildMiniPuzzleTiles(puzzle);
}

function handleHabitsBlockClick(event) {
    if (event.target.closest(".habit-check") || event.target.closest(".add-habit-btn")) return;
    window.location.href = "habits.html";
}

function handleFocusBlockClick(event) {
    if (event.target.closest(".focus-btn")) return;
    window.location.href = "focus.html";
}

let focusInterval = null;
let focusCompletionInFlight = false;

function stopFocusLoop() {
    if (focusInterval) {
        clearInterval(focusInterval);
        focusInterval = null;
    }
}

function renderDashboardFocus() {
    const state = getFocusState();
    const display = state.remainingSeconds <= 0 && state.completionRecorded
        ? "DONE"
        : formatFocusTime(state.remainingSeconds);

    document.getElementById("focus-display").textContent = display;
    document.getElementById("focus-icon").className = state.isRunning
        ? "fa-solid fa-pause"
        : "fa-solid fa-play";
    document.getElementById("focus-btn-text").textContent = state.isRunning ? "PAUSE" : "START";
    document.getElementById("focus-ring").classList.toggle("running", state.isRunning);
    document.getElementById("focus-total-display").textContent = `${getTodayFocusMinutes()} min`;
}

async function syncDashboardFocus() {
    const state = getFocusState();

    if (!focusCompletionInFlight && !state.completionRecorded && state.remainingSeconds <= 0) {
        focusCompletionInFlight = true;
        stopFocusLoop();

        try {
            const result = await completeFocusSessionState();

            if (!result.alreadyRecorded) {
                showDashboardToast(`Focus complete. +${result.xp} XP`);
            }

            if (Array.isArray(result.newBadges) && result.newBadges.length > 0) {
                window.setTimeout(() => {
                    showDashboardToast(`New badge unlocked: ${result.newBadges[0].name}`);
                }, 800);
            }

            await loadUserData();
        } finally {
            focusCompletionInFlight = false;
        }

        return;
    }

    renderDashboardFocus();

    if (state.isRunning) {
        if (!focusInterval) {
            focusInterval = setInterval(() => {
                syncDashboardFocus().catch((error) => {
                    showDashboardToast(error.message || "Could not sync focus timer.", true);
                });
            }, 1000);
        }
    } else {
        stopFocusLoop();
    }
}

async function toggleFocus() {
    const state = getFocusState();

    try {
        if (state.isRunning) {
            pauseFocusSessionState();
        } else {
            await startFocusSessionState();
        }

        await syncDashboardFocus();
    } catch (error) {
        showDashboardToast(error.message || "Could not update focus session.", true);
    }
}

function resetFocus() {
    resetFocusSessionState();
    stopFocusLoop();
    renderDashboardFocus();
}

document.addEventListener("DOMContentLoaded", async () => {
    requireAuth();
    loadPrefs();
    ensureFocusState();
    renderDashboardFocus();
    await loadUserData();
    await syncDashboardFocus();

    window.addEventListener("storage", (event) => {
        if (event.key === "hq-focus-state" || event.key === "hq-focus-last-mins") {
            syncDashboardFocus().catch((error) => {
                showDashboardToast(error.message || "Could not sync focus timer.", true);
            });
        }
    });
});

window.setMode = setMode;
window.setTheme = setTheme;
window.setCustomAccent = setCustomAccent;
window.setBg = setBg;
window.toggleSidebar = toggleSidebar;
window.logout = logout;
window.toggleHabit = toggleHabit;
window.handleHabitsBlockClick = handleHabitsBlockClick;
window.toggleFocus = toggleFocus;
window.resetFocus = resetFocus;
window.handleFocusBlockClick = handleFocusBlockClick;
