// ============================================
//  HABITQUEST — HABITS JS (Backend wired)
// ============================================
import { habitsAPI, requireAuth } from './api.js';

const CAT_ICONS  = {health:'💪',study:'📚',mindset:'🧠',fitness:'🏃',social:'💬',other:'⚡'};
const CAT_LABELS = {health:'HEALTH',study:'STUDY',mindset:'MINDSET',fitness:'FITNESS',social:'SOCIAL',other:'OTHER'};

let habits        = [];
let editId        = null;
let deleteId      = null;
let currentFilter = 'all';
let selectedCat   = 'health';
let selectedGoal  = 21;

// ── THEME ──
function loadThemePrefs() {
    try {
        const p = JSON.parse(localStorage.getItem('hq-prefs') || '{}');
        const h = document.documentElement;
        if (p.mode)  h.setAttribute('data-mode',  p.mode);
        if (p.theme) h.setAttribute('data-theme', p.theme);
        const BG  = {default:'linear-gradient(135deg,#111016,#1a1020)',space:'linear-gradient(135deg,#0a0f1e,#0d1830)',forest:'linear-gradient(135deg,#0a1a10,#0d2818)',dusk:'linear-gradient(135deg,#180820,#100018)',steel:'linear-gradient(135deg,#0e1220,#141a2e)',crimson:'linear-gradient(135deg,#180808,#220d0d)'};
        const BGL = {default:'linear-gradient(135deg,#f5f0eb,#ede4d8)',space:'linear-gradient(135deg,#e8f0f5,#d8e8f0)',forest:'linear-gradient(135deg,#e8f5ee,#d8f0e4)',dusk:'linear-gradient(135deg,#f0e8f5,#e8d8f0)',steel:'linear-gradient(135deg,#eaedf5,#d8dced)',crimson:'linear-gradient(135deg,#f5e8e8,#f0d8d8)'};
        if (p.bg) { const isL=p.mode==='light'; const g=(isL?BGL:BG)[p.bg]||(isL?BGL.default:BG.default); h.style.background=g; h.style.backgroundAttachment='fixed'; h.style.setProperty('--bg-gradient',g); }
        if (p.accent) { const c=p.accent,r=parseInt(c.slice(1,3),16),g2=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16); h.style.setProperty('--accent',c); h.style.setProperty('--accent-rgb',`${r},${g2},${b}`); h.style.setProperty('--accent-dim',`rgba(${r},${g2},${b},0.12)`); h.style.setProperty('--accent-border',`rgba(${r},${g2},${b},0.25)`); h.style.setProperty('--accent-glow',`rgba(${r},${g2},${b},0.4)`); }
    } catch(e) {}
}

// ── DATE HELPERS ──
function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

// ── EXTRAS: UI fields not in backend (cat, goalDays, xpReward, time, doneDates) ──
function getExtras(id) {
    const all = JSON.parse(localStorage.getItem('hq-habit-extras') || '{}');
    return all[id] || {};
}
function saveExtras(id, data) {
    const all = JSON.parse(localStorage.getItem('hq-habit-extras') || '{}');
    all[id] = { ...(all[id] || {}), ...data };
    localStorage.setItem('hq-habit-extras', JSON.stringify(all));
}
function deleteExtras(id) {
    const all = JSON.parse(localStorage.getItem('hq-habit-extras') || '{}');
    delete all[id];
    localStorage.setItem('hq-habit-extras', JSON.stringify(all));
}

// ── ENRICH: combine backend habit + localStorage extras ──
function enrich(bh) {
    const extras = getExtras(bh.id);
    const tk = todayKey();
    let doneDates = extras.doneDates || [];
    if (bh.completed_today && !doneDates.includes(tk)) doneDates.push(tk);
    if (!bh.completed_today) doneDates = doneDates.filter(d => d !== tk);
    return {
        id:           bh.id,
        name:         bh.name,
        frequency:    bh.frequency,
        target_count: bh.target_count,
        streak:       bh.current_streak || 0,
        bestStreak:   bh.best_streak    || 0,
        done:         bh.completed_today || false,
        today_count:  bh.today_count    || 0,
        cat:      extras.cat      || 'other',
        goalDays: extras.goalDays || 21,
        xpReward: extras.xpReward || 10,
        time:     extras.time     || '',
        doneDates,
    };
}

