// ============================================
//  HABITQUEST — PROFILE JS
// ============================================

const BADGES_ALL = [
    { emoji:'🔥', name:'ON FIRE',       desc:'Complete 7 habits in a row',   earned:true  },
    { emoji:'⚡', name:'LIGHTNING',     desc:'Finish a focus session',        earned:true  },
    { emoji:'🏆', name:'CHAMPION',      desc:'Reach Level 5',                 earned:false },
    { emoji:'💎', name:'DIAMOND',       desc:'30-day streak',                 earned:false },
    { emoji:'🌟', name:'SUPERSTAR',     desc:'Earn all other badges',         earned:false },
    { emoji:'🎯', name:'FOCUSED',       desc:'10 focus sessions completed',   earned:false },
    { emoji:'📚', name:'SCHOLAR',       desc:'Study for 10 hours total',      earned:false },
    { emoji:'💪', name:'WARRIOR',       desc:'Complete 50 habits',            earned:false },
];

let isEditing = false;

// ── THEME LOADER ──
function loadThemePrefs() {
    const raw = localStorage.getItem('hq-prefs');
    if (!raw) return;
    try {
        const prefs = JSON.parse(raw);
        if (prefs.mode)  document.documentElement.setAttribute('data-mode',  prefs.mode);
        if (prefs.theme) document.documentElement.setAttribute('data-theme', prefs.theme);
        if (prefs.bg) {
            const BG  = { default:'linear-gradient(135deg,#0a0a0a,#1a0a00)', space:'linear-gradient(135deg,#020817,#0a1628)', forest:'linear-gradient(135deg,#051a0f,#0a2e1a)', dusk:'linear-gradient(135deg,#1a0530,#0d0020)', steel:'linear-gradient(135deg,#0a0e1a,#141928)', crimson:'linear-gradient(135deg,#1a0505,#2a0a0a)' };
            const BGL = { default:'linear-gradient(135deg,#f5f0eb,#ede4d8)', space:'linear-gradient(135deg,#e8f0f5,#d8e8f0)', forest:'linear-gradient(135deg,#e8f5ee,#d8f0e4)', dusk:'linear-gradient(135deg,#f0e8f5,#e8d8f0)', steel:'linear-gradient(135deg,#eaedf5,#d8dced)', crimson:'linear-gradient(135deg,#f5e8e8,#f0d8d8)' };
            const isLight = prefs.mode === 'light';
            const g = (isLight ? BGL : BG)[prefs.bg] || (isLight ? BGL.default : BG.default);
            document.documentElement.style.background = g;
            document.documentElement.style.backgroundAttachment = 'fixed';
            document.documentElement.style.setProperty('--bg-gradient', g);
        }
        if (prefs.accent) {
            const hex = prefs.accent;
            const r=parseInt(hex.slice(1,3),16), g2=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
            document.documentElement.style.setProperty('--accent', hex);
            document.documentElement.style.setProperty('--accent-rgb', `${r},${g2},${b}`);
            document.documentElement.style.setProperty('--accent-dim', `rgba(${r},${g2},${b},0.12)`);
            document.documentElement.style.setProperty('--accent-border', `rgba(${r},${g2},${b},0.25)`);
            document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g2},${b},0.4)`);
        }
    } catch(e) {}
}

// ── LOAD PROFILE ──
async function loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'index.html'; return; }

    // Get name from JWT
    let username = 'PLAYER', userId = null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        username = (payload.username || payload.name || 'PLAYER').toUpperCase();
        userId   = payload.userId;
    } catch(e) {}

    const profile = JSON.parse(localStorage.getItem('hq-profile') || '{}');
    const lsStats = JSON.parse(localStorage.getItem('stats') || '{}');

    // Username + bio + avatar
    const displayName = profile.username || username;
    document.getElementById('username-display').textContent = displayName;
    document.getElementById('username-input').value = displayName;
    const bio = profile.bio || '';
    document.getElementById('bio-display').textContent = bio || 'No bio yet. Click EDIT to add one.';
    document.getElementById('bio-input').value = bio;
    if (profile.avatar) {
        document.getElementById('avatar-img').src = profile.avatar;
        document.getElementById('avatar-img').style.display = 'block';
        document.getElementById('avatar-icon').style.display = 'none';
    }

    // Pull real XP + level from backend
    let xp = lsStats.xp||0, level = lsStats.level||1;
    try {
        const res = await fetch('http://localhost:3137/api/leaderboard', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const me   = (data.data||[]).find(u => u.userId===userId||u.id===userId);
            if (me) { xp = me.total_points||0; level = me.level||1; }
        }
    } catch(e) { /* use localStorage fallback */ }

    // Local supplementary stats
    const streak   = JSON.parse(localStorage.getItem('hq-streak')  || '{}');
    const habits   = JSON.parse(localStorage.getItem('habits')      || '[]');
    const focusH   = JSON.parse(localStorage.getItem('hq-focus-history') || '{}');
    const focusMin = Object.values(focusH).reduce((a,b)=>a+b,0);
    const earnedBadges = JSON.parse(localStorage.getItem('hq-earned-badges') || '[]');
    const badges   = earnedBadges.length || lsStats.badges || 0;

    // Level badge + XP bar
    document.getElementById('level-badge').textContent = `⚔ LVL ${level}`;
    const xpNeeded = level * 500;
    document.getElementById('xp-level-text').textContent = `LEVEL ${level}`;
    document.getElementById('xp-next-text').textContent  = `LEVEL ${level + 1} →`;
    document.getElementById('xp-numbers').textContent    = `${xp} / ${xpNeeded} XP`;
    setTimeout(() => {
        document.getElementById('xp-fill').style.width = Math.min((xp / xpNeeded) * 100, 100) + '%';
    }, 400);

    // Stats grid
    document.getElementById('s-habits').textContent = habits.length;
    document.getElementById('s-streak').textContent = streak.current || 0;
    document.getElementById('s-badges').textContent = badges;
    document.getElementById('s-focus').textContent  = Math.floor(focusMin / 60) + 'h';

    renderBadges(badges);
}

function renderBadges(earnedCount) {
    const grid = document.getElementById('badges-grid');
    grid.innerHTML = BADGES_ALL.map((b, i) => {
        const earned = i < earnedCount;
        return `
            <div class="badge-item ${earned ? '' : 'locked'}">
                ${b.emoji}
                <div class="badge-tooltip">${b.name}</div>
            </div>`;
    }).join('');
}

// ── EDIT TOGGLE ──
function toggleEdit() {
    isEditing = !isEditing;

    const btn   = document.getElementById('edit-toggle-btn');
    const icon  = document.getElementById('edit-icon');
    const label = document.getElementById('edit-label');

    btn.classList.toggle('editing', isEditing);
    icon.className  = isEditing ? 'fa-solid fa-xmark' : 'fa-solid fa-pen';
    label.textContent = isEditing ? 'CANCEL' : 'EDIT';

    // Toggle username
    document.getElementById('username-display').style.display = isEditing ? 'none' : 'block';
    document.getElementById('username-input').style.display   = isEditing ? 'block' : 'none';

    // Toggle bio
    document.getElementById('bio-display').style.display = isEditing ? 'none' : 'block';
    document.getElementById('bio-input').style.display   = isEditing ? 'block' : 'none';
    document.getElementById('bio-counter').style.display = isEditing ? 'block' : 'none';

    // Toggle avatar overlay
    document.getElementById('avatar-edit-overlay').style.display = isEditing ? 'flex' : 'none';

    // Toggle save button
    document.getElementById('save-profile-btn').style.display = isEditing ? 'block' : 'none';

    if (isEditing) {
        document.getElementById('username-input').focus();
        updateBioCounter();
    }
}

// ── BIO COUNTER ──
function updateBioCounter() {
    const input = document.getElementById('bio-input');
    const counter = document.getElementById('bio-counter');
    counter.textContent = `${input.value.length} / 120`;
}

document.getElementById('bio-input').addEventListener('input', updateBioCounter);

// ── SAVE PROFILE ──
function saveProfile() {
    const username = document.getElementById('username-input').value.trim().toUpperCase() || 'PLAYER';
    const bio      = document.getElementById('bio-input').value.trim();

    const profile = JSON.parse(localStorage.getItem('hq-profile') || '{}');
    profile.username = username;
    profile.bio      = bio;
    localStorage.setItem('hq-profile', JSON.stringify(profile));

    // Update display
    document.getElementById('username-display').textContent = username;
    document.getElementById('bio-display').textContent = bio || 'No bio yet. Click EDIT to add one.';

    // Flash save button
    const btn = document.getElementById('save-profile-btn');
    btn.textContent = '✓ SAVED!';
    setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-check"></i> SAVE CHANGES';
        toggleEdit();
    }, 800);
}

// ── AVATAR UPLOAD ──
function triggerAvatarUpload() {
    document.getElementById('avatar-file-input').click();
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // Compress: crop to square + resize to 200x200
            const canvas = document.createElement('canvas');
            canvas.width = 200; canvas.height = 200;
            const ctx = canvas.getContext('2d');
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width  - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 200, 200);
            const compressed = canvas.toDataURL('image/jpeg', 0.7);

            // Show in UI
            document.getElementById('avatar-img').src = compressed;
            document.getElementById('avatar-img').style.display = 'block';
            document.getElementById('avatar-icon').style.display = 'none';

            // Save to localStorage
            try {
                const profile = JSON.parse(localStorage.getItem('hq-profile') || '{}');
                profile.avatar = compressed;
                localStorage.setItem('hq-profile', JSON.stringify(profile));
            } catch(err) {
                alert('Image too large. Please use a smaller image.');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // reset so same file can be picked again
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && isEditing && e.target.id === 'username-input') saveProfile();
    if (e.key === 'Escape' && isEditing) toggleEdit();
});

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    loadThemePrefs();
    loadProfile();
});