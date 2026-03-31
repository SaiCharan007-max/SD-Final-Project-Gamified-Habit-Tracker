import { puzzleAPI, requireAuth, profileAPI, getApiOrigin } from "./api.js";

let puzzleState = null;
let unlockingTileIndex = null;

function resolvePuzzleImage(imagePath) {
    if (!imagePath) return "";
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    const normalized = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${getApiOrigin()}${normalized}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function getTileBackgroundPosition(index, cols, rows) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = cols === 1 ? "50%" : `${(col * 100) / (cols - 1)}%`;
    const y = rows === 1 ? "50%" : `${(row * 100) / (rows - 1)}%`;
    return { x, y };
}

function showToast(message, isError = false) {
    const toast = document.getElementById("puzzle-toast");
    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");

    clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.remove("error");
    }, 2800);
}

function updateSummary(puzzle) {
    const current = Number(puzzle?.streak?.current || 0);
    const best = Number(puzzle?.streak?.best || 0);
    const ready = Number(puzzle?.streak?.available_unlocks || 0);
    const revealedCount = Number(puzzle?.progress?.revealed_count || 0);
    const totalTiles = Number(puzzle?.image?.total_tiles || 0);

    document.getElementById("summary-current").textContent = String(current);
    document.getElementById("summary-best").textContent = String(best);
    document.getElementById("summary-ready").textContent = String(ready);
    document.getElementById("summary-revealed").textContent = `${revealedCount} / ${totalTiles}`;
}

function updateStatusCards(puzzle) {
    const boardTitle = document.getElementById("board-title");
    const boardPill = document.getElementById("board-pill");
    const progressCopy = document.getElementById("progress-copy");
    const progressPercent = document.getElementById("progress-percent");
    const progressFill = document.getElementById("progress-fill");
    const heroStatus = document.getElementById("hero-status");
    const heroCopy = document.getElementById("hero-copy");
    const nextUnlock = document.getElementById("next-unlock");
    const lastQualified = document.getElementById("last-qualified");
    const boardSize = document.getElementById("board-size");

    if (!puzzle || !puzzle.image) {
        boardTitle.textContent = "No active puzzle image";
        boardPill.textContent = "Setup needed";
        progressCopy.textContent = puzzle?.message || "Add puzzle images to begin the reveal system.";
        progressPercent.textContent = "0%";
        progressFill.style.width = "0%";
        heroStatus.textContent = "Waiting";
        heroCopy.textContent =
            puzzle?.message || "Once the backend has active puzzle images, new users will get a board automatically.";
        nextUnlock.textContent = "-";
        lastQualified.textContent = "-";
        boardSize.textContent = "-";
        return;
    }

    const completion = Number(puzzle.progress?.completion_percentage || 0);
    const ready = Number(puzzle.streak?.available_unlocks || 0);
    const nextTarget = puzzle.streak?.next_unlock_at_streak ?? "-";

    boardTitle.textContent = puzzle.image.title;
    boardPill.textContent = ready > 0 ? "Reveal ready" : "Streak locked";
    progressCopy.textContent = `${puzzle.progress.revealed_count} of ${puzzle.image.total_tiles} tiles revealed`;
    progressPercent.textContent = `${completion}%`;
    progressFill.style.width = `${completion}%`;

    heroStatus.textContent = ready > 0 ? `${ready} tile${ready === 1 ? "" : "s"} ready` : "Keep the streak alive";
    heroCopy.textContent =
        ready > 0
            ? "Choose any locked tile or use the random reveal button below the board."
            : `Next tile unlocks when your streak reaches ${nextTarget}.`;

    nextUnlock.textContent = nextTarget;
    lastQualified.textContent = puzzle.streak?.last_qualified_date || "-";
    boardSize.textContent = `${puzzle.image.grid_rows} x ${puzzle.image.grid_cols}`;
}

function renderEmptyBoard(message) {
    const board = document.getElementById("puzzle-board");
    const grid = document.getElementById("tile-grid");
    const overlayTitle = document.getElementById("board-overlay-title");
    const overlaySubtitle = document.getElementById("board-overlay-subtitle");
    const randomButton = document.getElementById("random-unlock-btn");
    const footerCopy = document.getElementById("board-footer-copy");

    grid.innerHTML = "";
    overlayTitle.textContent = "No active image yet";
    overlaySubtitle.textContent = message;
    footerCopy.textContent = "The puzzle board activates as soon as the backend has active puzzle images.";
    randomButton.disabled = true;
}