// ── LOAD FROM BACKEND ──
async function loadHabits() {
    try {
        const res = await habitsAPI.getAll();
        habits = (res.data || []).map(enrich);
        localStorage.setItem('habits', JSON.stringify(habits));
    } catch(e) {
        console.error('Failed to load habits:', e);
        habits = JSON.parse(localStorage.getItem('habits') || '[]');
    }
    updateStats();
    render();
}

// ── STATS BAR ──
function updateStats() {
    const total    = habits.length;
    const done     = habits.filter(h => h.done).length;
    const xpEarned = habits.filter(h => h.done).reduce((s,h) => s+(h.xpReward||10), 0);
    const forming  = habits.filter(h => {
        const p = (h.doneDates||[]).length;
        return p > 0 && p < h.goalDays;
    }).length;
    document.getElementById('sum-total').textContent   = total;
    document.getElementById('sum-done').textContent    = done;
    document.getElementById('sum-xp').textContent      = xpEarned;
    document.getElementById('sum-forming').textContent = forming;
}

// ── RENDER ──
function render() {
    const list = document.getElementById('habits-list');
    const filtered = currentFilter === 'all' ? habits : habits.filter(h => h.cat === currentFilter);

    if (filtered.length === 0) {
        list.innerHTML = `<div class="empty-state">
            <i class="fa-solid fa-seedling"></i>
            <div>${currentFilter === 'all' ? 'No habits yet.' : 'No habits in this category.'}</div>
            <div class="empty-sub">${currentFilter === 'all' ? 'Tap NEW to plant your first habit!' : 'Try a different filter or add one!'}</div>
        </div>`;
        return;
    }

    list.innerHTML = filtered.map(h => renderHabitCard(h)).join('');
    setTimeout(() => {
        document.querySelectorAll('.progress-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.pct + '%';
        });
    }, 100);
}

function renderHabitCard(h) {
    const doneDates = h.doneDates || [];
    const progress  = doneDates.length;
    const goalDays  = h.goalDays || 21;
    const pct       = Math.min((progress / goalDays) * 100, 100);
    const formed    = progress >= goalDays;
    const dotsCount = Math.min(goalDays, 30);
    const dotsStart = Math.max(0, goalDays - dotsCount);
    let dotsHtml = '';
    for (let i = dotsStart; i < goalDays; i++) {
        const filled  = i < progress;
        const isToday = i === progress && !h.done;
        dotsHtml += `<div class="prog-dot ${filled?'filled':''} ${isToday?'today-dot':''}"></div>`;
    }
    const catIcon  = CAT_ICONS[h.cat]  || '⚡';
    const catLabel = CAT_LABELS[h.cat] || 'OTHER';

    return `
    <div class="habit-card cat-${h.cat} ${h.done ? 'done-card' : ''}">
        <div class="habit-top">
            <div class="habit-check ${h.done ? 'done' : ''}" onclick="toggleDone('${h.id}')"></div>
            <div class="habit-info">
                <div class="habit-name">${h.name}</div>
                <div class="habit-meta">
                    <span class="habit-cat">${catIcon} ${catLabel}</span>
                    ${h.time ? `<span class="habit-time">⏰ ${h.time}</span>` : ''}
                    <span class="habit-xp">+${h.xpReward} XP</span>
                </div>
            </div>
            <div class="habit-actions">
                <button class="habit-action-btn" onclick="openEditModal('${h.id}')" title="Edit">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="habit-action-btn delete" onclick="openDeleteModal('${h.id}')" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="habit-progress">
            <div class="progress-header">
                <span class="progress-label">${formed ? '✅ HABIT FORMED!' : `FORMATION PROGRESS · ${goalDays}-DAY GOAL`}</span>
                <span class="progress-count">${progress} / ${goalDays}</span>
            </div>
            <div class="progress-bar-wrap">
                <div class="progress-bar-fill" data-pct="${pct}" style="width:0%"></div>
            </div>
            <div class="progress-dots">${dotsHtml}</div>
        </div>
        <div class="habit-streak-row">
            <span class="habit-streak">🔥 STREAK: <span>${h.streak||0}</span> DAYS</span>
            ${formed ? '<span class="formed-badge">🏆 FORMED</span>' : ''}
        </div>
    </div>`;
}

