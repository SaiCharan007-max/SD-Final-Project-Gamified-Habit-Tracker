// ============================================
//  HABITQUEST — FOCUS JS (Backend wired)
// ============================================
import { focusAPI, requireAuth } from './api.js';

// ── STATE ──
let totalSeconds   = 25 * 60;
let remaining      = totalSeconds;
let timerInterval  = null;
let isRunning      = false;
let sessionName    = 'FOCUS SESSION';
let selectedPreset = 15;
let currentSound   = 'none';
let audioCtx       = null;
let soundNodes     = {};
let volume         = 0.4;

// Backend session tracking
let activeSessionId = null;   // set when backend session starts

const CIRCUMFERENCE = 2 * Math.PI * 118;

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

// ── TIMER ──
function toggleTimer() {
    if (isRunning) pauseTimer();
    else startTimer();
}

async function startTimer() {
    if (remaining <= 0) return;

    // Start backend session if not already started
    if (!activeSessionId) {
        try {
            const res = await focusAPI.start();
            activeSessionId = res.data?.id || null;
        } catch(e) {
            // If server is unreachable, still run locally
            console.warn('Could not start backend focus session:', e.message);
        }
    }

    isRunning = true;
    document.getElementById('play-icon').className = 'fa-solid fa-pause';
    document.getElementById('timer-status').textContent = 'FOCUSING';
    document.getElementById('ring-fill').classList.add('running');
    timerInterval = setInterval(tick, 1000);
    startParticles();
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    document.getElementById('play-icon').className = 'fa-solid fa-play';
    document.getElementById('timer-status').textContent = 'PAUSED';
    document.getElementById('ring-fill').classList.remove('running');
    stopParticles();
}

function resetTimer() {
    pauseTimer();
    // If there was a backend session, abandon it silently (no stop call — session won't be < 5 mins anyway)
    activeSessionId = null;
    remaining = totalSeconds;
    document.getElementById('timer-status').textContent = 'READY';
    updateDisplay();
}

function tick() {
    if (remaining <= 0) {
        completeSession();
        return;
    }
    remaining--;
    updateDisplay();
}