function renderBoard(puzzle) {
    const board = document.getElementById("puzzle-board");
    const grid = document.getElementById("tile-grid");
    const overlayTitle = document.getElementById("board-overlay-title");
    const overlaySubtitle = document.getElementById("board-overlay-subtitle");
    const randomButton = document.getElementById("random-unlock-btn");
    const footerCopy = document.getElementById("board-footer-copy");

    if (!puzzle || !puzzle.image) {
        renderEmptyBoard(
            puzzle?.message || "Add puzzle images in the backend so this feature can assign a board."
        );
        return;
    }

    const rows = Number(puzzle.image.grid_rows || 5);
    const cols = Number(puzzle.image.grid_cols || 5);
    const totalTiles = Number(puzzle.image.total_tiles || rows * cols);
    const revealed = new Set(puzzle.progress?.revealed_tiles || []);
    const canUnlock = !!puzzle.streak?.can_unlock_now && unlockingTileIndex === null;
    const imageUrl = resolvePuzzleImage(puzzle.image.image_path);
    grid.style.setProperty("--tile-cols", String(cols));
    grid.style.setProperty("--tile-rows", String(rows));

    overlayTitle.textContent = puzzle.image.title;
    overlaySubtitle.textContent =
        canUnlock
            ? "Pick a locked tile to reveal the next part of the image."
            : "Complete another streak day to earn your next reveal.";

    footerCopy.textContent =
        canUnlock
            ? "A reveal is ready. Click any locked tile or use the random button."
            : `Next tile unlocks at streak ${puzzle.streak?.next_unlock_at_streak}.`;

    randomButton.disabled = !canUnlock;

    grid.innerHTML = Array.from({ length: totalTiles }, (_, index) => {
        const revealedClass = revealed.has(index) ? "revealed" : "";
        const readyClass = canUnlock && !revealed.has(index) ? "ready" : "";
        const unlockingClass = unlockingTileIndex === index ? "unlocking" : "";
        const disabled = revealed.has(index) || !canUnlock ? "disabled" : "";
        const { x, y } = getTileBackgroundPosition(index, cols, rows);
        const backgroundSize = `${cols * 100}% ${rows * 100}%`;

        return `
            <button
                class="puzzle-tile ${revealedClass} ${readyClass} ${unlockingClass}"
                data-tile-index="${index}"
                ${disabled}
                aria-label="Tile ${index + 1}"
            >
                <span class="puzzle-tile-inner">
                    <span class="puzzle-tile-face puzzle-tile-front">
                        <span class="tile-lock"><i class="fa-solid fa-lock"></i></span>
                        <span class="tile-label">#${String(index + 1).padStart(2, "0")}</span>
                    </span>
                    <span
                        class="puzzle-tile-face puzzle-tile-back"
                        style="background-image:url('${escapeHtml(imageUrl)}');background-size:${backgroundSize};background-position:${x} ${y};"
                    ></span>
                </span>
            </button>
        `;
    }).join("");

    grid.querySelectorAll(".puzzle-tile").forEach((tile) => {
        tile.addEventListener("click", () => {
            const tileIndex = Number(tile.dataset.tileIndex);
            unlockSpecificTile(tileIndex);
        });
    });
}

function renderPuzzle(puzzle) {
    puzzleState = puzzle;
    updateSummary(puzzle);
    updateStatusCards(puzzle);
    renderBoard(puzzle);
}

async function loadPuzzle() {
    try {
        const res = await puzzleAPI.getCurrent();
        renderPuzzle(res.data || null);
    } catch (error) {
        renderPuzzle(null);
        showToast(error.message || "Could not load the current puzzle.", true);
    }
}

async function unlockWithPayload(tileIndex) {
    if (!puzzleState?.image) {
        showToast("No active puzzle board is assigned yet.", true);
        return;
    }

    if (!puzzleState?.streak?.can_unlock_now) {
        showToast("No tile unlock is available right now.", true);
        return;
    }

    try {
        const res = await puzzleAPI.unlock(tileIndex);
        const nextPuzzle = res.data || null;
        const unlockedTile =
            typeof nextPuzzle?.unlocked_tile === "number" ? nextPuzzle.unlocked_tile : null;

        unlockingTileIndex = unlockedTile;
        renderPuzzle(nextPuzzle);

        if (unlockedTile !== null) {
            await new Promise((resolve) => window.setTimeout(resolve, 420));
        }

        unlockingTileIndex = null;
        renderPuzzle(nextPuzzle);

        if (nextPuzzle?.image_completed && nextPuzzle?.next_image_assigned) {
            showToast("Board completed. A new image has been assigned.");
            return;
        }

        if (unlockedTile !== null) {
            showToast(`Tile ${unlockedTile + 1} revealed.`);
            return;
        }

        showToast("Tile revealed.");
    } catch (error) {
        unlockingTileIndex = null;
        renderBoard(puzzleState);
        showToast(error.message || "Could not unlock that tile.", true);
    }
}

async function unlockSpecificTile(tileIndex) {
    await unlockWithPayload(tileIndex);
}

async function unlockRandomTile() {
    await unlockWithPayload(null);
}

async function refreshPuzzle() {
    await loadPuzzle();
    showToast("Puzzle data refreshed.");
}

function hydrateHeader() {
    const profile = profileAPI.get();
    if (profile?.username) {
        document.title = `HabitQuest Puzzle - ${profile.username}`;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    requireAuth();
    hydrateHeader();

    document.getElementById("refresh-btn").addEventListener("click", refreshPuzzle);
    document.getElementById("random-unlock-btn").addEventListener("click", unlockRandomTile);

    await loadPuzzle();
});