// ── TOGGLE DONE ──
async function toggleDone(id) {
    const h = habits.find(x => x.id === id);
    if (!h) return;

    if (h.done) {
        showToast('Already completed today!', true);
        return;
    }

    try {
        const res  = await habitsAPI.complete(id);
        const data = res.data || {};

        // Update doneDates in extras
        const tk = todayKey();
        const extras = getExtras(id);
        const doneDates = extras.doneDates || [];
        if (!doneDates.includes(tk)) doneDates.push(tk);
        saveExtras(id, { doneDates });

        // Save to habit history for stats charts
        const history = JSON.parse(localStorage.getItem('hq-habit-history') || '{}');
        history[tk] = (history[tk] || 0) + 1;
        localStorage.setItem('hq-habit-history', JSON.stringify(history));

        // Toasts
        if (data.xp_gained) showXpToast(data.xp_gained);
        if (data.new_badges && data.new_badges.length > 0) {
            data.new_badges.forEach(b => showToast(`🏆 Badge unlocked: ${b.name}!`));
        }

        await loadHabits();
    } catch(e) {
        if (e.status === 409) showToast('Already completed today!', true);
        else showToast('Could not connect to server', true);
    }
}

// ── TOASTS ──
function showXpToast(xp) {
    const toast = document.getElementById('xp-toast');
    toast.textContent = `+${xp} XP`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
}
function showToast(msg, isError = false) {
    const toast = document.getElementById('xp-toast');
    toast.textContent = msg;
    toast.style.background = isError ? '#f43f5e' : '';
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); toast.style.background = ''; }, 2200);
}

// ── FILTER ──
function setFilter(cat) {
    currentFilter = cat;
    document.querySelectorAll('.filter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.cat === cat));
    render();
}

// ── MODAL ──
function openModal() {
    editId = null;
    document.getElementById('modal-title').textContent = '🌱 NEW HABIT';
    document.getElementById('h-name').value = '';
    resetDrum();
    document.getElementById('h-custom-days').value = '';
    document.getElementById('h-custom-days').style.display = 'none';
    pickCat('health');
    pickGoal(21);
    updateXpPreview();
    document.getElementById('habit-modal').classList.add('active');
    document.getElementById('h-name').focus();
}
function openEditModal(id) {
    const h = habits.find(x => x.id === id);
    if (!h) return;
    editId = id;
    document.getElementById('modal-title').textContent = '✏️ EDIT HABIT';
    document.getElementById('h-name').value = h.name;
    setDrumFromString(h.time || '');
    pickCat(h.cat || 'other');
    const stdGoals = [21, 66, 90];
    if (stdGoals.includes(h.goalDays)) {
        pickGoal(h.goalDays);
        document.getElementById('h-custom-days').style.display = 'none';
    } else {
        pickGoal('custom');
        document.getElementById('h-custom-days').value = h.goalDays;
        document.getElementById('h-custom-days').style.display = 'block';
    }
    updateXpPreview();
    document.getElementById('habit-modal').classList.add('active');
    document.getElementById('h-name').focus();
}
function closeModal() {
    document.getElementById('habit-modal').classList.remove('active');
}

async function saveHabit() {
    const name = document.getElementById('h-name').value.trim();
    if (!name) { document.getElementById('h-name').focus(); return; }

    let goalDays = selectedGoal;
    if (selectedGoal === 'custom') {
        goalDays = Math.max(1, Math.min(365, parseInt(document.getElementById('h-custom-days').value) || 21));
    }
    const time     = document.getElementById('h-time').value.trim();
    const xpReward = calcXp(goalDays);

    try {
        if (editId) {
            await habitsAPI.update(editId, { name, frequency: 'daily', target_count: 1 });
            saveExtras(editId, { cat: selectedCat, goalDays, xpReward, time });
        } else {
            const res   = await habitsAPI.create({ name, frequency: 'daily', target_count: 1 });
            const newId = res.data?.id;
            if (newId) {
                saveExtras(newId, { cat: selectedCat, goalDays, xpReward, time });
                scheduleReminders({ name, time, goalDays, doneDates: [] });
            }
        }
        closeModal();
        await loadHabits();
    } catch(e) {
        showToast(e.message || 'Failed to save habit', true);
    }
}

// ── DELETE ──
function openDeleteModal(id) {
    const h = habits.find(x => x.id === id);
    if (!h) return;
    deleteId = id;
    document.getElementById('delete-msg').textContent =
        `Delete "${h.name}"? Your progress (${(h.doneDates||[]).length} days) will be lost.`;
    document.getElementById('delete-modal').classList.add('active');
}
function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('active');
    deleteId = null;
}
async function confirmDelete() {
    if (!deleteId) return;
    try {
        await habitsAPI.delete(deleteId);
        deleteExtras(deleteId);
    } catch(e) {
        showToast('Failed to delete', true);
    }
    closeDeleteModal();
    await loadHabits();
}

