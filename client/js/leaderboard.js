// ============================================
//  HABITQUEST — LEADERBOARD JS (Backend wired)
// ============================================
import { leaderboardAPI, requireAuth, getToken } from './api.js';

const TAB_CONFIG = {
    xp:     { key:'xp',     label:'XP',       unit:'XP',   icon:'⚡' },
    streak: { key:'streak', label:'STREAK',    unit:'DAYS', icon:'🔥' },
    done:   { key:'done',   label:'COMPLETED', unit:'',     icon:'✅' },
    formed: { key:'formed', label:'FORMED',    unit:'',     icon:'🌱' },
};

let allPlayers = [];
let currentTab = 'xp';

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

// ── GET CURRENT USER ID FROM JWT ──
function getMyUserId() {
    try {
        const token = getToken();
        if (!token) return null;
        return JSON.parse(atob(token.split('.')[1])).userId;
    } catch { return null; }
}

// ── ASSIGN CONSISTENT COLORS BY ID ──
const COLORS = ['#3b82f6','#f43f5e','#10b981','#a855f7','#f59e0b','#00d4ff','#ff6b35','#06d6a0','#e040fb','#ffb300'];
function colorForId(id) {
    let hash = 0;
    for (let i = 0; i < (id||'').length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length];
}

// ── LOAD FROM BACKEND ──
async function loadData() {
    showLoading(true);
    try {
        const res    = await leaderboardAPI.get();
        const myId   = getMyUserId();
        const profile = JSON.parse(localStorage.getItem('hq-profile') || '{}');

        // Backend returns: { rank, userId/id, name, total_points/xp, level }
        // Streak/done/formed only come from localStorage (backend doesn't expose those yet)
        const streak  = JSON.parse(localStorage.getItem('hq-streak') || '{}');
        const habits  = JSON.parse(localStorage.getItem('habits') || '[]');
        const history = JSON.parse(localStorage.getItem('hq-habit-history') || '{}');
        const myDone  = Object.values(history).reduce((a, b) => a + b, 0);
        const myFormed = habits.filter(h => (h.doneDates||[]).length >= (h.goalDays||21)).length;

        allPlayers = (res.data || []).map(p => {
            const isYou = (p.userId === myId || p.id === myId);
            return {
                id:     p.userId || p.id,
                isYou,
                name:   isYou && profile.username ? profile.username.toUpperCase() : (p.name || 'PLAYER').toUpperCase(),
                avatar: isYou ? (profile.avatar || null) : null,
                color:  colorForId(p.userId || p.id),
                xp:     p.total_points || p.xp || 0,
                level:  p.level || 1,
                // Streak/done/formed only available locally for current user
                streak: isYou ? (streak.current || 0) : 0,
                done:   isYou ? myDone   : 0,
                formed: isYou ? myFormed : 0,
            };
        });

        // If current user is not in the leaderboard (low XP), add them at the end
        if (myId && !allPlayers.find(p => p.isYou)) {
            allPlayers.push({
                id: myId, isYou: true,
                name:   (profile.username || 'YOU').toUpperCase(),
                avatar: profile.avatar || null,
                color:  colorForId(myId),
                xp:     0, level: 1,
                streak: streak.current || 0,
                done:   myDone,
                formed: myFormed,
            });
        }

    } catch(e) {
        console.error('Leaderboard load failed:', e);
        showError();
        return;
    }
    showLoading(false);
    render();
}

function showLoading(on) {
    document.getElementById('podium-wrap').innerHTML = on
        ? `<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:10px;letter-spacing:2px;">LOADING...</div>` : '';
    if (on) document.getElementById('list-wrap').innerHTML = '';
}

function showError() {
    showLoading(false);
    document.getElementById('podium-wrap').innerHTML =
        `<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:10px;letter-spacing:2px;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size:28px;opacity:0.3;display:block;margin-bottom:12px;"></i>
            COULD NOT LOAD LEADERBOARD<br>
            <span style="font-size:8px;opacity:0.5;margin-top:8px;display:block;">Make sure the server is running</span>
        </div>`;
}