function updateDisplay() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    document.getElementById('timer-display').textContent =
        `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    const offset = CIRCUMFERENCE * (remaining / totalSeconds);
    document.getElementById('ring-fill').style.strokeDashoffset = offset;
}

// ── COMPLETE ──
async function completeSession() {
    pauseTimer();
    const mins = Math.floor(totalSeconds / 60);
    const name = sessionName || 'FOCUS SESSION';
    let xp     = calcXp(mins);
    let totalPoints = null;
    let level = null;

    // Stop backend session and get real XP back
    if (activeSessionId) {
        try {
            const res  = await focusAPI.stop(activeSessionId);
            const data = res.data || {};
            if (data.xp_gained)     xp          = data.xp_gained;
            if (data.total_points)  totalPoints  = data.total_points;
            if (data.level)         level        = data.level;
            if (data.new_badges && data.new_badges.length > 0) {
                data.new_badges.forEach(b => {
                    setTimeout(() => showBadgeToast(b.name), 2500);
                });
            }
        } catch(e) {
            console.warn('Could not stop backend session:', e.message);
        }
        activeSessionId = null;
    }

    // Save to localStorage for stats charts
    const tk = todayKey();
    const fh = JSON.parse(localStorage.getItem('hq-focus-history') || '{}');
    fh[tk] = (fh[tk] || 0) + mins;
    localStorage.setItem('hq-focus-history', JSON.stringify(fh));

    const history = JSON.parse(localStorage.getItem('hq-focus-sessions') || '[]');
    history.unshift({
        name, mins, xp,
        date: new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
        ts: Date.now(),
    });
    if (history.length > 50) history.pop();
    localStorage.setItem('hq-focus-sessions', JSON.stringify(history));

    // Show completion screen
    document.getElementById('complete-sub').textContent = `You focused for ${mins} minute${mins!==1?'s':''}`;
    document.getElementById('complete-xp').textContent  = `+${xp} XP`;
    document.getElementById('complete-overlay').classList.add('active');
}

function closeComplete() {
    document.getElementById('complete-overlay').classList.remove('active');
    resetTimer();
}

function calcXp(mins) {
    if (mins <= 15) return 15;
    if (mins <= 30) return 30;
    if (mins <= 60) return 60;
    if (mins <= 90) return 100;
    return 150;
}

function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function updateXpPreview() {
    const mins    = Math.floor(totalSeconds / 60);
    const preview = document.getElementById('xp-preview-val');
    const wrap    = document.getElementById('xp-preview');

    if (mins < 5) {
        preview.textContent = '⚠ Under 5 min — no XP will be awarded';
        wrap.style.color    = '#f43f5e';
        wrap.style.opacity  = '1';
    } else {
        preview.textContent = `+${calcXp(mins)} XP on completion`;
        wrap.style.color    = '';
        wrap.style.opacity  = '';
    }
}

// Also update warning inside the settings modal when preset/custom changes
function updateSettingsWarning() {
    const customVal = parseInt(document.getElementById('custom-min').value);
    const mins      = customVal > 0 ? Math.min(240, customVal) : selectedPreset;
    const warn      = document.getElementById('duration-warning');
    if (!warn) return;
    if (mins < 5) {
        warn.textContent = '⚠ Sessions under 5 minutes earn no XP';
        warn.style.display = 'block';
    } else {
        warn.style.display = 'none';
    }
}

// ── TOAST ──
function showBadgeToast(name) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--accent);color:#000;padding:10px 20px;border-radius:20px;font-family:Orbitron,sans-serif;font-size:11px;font-weight:700;z-index:9999;opacity:0;transition:opacity 0.3s';
    toast.textContent = `🏆 Badge unlocked: ${name}!`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; });
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ── SETTINGS ──
function openSettings() {
    if (isRunning) pauseTimer();
    document.getElementById('custom-min').value = '';
    document.getElementById('session-name-input').value = sessionName !== 'FOCUS SESSION' ? sessionName : '';
    pickPreset(selectedPreset, false);
    updateSettingsWarning();
    document.getElementById('settings-modal').classList.add('active');
}
function closeSettings() {
    document.getElementById('settings-modal').classList.remove('active');
}
function pickPreset(min, apply = true) {
    selectedPreset = min;
    document.querySelectorAll('.preset-btn').forEach(b =>
        b.classList.toggle('active', parseInt(b.dataset.min) === min));
    if (apply) document.getElementById('custom-min').value = '';
    updateSettingsWarning();
}
function applySettings() {
    const customVal = parseInt(document.getElementById('custom-min').value);
    const mins      = customVal > 0 ? Math.min(240, customVal) : selectedPreset;
    const name      = document.getElementById('session-name-input').value.trim();
    totalSeconds    = mins * 60;
    remaining       = totalSeconds;
    sessionName     = name || 'FOCUS SESSION';
    // Reset backend session on settings change
    activeSessionId = null;
    document.getElementById('session-label').textContent = sessionName.toUpperCase();
    updateDisplay();
    updateXpPreview();
    closeSettings();
}

// ── HISTORY ──
function openHistory() {
    renderHistory();
    document.getElementById('history-modal').classList.add('active');
}
function closeHistory() {
    document.getElementById('history-modal').classList.remove('active');
}
function clearHistory() {
    localStorage.removeItem('hq-focus-sessions');
    renderHistory();
}
function renderHistory() {
    const history    = JSON.parse(localStorage.getItem('hq-focus-sessions') || '[]');
    const totalMins  = history.reduce((s,h) => s+h.mins, 0);
    const totalXp    = history.reduce((s,h) => s+h.xp,  0);
    const totalSess  = history.length;
    document.getElementById('history-stats').innerHTML = `
        <div class="h-stat"><span class="h-stat-val">${totalSess}</span><span class="h-stat-lbl">SESSIONS</span></div>
        <div class="h-stat"><span class="h-stat-val">${totalMins}</span><span class="h-stat-lbl">MINUTES</span></div>
        <div class="h-stat"><span class="h-stat-val">${totalXp}</span><span class="h-stat-lbl">XP EARNED</span></div>
    `;
    if (history.length === 0) {
        document.getElementById('history-list').innerHTML =
            `<div class="history-empty">NO SESSIONS YET<br><span style="font-size:8px;opacity:0.5">Complete a focus session to see it here</span></div>`;
        return;
    }
    document.getElementById('history-list').innerHTML = history.map(h => `
        <div class="history-item">
            <span class="hi-icon">🎯</span>
            <div class="hi-info">
                <div class="hi-name">${h.name}</div>
                <div class="hi-meta">${h.date} · ${h.mins} MIN</div>
            </div>
            <span class="hi-xp">+${h.xp} XP</span>
        </div>
    `).join('');
}

// ── AMBIENT SOUNDS (Web Audio API — no files needed) ──
function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

const SOUND_GENERATORS = {
    rain:   generateRain,
    fire:   generateFire,
    cafe:   generateCafe,
    forest: generateForest,
    waves:  generateWaves,
    space:  generateSpace,
};

function setSound(name) {
    document.querySelectorAll('.sound-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.sound === name));
    stopAllSounds();
    currentSound = name;
    if (name === 'none') return;
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (SOUND_GENERATORS[name]) SOUND_GENERATORS[name]();
}

function stopAllSounds() {
    Object.values(soundNodes).forEach(n => {
        try { n.stop ? n.stop() : n.disconnect(); } catch(e) {}
    });
    soundNodes = {};
}

function setVolume(val) {
    volume = val / 100;
    if (soundNodes.gain) soundNodes.gain.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.1);
}

// ── NOISE HELPER ──
function makeNoise(type = 'white', duration = 0) {
    const bufferSize = audioCtx.sampleRate * (duration || 4);
    const buffer     = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data       = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'pink') {
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut  = data[i];
            data[i] *= 3.5;
        } else if (type === 'brown') {
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut  = data[i];
            data[i] *= 6;
        } else {
            data[i] = white;
        }
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.loop   = true;
    return src;
}
function makeGain(val) {
    const g = audioCtx.createGain();
    g.gain.value = val * volume;
    return g;
}

function generateRain() {
    const gain = makeGain(0.8), noise = makeNoise('pink');
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 0.4;
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    noise.start();
    soundNodes = { noise, filter, gain };
}
function generateFire() {
    const gain = makeGain(0.6), noise = makeNoise('brown');
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 600;
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    noise.start();
    const crackle = audioCtx.createOscillator();
    crackle.type = 'sawtooth'; crackle.frequency.value = 40;
    const cGain = audioCtx.createGain(); cGain.gain.value = 0.03 * volume;
    crackle.connect(cGain); cGain.connect(audioCtx.destination); crackle.start();
    soundNodes = { noise, filter, gain, crackle, cGain };
}
function generateCafe() {
    const gain = makeGain(0.4), noise = makeNoise('white');
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 0.6;
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    noise.start();
    soundNodes = { noise, filter, gain };
}
function generateForest() {
    const gainWind = makeGain(0.3), wind = makeNoise('pink');
    const fWind = audioCtx.createBiquadFilter();
    fWind.type = 'highpass'; fWind.frequency.value = 800;
    wind.connect(fWind); fWind.connect(gainWind); gainWind.connect(audioCtx.destination);
    wind.start();
    function chirp() {
        const osc = audioCtx.createOscillator(), gChirp = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.value = 2000 + Math.random() * 1000;
        gChirp.gain.setValueAtTime(0, audioCtx.currentTime);
        gChirp.gain.linearRampToValueAtTime(0.06 * volume, audioCtx.currentTime + 0.05);
        gChirp.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        osc.connect(gChirp); gChirp.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.35);
        setTimeout(chirp, 800 + Math.random() * 2000);
    }
    chirp();
    soundNodes = { wind, fWind, gainWind, gain: gainWind };
}
function generateWaves() {
    const gain = makeGain(0.7), noise = makeNoise('pink');
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 400;
    const lfo = audioCtx.createOscillator(), lfoGain = audioCtx.createGain();
    lfo.frequency.value = 0.15; lfoGain.gain.value = 200;
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    noise.start(); lfo.start();
    soundNodes = { noise, filter, gain, lfo, lfoGain };
}
function generateSpace() {
    const gain = makeGain(0.4);
    const osc1 = audioCtx.createOscillator(), osc2 = audioCtx.createOscillator();
    osc1.type = 'sine'; osc1.frequency.value = 60;
    osc2.type = 'sine'; osc2.frequency.value = 63;
    osc1.connect(gain); osc2.connect(gain); gain.connect(audioCtx.destination);
    osc1.start(); osc2.start();
    const shimmer = audioCtx.createOscillator(), sGain = audioCtx.createGain();
    shimmer.type = 'sine'; shimmer.frequency.value = 528;
    sGain.gain.value = 0.02 * volume;
    shimmer.connect(sGain); sGain.connect(audioCtx.destination); shimmer.start();
    soundNodes = { osc1, osc2, gain, shimmer, sGain };
}

// ── PARTICLES ──
const canvas = document.getElementById('particles-canvas');
const ctx2d  = canvas ? canvas.getContext('2d') : null;
let particles = [];
let animFrame = null;
let particlesActive = false;

function resizeCanvas() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
function startParticles() {
    if (particlesActive || !canvas) return;
    particlesActive = true;
    spawnParticles();
    animateParticles();
}
function stopParticles() {
    particlesActive = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    if (ctx2d) ctx2d.clearRect(0, 0, canvas.width, canvas.height);
}
function spawnParticles() {
    particles = Array.from({length: 30}, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.6 - 0.2,
        alpha: Math.random() * 0.5 + 0.1,
    }));
}
function animateParticles() {
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    const accentVal = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '203,115,65';
    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        ctx2d.beginPath();
        ctx2d.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx2d.fillStyle = `rgba(${accentVal},${p.alpha})`;
        ctx2d.fill();
    });
    if (particlesActive) animFrame = requestAnimationFrame(animateParticles);
}

// ── BACK ──
function goBack() {
    stopAllSounds();
    stopParticles();
    window.location.href = 'dashboard.html';
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        toggleTimer();
    }
    if (e.key === 'Escape') {
        closeSettings();
        closeHistory();
        closeComplete();
    }
});

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    loadThemePrefs();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    // Restore last used duration if saved, otherwise default to 15
    const savedMins = parseInt(localStorage.getItem('hq-focus-last-mins') || '15', 10);
    selectedPreset = savedMins;
    totalSeconds   = savedMins * 60;
    remaining      = totalSeconds;
    localStorage.setItem('hq-focus-last-mins', String(savedMins));
    updateDisplay();
    updateXpPreview();
    // Live warning when typing custom minutes in settings modal
    const customInput = document.getElementById('custom-min');
    if (customInput) customInput.addEventListener('input', updateSettingsWarning);
});

// ── EXPOSE TO HTML ──
window.toggleTimer    = toggleTimer;
window.resetTimer     = resetTimer;
window.openSettings   = openSettings;
window.closeSettings  = closeSettings;
window.pickPreset     = pickPreset;
window.applySettings  = applySettings;
window.openHistory    = openHistory;
window.closeHistory   = closeHistory;
window.clearHistory   = clearHistory;
window.closeComplete  = closeComplete;
window.setSound       = setSound;
window.setVolume      = setVolume;
window.goBack         = goBack;