// ── PICKERS ──
function pickCat(cat) {
    selectedCat = cat;
    document.querySelectorAll('.cat-opt').forEach(o =>
        o.classList.toggle('active', o.dataset.cat === cat));
}
function pickGoal(days) {
    selectedGoal = days;
    document.querySelectorAll('.goal-opt').forEach(o =>
        o.classList.toggle('active', o.dataset.days === String(days)));
    const customInput = document.getElementById('h-custom-days');
    customInput.style.display = days === 'custom' ? 'block' : 'none';
    if (days === 'custom') customInput.focus();
    updateXpPreview();
}

// ── AUTO XP ──
function calcXp(goalDays) {
    if (goalDays === 'custom') goalDays = parseInt(document.getElementById('h-custom-days').value) || 21;
    if (goalDays <= 21) return 10;
    if (goalDays <= 45) return 20;
    if (goalDays <= 75) return 40;
    return 60;
}
function updateXpPreview() {
    const goalDays = selectedGoal === 'custom'
        ? (parseInt(document.getElementById('h-custom-days').value) || 21)
        : selectedGoal;
    const xp = calcXp(goalDays);
    const labels = {10:'Easy goal',20:'Moderate goal',40:'Challenging goal',60:'Epic goal'};
    document.getElementById('xp-auto-val').textContent = `+${xp} XP per day`;
    document.getElementById('xp-auto-sub').textContent = labels[xp] + ' · auto-calculated';
}

// ── DRUM TIME PICKER ──
let drumHour = 8, drumMin = 0, drumAmpm = 'AM', timeEnabled = false;

