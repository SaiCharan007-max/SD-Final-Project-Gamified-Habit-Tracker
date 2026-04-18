// ============================================
//  HABITQUEST — TIMETABLE JS (Backend wired)
// ============================================
import { timetableAPI, requireAuth } from './api.js';

const DAYS_SHORT  = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const HOUR_HEIGHT = 60;
const START_HOUR  = 5;
const END_HOUR    = 24;

// schedule[0..6] = array of slot objects per day
let schedule      = Array.from({length: 7}, () => []);
let weekOffset    = 0;
let editingId     = null;   // backend UUID
let editingDay    = null;
let pendingDay    = null;
let pendingHour   = null;
let selectedColor = 'orange';

let modalDone      = false;
let modalImportant = false;
let modalReminder  = false;

let firedReminders = new Set(JSON.parse(sessionStorage.getItem('firedReminders') || '[]'));

// ── THEME ──
function loadThemePrefs() {
    const raw = localStorage.getItem('hq-prefs');
    if (!raw) return;
    try {
        const p = JSON.parse(raw);
        if (p.mode)  document.documentElement.setAttribute('data-mode',  p.mode);
        if (p.theme) document.documentElement.setAttribute('data-theme', p.theme);
        if (p.bg) {
            const BG  = {default:'linear-gradient(135deg,#0a0a0a,#1a0a00)',space:'linear-gradient(135deg,#020817,#0a1628)',forest:'linear-gradient(135deg,#051a0f,#0a2e1a)',dusk:'linear-gradient(135deg,#1a0530,#0d0020)',steel:'linear-gradient(135deg,#0a0e1a,#141928)',crimson:'linear-gradient(135deg,#1a0505,#2a0a0a)'};
            const BGL = {default:'linear-gradient(135deg,#f5f0eb,#ede4d8)',space:'linear-gradient(135deg,#e8f0f5,#d8e8f0)',forest:'linear-gradient(135deg,#e8f5ee,#d8f0e4)',dusk:'linear-gradient(135deg,#f0e8f5,#e8d8f0)',steel:'linear-gradient(135deg,#eaedf5,#d8dced)',crimson:'linear-gradient(135deg,#f5e8e8,#f0d8d8)'};
            const g = (p.mode === 'light' ? BGL : BG)[p.bg] || BG.default;
            document.documentElement.style.setProperty('--bg-gradient', g);
        }
        if (p.accent) {
            const hex = p.accent;
            const r=parseInt(hex.slice(1,3),16), g2=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
            document.documentElement.style.setProperty('--accent',       hex);
            document.documentElement.style.setProperty('--accent-rgb',   `${r},${g2},${b}`);
            document.documentElement.style.setProperty('--accent-dim',   `rgba(${r},${g2},${b},0.12)`);
            document.documentElement.style.setProperty('--accent-border',`rgba(${r},${g2},${b},0.25)`);
            document.documentElement.style.setProperty('--accent-glow',  `rgba(${r},${g2},${b},0.4)`);
        }
    } catch(e) {}
}