function getRanked() {
    return [...allPlayers].sort((a, b) => (b[currentTab] || 0) - (a[currentTab] || 0));
}

function avatarHtml(p, size = 40, fontSize = 14) {
    if (p.isYou && p.avatar && p.avatar.startsWith('data:')) {
        return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex-shrink:0;">
            <img src="${p.avatar}" style="width:100%;height:100%;object-fit:cover;"/></div>`;
    }
    const initials = (p.name || '?').slice(0, 2).toUpperCase();
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${p.color||'#cb7341'};display:flex;align-items:center;justify-content:center;font-size:${fontSize}px;font-family:'Jersey 25',sans-serif;color:#0a0a0a;flex-shrink:0;">${initials}</div>`;
}

function render() {
    const ranked = getRanked();
    const cfg    = TAB_CONFIG[currentTab];
    const youIdx = ranked.findIndex(p => p.isYou);
    const you    = ranked[youIdx] || ranked[0];

    // ── PODIUM (top 3) ──
    const top3       = [...ranked.slice(0, 3)];
    while (top3.length < 3) top3.push(null);
    const podiumOrder = [top3[1], top3[0], top3[2]];
    const rankNums    = [2, 1, 3];
    const rankClass   = ['rank-2', 'rank-1', 'rank-3'];

    document.getElementById('podium-wrap').innerHTML = podiumOrder.map((p, i) => {
        if (!p) return `<div class="podium-player ${rankClass[i]}"><div style="height:80px"></div></div>`;
        const val     = p[currentTab] || 0;
        const dispVal = cfg.unit ? `${val} ${cfg.unit}` : val;
        return `
        <div class="podium-player ${rankClass[i]}">
            <div class="podium-avatar-wrap">
                ${rankNums[i] === 1 ? '<div class="podium-crown">👑</div>' : ''}
                ${avatarHtml(p, rankNums[i] === 1 ? 64 : 52, rankNums[i] === 1 ? 22 : 18)}
            </div>
            <div class="podium-name">${p.name}</div>
            ${p.isYou ? '<div class="podium-you">YOU</div>' : ''}
            <div class="podium-val">${dispVal}</div>
            <div class="podium-block"><span class="podium-rank-num">#${rankNums[i]}</span></div>
        </div>`;
    }).join('');

    // ── REST OF LIST ──
    const rest = ranked.slice(3);
    document.getElementById('list-wrap').innerHTML = rest.length === 0
        ? `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:9px;letter-spacing:2px;opacity:0.5;">ONLY ${ranked.length} PLAYER${ranked.length!==1?'S':''} SO FAR</div>`
        : rest.map((p, i) => {
            const pos     = i + 4;
            const val     = p[currentTab] || 0;
            const dispVal = cfg.unit ? `${val} ${cfg.unit}` : val;
            return `
            <div class="list-row ${p.isYou ? 'is-you' : ''}">
                <span class="list-pos">#${pos}</span>
                ${avatarHtml(p, 36, 13)}
                <div class="list-info">
                    <div class="list-name">${p.name}${p.isYou ? '<span class="you-tag">YOU</span>' : ''}</div>
                    <div class="list-sub">${cfg.icon} ${cfg.label} · LVL ${p.level || 1}</div>
                </div>
                <span class="list-val">${dispVal}</span>
            </div>`;
        }).join('');

    // ── YOUR RANK BAR ──
    if (you) {
        document.getElementById('yr-pos').textContent  = `#${youIdx + 1}`;
        document.getElementById('yr-name').textContent = you.name;
        document.getElementById('yr-val').textContent  = cfg.unit ? `${you[currentTab] || 0} ${cfg.unit}` : (you[currentTab] || 0);
        document.getElementById('yr-avatar').innerHTML = avatarHtml(you, 32, 12);
    }
}

function setTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.rank-tab').forEach(b =>
        b.classList.toggle('active', b.dataset.tab === tab));
    render();
}

document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    loadThemePrefs();
    loadData();
});

// ── EXPOSE TO HTML ──
window.setTab = setTab;