function toggleTimePicker() {
    timeEnabled = !timeEnabled;
    document.getElementById('time-toggle').classList.toggle('on', timeEnabled);
    document.getElementById('time-drum-wrap').style.display = timeEnabled ? 'flex' : 'none';
    syncDrumDisplay(); syncHiddenTime();
}
function drumChange(part, dir) {
    if (part === 'hour')      drumHour  = ((drumHour - 1 + dir + 12) % 12) + 1;
    else if (part === 'min')  drumMin   = (drumMin + dir * 5 + 60) % 60;
    else if (part === 'ampm') drumAmpm  = drumAmpm === 'AM' ? 'PM' : 'AM';
    const ids = {hour:'drum-hour-val', min:'drum-min-val', ampm:'drum-ampm-val'};
    const el = document.getElementById(ids[part]);
    el.style.transform = `translateY(${dir > 0 ? -8 : 8}px)`;
    el.style.opacity = '0';
    setTimeout(() => {
        syncDrumDisplay();
        el.style.transition = 'none';
        el.style.transform = `translateY(${dir > 0 ? 8 : -8}px)`;
        el.style.opacity = '0';
        requestAnimationFrame(() => {
            el.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
            el.style.transform = 'translateY(0)';
            el.style.opacity = '1';
        });
    }, 80);
    syncHiddenTime();
}
function syncDrumDisplay() {
    document.getElementById('drum-hour-val').textContent = String(drumHour).padStart(2,'0');
    document.getElementById('drum-min-val').textContent  = String(drumMin).padStart(2,'0');
    document.getElementById('drum-ampm-val').textContent = drumAmpm;
}
function syncHiddenTime() {
    if (!timeEnabled) { document.getElementById('h-time').value = ''; return; }
    document.getElementById('h-time').value = `${String(drumHour).padStart(2,'0')}:${String(drumMin).padStart(2,'0')} ${drumAmpm}`;
}
function resetDrum() {
    drumHour = 8; drumMin = 0; drumAmpm = 'AM'; timeEnabled = false;
    document.getElementById('time-toggle').classList.remove('on');
    document.getElementById('time-drum-wrap').style.display = 'none';
    document.getElementById('h-time').value = '';
    syncDrumDisplay();
}
function setDrumFromString(timeStr) {
    if (!timeStr) { resetDrum(); return; }
    const m = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) { resetDrum(); return; }
    drumHour = parseInt(m[1]); drumMin = parseInt(m[2]);
    drumAmpm = (m[3] || 'AM').toUpperCase();
    timeEnabled = true;
    document.getElementById('time-toggle').classList.add('on');
    document.getElementById('time-drum-wrap').style.display = 'flex';
    syncDrumDisplay(); syncHiddenTime();
}

// ── REMINDERS ──
function scheduleReminders(habit) {
    if (!('Notification' in window) || Notification.permission === 'denied') return;
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => { if (p === 'granted') doScheduleReminder(habit); });
    } else { doScheduleReminder(habit); }
}
function doScheduleReminder(habit) {
    const [hh, mm] = parseTime(habit.time) || [8, 0];
    const now = new Date(), next = new Date();
    next.setHours(hh, mm, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const remaining = habit.goalDays - (habit.doneDates||[]).length;
    setTimeout(() => {
        if (Notification.permission === 'granted' && remaining > 0) {
            new Notification(`⚡ HabitQuest — ${habit.name}`, {
                body: `${remaining} days left to form this habit! Keep going 🔥`,
                icon: '/favicon.ico',
            });
        }
    }, next.getTime() - now.getTime());
}
function parseTime(timeStr) {
    if (!timeStr) return null;
    const m = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return null;
    let hh = parseInt(m[1]), mm = parseInt(m[2]);
    const ap = (m[3] || '').toUpperCase();
    if (ap === 'PM' && hh < 12) hh += 12;
    if (ap === 'AM' && hh === 12) hh = 0;
    return [hh, mm];
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeDeleteModal(); }
});

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    loadThemePrefs();
    loadHabits();
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    const customInput = document.getElementById('h-custom-days');
    if (customInput) customInput.addEventListener('input', updateXpPreview);
});

// ── EXPOSE TO HTML onclick HANDLERS ──
window.toggleDone       = toggleDone;
window.openEditModal    = openEditModal;
window.openDeleteModal  = openDeleteModal;
window.closeModal       = closeModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete    = confirmDelete;
window.saveHabit        = saveHabit;
window.setFilter        = setFilter;
window.openModal        = openModal;
window.pickCat          = pickCat;
window.pickGoal         = pickGoal;
window.toggleTimePicker = toggleTimePicker;
window.drumChange       = drumChange;