// ── HELPERS ──
function getTodayDayIndex() {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
}
function timeToMins(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}
function minsToTime(mins) {
    return `${Math.floor(mins/60).toString().padStart(2,'0')}:${(mins%60).toString().padStart(2,'0')}`;
}
function getWeekDates() {
    const today = new Date();
    const dow   = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow + weekOffset * 7);
    return Array.from({length:7}, (_,i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

// ── EXTRAS: UI-only fields stored in localStorage by slot id ──
function getSlotExtras(id) {
    const all = JSON.parse(localStorage.getItem('hq-slot-extras') || '{}');
    return all[id] || {};
}
function saveSlotExtras(id, data) {
    const all = JSON.parse(localStorage.getItem('hq-slot-extras') || '{}');
    all[id] = { ...(all[id] || {}), ...data };
    localStorage.setItem('hq-slot-extras', JSON.stringify(all));
}
function deleteSlotExtras(id) {
    const all = JSON.parse(localStorage.getItem('hq-slot-extras') || '{}');
    delete all[id];
    localStorage.setItem('hq-slot-extras', JSON.stringify(all));
}

// ── ENRICH: backend slot → UI slot ──
function enrich(bs) {
    const extras = getSlotExtras(bs.id);
    // Backend: day_of_week, title, start_time (HH:MM:SS), end_time (HH:MM:SS)
    // Trim seconds if present
    const trimTime = t => t ? t.slice(0,5) : '00:00';
    return {
        id:        bs.id,
        day:       bs.day_of_week,
        subject:   bs.title,
        start:     trimTime(bs.start_time),
        end:       trimTime(bs.end_time),
        color:     extras.color     || 'orange',
        done:      extras.done      || false,
        important: extras.important || false,
        reminder:  extras.reminder  || false,
    };
}

function normalizeDayIndex(value) {
    const day = Number(value);
    return Number.isInteger(day) ? day : -1;
}

function sortDaySlots(dayIndex) {
    if (dayIndex < 0 || dayIndex > 6) return;
    schedule[dayIndex].sort((a, b) => a.start.localeCompare(b.start));
}

function removeSlotFromSchedule(slotId) {
    schedule = schedule.map(daySlots => daySlots.filter(slot => slot.id !== slotId));
}

function upsertSlotInSchedule(slot) {
    const dayIndex = normalizeDayIndex(slot.day);
    if (dayIndex < 0 || dayIndex > 6) return;

    removeSlotFromSchedule(slot.id);
    schedule[dayIndex].push(slot);
    sortDaySlots(dayIndex);
}

function commitScheduleToUi() {
    syncDashboard();
    render();
}

async function refreshScheduleFromServer() {
    await loadSchedule();
    render();
}

// ── LOAD FROM BACKEND ──
async function loadSchedule() {
    try {
        const res   = await timetableAPI.getAll();
        const slots = (res.data || []).map(enrich);

        // Re-build schedule[0..6]
        schedule = Array.from({length: 7}, () => []);
        slots.forEach(s => {
            if (s.day >= 0 && s.day <= 6) schedule[s.day].push(s);
        });

        // Sync dashboard preview
        syncDashboard();
    } catch(e) {
        console.error('Failed to load timetable:', e);
        // Fallback to localStorage
        const raw = localStorage.getItem('hq-schedule');
        if (raw) {
            try { schedule = JSON.parse(raw); } catch {}
        }
    }
}

function syncDashboard() {
    const todayIdx = getTodayDayIndex();
    const simplified = (schedule[todayIdx] || [])
        .sort((a,b) => a.start.localeCompare(b.start))
        .map(s => ({ time: s.start, label: s.subject }));
    localStorage.setItem('timetable', JSON.stringify(simplified));
    localStorage.setItem('hq-schedule', JSON.stringify(schedule));
}

// ── RENDER ──
function render() {
    renderHeaders();
    renderGrid();
    renderEvents();
    renderCurrentTimeLine();
}

function renderHeaders() {
    const dates    = getWeekDates();
    const todayIdx = weekOffset === 0 ? getTodayDayIndex() : -1;
    const fmt      = d => d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    document.getElementById('week-label').textContent =
        weekOffset === 0 ? 'THIS WEEK' : weekOffset === -1 ? 'LAST WEEK' :
        weekOffset === 1 ? 'NEXT WEEK' : `${fmt(dates[0])} — ${fmt(dates[6])}`;

    DAYS_SHORT.forEach((name, i) => {
        const header = document.getElementById(`day-${name.toLowerCase()}`);
        document.getElementById(`num-${i}`).textContent = dates[i].getDate();
        if (header) header.classList.toggle('today', i === todayIdx);
    });
}

function renderGrid() {
    const gridBody = document.getElementById('grid-body');
    const todayIdx = weekOffset === 0 ? getTodayDayIndex() : -1;
    let html = '<div class="grid-inner" id="grid-inner">';
    for (let h = START_HOUR; h < END_HOUR; h++) {
        const label = h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h-12} PM`;
        html += `<div class="time-label">${label}</div>`;
        for (let d = 0; d < 7; d++) {
            html += `<div class="grid-cell ${d === todayIdx ? 'today-col' : ''}"
                data-day="${d}" data-hour="${h}"
                onclick="onCellClick(${d},${h})"></div>`;
        }
    }
    html += '<div class="events-layer" id="events-layer">';
    for (let d = 0; d < 7; d++) html += `<div class="day-events-col" id="col-${d}"></div>`;
    html += '</div></div>';
    gridBody.innerHTML = html;
}

function renderEvents() {
    for (let d = 0; d < 7; d++) {
        const col = document.getElementById(`col-${d}`);
        if (!col) continue;
        col.innerHTML = '';
        (schedule[d] || []).forEach(slot => {
            const startMins = timeToMins(slot.start);
            const endMins   = timeToMins(slot.end);
            const top    = (startMins/60 - START_HOUR) * HOUR_HEIGHT;
            const height = Math.max(((endMins - startMins)/60) * HOUR_HEIGHT - 4, 22);

            const block = document.createElement('div');
            block.className = `event-block${slot.done?' done':''}${slot.important?' important':''}`;
            block.setAttribute('data-color', slot.color || 'orange');
            block.style.top    = `${top}px`;
            block.style.height = `${height}px`;

            const doneBadge = slot.done      ? `<div class="event-done-check">✓</div>` : '';
            const starBadge = slot.important ? `<div class="event-star"><i class="fa-solid fa-star"></i></div>` : '';
            const bellBadge = slot.reminder  ? `<div class="event-bell"><i class="fa-solid fa-bell"></i></div>` : '';
            const showTime  = height > 30;

            block.innerHTML = `
                <div class="event-top-row">
                    <div class="event-name">${slot.subject}</div>
                    <div class="event-badges">${starBadge}${bellBadge}${doneBadge}</div>
                </div>
                ${showTime ? `<div class="event-time">${slot.start} – ${slot.end}</div>` : ''}
            `;
            block.addEventListener('click', e => { e.stopPropagation(); openEditModal(d, slot.id); });
            col.appendChild(block);
        });
    }
}

function renderCurrentTimeLine() {
    const existing = document.getElementById('current-time-line');
    if (existing) existing.remove();
    if (weekOffset !== 0) return;
    const now  = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    if (mins < START_HOUR * 60 || mins >= END_HOUR * 60) return;
    const top  = (mins/60 - START_HOUR) * HOUR_HEIGHT;
    const line = document.createElement('div');
    line.id        = 'current-time-line';
    line.className = 'current-time-line';
    line.style.top = `${top}px`;
    line.innerHTML = `<div class="current-time-dot"></div><div class="current-time-bar"></div>`;
    const gridInner = document.getElementById('grid-inner');
    if (gridInner) gridInner.appendChild(line);
    const gridBody = document.getElementById('grid-body');
    if (gridBody && !window._scrolledToNow) {
        window._scrolledToNow = true;
        setTimeout(() => gridBody.scrollTo({ top: Math.max(0, top - 150), behavior: 'smooth' }), 150);
    }
}

// ── NAV ──
function changeWeek(dir) { weekOffset += dir; render(); }
function goToday()       { weekOffset = 0;    render(); }

// ── CELL CLICK (add) ──
function onCellClick(dayIndex, hour) {
    pendingDay = dayIndex; pendingHour = hour;
    editingId  = null;     editingDay  = null;

    document.getElementById('modal-title').textContent   = 'ADD ACTIVITY';
    document.getElementById('slot-subject').value        = '';
    document.getElementById('slot-start').value          = minsToTime(hour * 60);
    document.getElementById('slot-end').value            = minsToTime(hour * 60 + 60);
    document.getElementById('modal-error').textContent   = '';
    document.getElementById('delete-btn').style.display  = 'none';

    setModalDone(false);
    setModalImportant(false);
    setModalReminder(false);
    setColorOption(selectedColor);

    document.getElementById('slot-modal').classList.add('active');
    setTimeout(() => document.getElementById('slot-subject').focus(), 100);
}

// ── EDIT MODAL ──
function openEditModal(dayIndex, slotId) {
    const slot = (schedule[dayIndex] || []).find(s => s.id === slotId);
    if (!slot) return;

    editingId  = slotId; editingDay  = dayIndex;
    pendingDay = null;   pendingHour = null;

    document.getElementById('modal-title').textContent   = 'EDIT ACTIVITY';
    document.getElementById('slot-subject').value        = slot.subject;
    document.getElementById('slot-start').value          = slot.start;
    document.getElementById('slot-end').value            = slot.end;
    document.getElementById('modal-error').textContent   = '';
    document.getElementById('delete-btn').style.display  = 'flex';

    setModalDone(!!slot.done);
    setModalImportant(!!slot.important);
    setModalReminder(!!slot.reminder);
    setColorOption(slot.color || 'orange');

    document.getElementById('slot-modal').classList.add('active');
    setTimeout(() => document.getElementById('slot-subject').focus(), 100);
}

function closeModal() {
    document.getElementById('slot-modal').classList.remove('active');
    editingId = null; editingDay = null;
}

// ── MODAL TOGGLES ──
function toggleModalDone()      { setModalDone(!modalDone); }
function toggleModalImportant() { setModalImportant(!modalImportant); }
function toggleModalReminder()  { setModalReminder(!modalReminder); }

function setModalDone(val) {
    modalDone = val;
    document.getElementById('modal-done-check').classList.toggle('checked', val);
}
function setModalImportant(val) {
    modalImportant = val;
    const el = document.getElementById('modal-star');
    el.classList.toggle('active', val);
    el.innerHTML = val ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
}
function setModalReminder(val) {
    modalReminder = val;
    const el = document.getElementById('modal-bell');
    el.classList.toggle('active', val);
    el.innerHTML = val ? '<i class="fa-solid fa-bell"></i>' : '<i class="fa-regular fa-bell"></i>';
    if (val && Notification.permission === 'default') Notification.requestPermission();
}

// ── COLOR ──
function setColorOption(color) {
    selectedColor = color;
    document.querySelectorAll('.color-opt').forEach(el =>
        el.classList.toggle('active', el.dataset.color === color));
}

// ── SAVE SLOT ──
async function saveSlot() {
    const subject = document.getElementById('slot-subject').value.trim();
    const start   = document.getElementById('slot-start').value;
    const end     = document.getElementById('slot-end').value;
    const errEl   = document.getElementById('modal-error');

    if (!subject) { errEl.textContent = 'Enter an activity name.'; return; }
    if (!start || !end) { errEl.textContent = 'Set start and end time.'; return; }
    if (timeToMins(end) <= timeToMins(start)) { errEl.textContent = 'End must be after start.'; return; }

    if (editingId !== null) {
        // ── EDIT: delete old + create new (backend has no PUT for timetable) ──
        try {
            await timetableAPI.deleteSlot(editingId);
            deleteSlotExtras(editingId);
        } catch(e) { console.warn('Could not delete old slot:', e); }

        try {
            const res    = await timetableAPI.addSlot({
                day:         editingDay,
                title:       subject,
                start_time:  start,
                end_time:    end,
            });
            const newId = res.data?.id;
            if (newId) saveSlotExtras(newId, { color: selectedColor, done: modalDone, important: modalImportant, reminder: modalReminder });
            removeSlotFromSchedule(editingId);
            if (res.data) upsertSlotInSchedule(enrich(res.data));
        } catch(e) {
            errEl.textContent = e?.message ? `Failed to save: ${e.message}` : 'Failed to save. Try again.';
            await loadAndRender();
            return;
        }

    } else {
        // ── ADD NEW ──
        const day = pendingDay !== null ? pendingDay : 0;
        try {
            const res   = await timetableAPI.addSlot({
                day:         day,
                title:       subject,
                start_time:  start,
                end_time:    end,
            });
            const newId = res.data?.id;
            if (newId) saveSlotExtras(newId, { color: selectedColor, done: modalDone, important: modalImportant, reminder: modalReminder });
            if (res.data) upsertSlotInSchedule(enrich(res.data));
        } catch(e) {
            errEl.textContent = e?.message ? `Failed to save: ${e.message}` : 'Failed to save. Try again.';
            return;
        }
    }

    closeModal();
    commitScheduleToUi();
    await refreshScheduleFromServer();
}

// ── DELETE SLOT ──
async function deleteSlot() {
    if (!editingId || editingDay === null) return;
    try {
        await timetableAPI.deleteSlot(editingId);
        deleteSlotExtras(editingId);
        removeSlotFromSchedule(editingId);
    } catch(e) {
        console.warn('Delete failed:', e);
    }
    closeModal();
    commitScheduleToUi();
    await refreshScheduleFromServer();
}

// ── UPDATE EXTRAS LOCALLY (done/important/reminder don't need backend) ──
// When user toggles these in edit modal, we save them on saveSlot.
// For immediate toggle without saving, not supported (keep it simple).

async function loadAndRender() {
    await loadSchedule();
    render();
}

// ── REMINDERS ──
function checkReminders() {
    if (weekOffset !== 0) return;
    const now         = new Date();
    const todayIdx    = getTodayDayIndex();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    (schedule[todayIdx] || []).forEach(slot => {
        if (!slot.reminder || slot.done) return;
        const slotMins = timeToMins(slot.start);
        const key      = `${slot.id}-${slot.start}`;
        if ((slotMins - currentMins === 1 || slotMins === currentMins) && !firedReminders.has(key)) {
            firedReminders.add(key);
            sessionStorage.setItem('firedReminders', JSON.stringify([...firedReminders]));
            const msg = slotMins === currentMins
                ? `"${slot.subject}" is starting now!`
                : `"${slot.subject}" starts in 1 minute!`;
            showToast(slot.important ? '⭐ ' + slot.subject : slot.subject, msg);
            if (Notification.permission === 'granted') {
                new Notification('HabitQuest Reminder', { body: msg, tag: key });
            }
        }
    });
}

function showToast(title, msg) {
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-msg').textContent   = msg;
    const toast = document.getElementById('reminder-toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 6000);
}
function closeToast() {
    document.getElementById('reminder-toast').classList.remove('show');
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && document.getElementById('slot-modal').classList.contains('active')) saveSlot();
});

// ── TIMERS ──
setInterval(() => {
    if (weekOffset === 0) renderCurrentTimeLine();
    checkReminders();
}, 30000);

// ── COLOR OPTS ──
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.color-opt').forEach(el => {
        el.addEventListener('click', () => setColorOption(el.dataset.color));
    });
});

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
    requireAuth();
    loadThemePrefs();
    await loadSchedule();
    render();
    checkReminders();
    if (Notification.permission === 'default') Notification.requestPermission();
});

// ── EXPOSE TO HTML ──
window.onCellClick        = onCellClick;
window.openEditModal      = openEditModal;
window.closeModal         = closeModal;
window.saveSlot           = saveSlot;
window.deleteSlot         = deleteSlot;
window.toggleModalDone    = toggleModalDone;
window.toggleModalImportant = toggleModalImportant;
window.toggleModalReminder  = toggleModalReminder;
window.changeWeek         = changeWeek;
window.goToday            = goToday;
window.closeToast         = closeToast;
