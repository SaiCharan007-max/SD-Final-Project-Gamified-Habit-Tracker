// ============================================
//  HABITQUEST — ACHIEVEMENTS JS
// ============================================

// ── ACHIEVEMENT DEFINITIONS ──
const ACHIEVEMENTS = [
    // ── HABIT ──
    { id:'first_habit',   icon:'🌱', name:'FIRST STEP',      desc:'Add your very first habit.',                   cat:'habit',  rarity:'common', xpBonus:20,
      check: (s) => s.totalHabits >= 1,       progress: (s) => ({ val: Math.min(s.totalHabits,1),       max:1   }) },
    { id:'five_habits',   icon:'🪴', name:'GROWING',         desc:'Add 5 habits to your list.',                   cat:'habit',  rarity:'common', xpBonus:30,
      check: (s) => s.totalHabits >= 5,       progress: (s) => ({ val: Math.min(s.totalHabits,5),       max:5   }) },
    { id:'ten_habits',    icon:'🌳', name:'HABIT FOREST',    desc:'Add 10 habits to your list.',                  cat:'habit',  rarity:'rare',   xpBonus:60,
      check: (s) => s.totalHabits >= 10,      progress: (s) => ({ val: Math.min(s.totalHabits,10),      max:10  }) },
    { id:'habit_50',      icon:'💪', name:'WARRIOR',         desc:'Complete 50 habits total.',                    cat:'habit',  rarity:'rare',   xpBonus:80,
      check: (s) => s.habitsCompleted >= 50,  progress: (s) => ({ val: Math.min(s.habitsCompleted,50),  max:50  }) },
    { id:'habit_100',     icon:'🏅', name:'CENTURION',       desc:'Complete 100 habits total.',                   cat:'habit',  rarity:'epic',   xpBonus:150,
      check: (s) => s.habitsCompleted >= 100, progress: (s) => ({ val: Math.min(s.habitsCompleted,100), max:100 }) },
    { id:'formed_1',      icon:'⭐', name:'FORMED ONE',      desc:'Fully form your first habit (complete goal).', cat:'habit',  rarity:'rare',   xpBonus:100,
      check: (s) => s.habitsFormed >= 1,      progress: (s) => ({ val: Math.min(s.habitsFormed,1),      max:1   }) },
    { id:'formed_3',      icon:'🌟', name:'HABIT MASTER',    desc:'Fully form 3 habits.',                         cat:'habit',  rarity:'epic',   xpBonus:200,
      check: (s) => s.habitsFormed >= 3,      progress: (s) => ({ val: Math.min(s.habitsFormed,3),      max:3   }) },
    { id:'formed_5',      icon:'🏆', name:'LEGEND BUILDER',  desc:'Fully form 5 habits.',                         cat:'habit',  rarity:'legend', xpBonus:400,
      check: (s) => s.habitsFormed >= 5,      progress: (s) => ({ val: Math.min(s.habitsFormed,5),      max:5   }) },

    // ── STREAK ──
    { id:'streak_3',      icon:'🔥', name:'ON FIRE',         desc:'Maintain a 3-day streak.',                     cat:'streak', rarity:'common', xpBonus:20,
      check: (s) => s.currentStreak >= 3,     progress: (s) => ({ val: Math.min(s.currentStreak,3),    max:3   }) },
    { id:'streak_7',      icon:'⚡', name:'LIGHTNING',       desc:'Maintain a 7-day streak.',                     cat:'streak', rarity:'common', xpBonus:50,
      check: (s) => s.currentStreak >= 7,     progress: (s) => ({ val: Math.min(s.currentStreak,7),    max:7   }) },
    { id:'streak_14',     icon:'🌙', name:'TWO WEEKS',       desc:'Maintain a 14-day streak.',                    cat:'streak', rarity:'rare',   xpBonus:100,
      check: (s) => s.longestStreak >= 14,    progress: (s) => ({ val: Math.min(s.longestStreak,14),   max:14  }) },
    { id:'streak_30',     icon:'💎', name:'DIAMOND',         desc:'Maintain a 30-day streak.',                    cat:'streak', rarity:'epic',   xpBonus:200,
      check: (s) => s.longestStreak >= 30,    progress: (s) => ({ val: Math.min(s.longestStreak,30),   max:30  }) },
    { id:'streak_100',    icon:'👑', name:'CENTURY KING',    desc:'Maintain a 100-day streak.',                   cat:'streak', rarity:'legend', xpBonus:500,
      check: (s) => s.longestStreak >= 100,   progress: (s) => ({ val: Math.min(s.longestStreak,100),  max:100 }) },

    // ── XP MILESTONES ──
    { id:'xp_100',        icon:'✨', name:'SPARK',           desc:'Earn 100 XP.',                                 cat:'xp',     rarity:'common', xpBonus:0,
      check: (s) => s.xp >= 100,             progress: (s) => ({ val: Math.min(s.xp,100),             max:100   }) },
    { id:'xp_500',        icon:'💫', name:'RISING STAR',     desc:'Earn 500 XP.',                                 cat:'xp',     rarity:'common', xpBonus:50,
      check: (s) => s.xp >= 500,             progress: (s) => ({ val: Math.min(s.xp,500),             max:500   }) },
    { id:'xp_1000',       icon:'🚀', name:'THOUSAND',        desc:'Earn 1,000 XP.',                               cat:'xp',     rarity:'rare',   xpBonus:100,
      check: (s) => s.xp >= 1000,            progress: (s) => ({ val: Math.min(s.xp,1000),            max:1000  }) },
    { id:'xp_5000',       icon:'🌠', name:'STAR FORGED',     desc:'Earn 5,000 XP.',                               cat:'xp',     rarity:'epic',   xpBonus:300,
      check: (s) => s.xp >= 5000,            progress: (s) => ({ val: Math.min(s.xp,5000),            max:5000  }) },
    { id:'xp_10000',      icon:'🌌', name:'GALAXY BRAIN',    desc:'Earn 10,000 XP.',                              cat:'xp',     rarity:'legend', xpBonus:1000,
      check: (s) => s.xp >= 10000,           progress: (s) => ({ val: Math.min(s.xp,10000),           max:10000 }) },

    // ── LEVEL ──
    { id:'level_5',       icon:'🎯', name:'FOCUSED',         desc:'Reach Level 5.',                               cat:'xp',     rarity:'rare',   xpBonus:100,
      check: (s) => s.level >= 5,            progress: (s) => ({ val: Math.min(s.level,5),            max:5     }) },
    { id:'level_10',      icon:'🏰', name:'CHAMPION',        desc:'Reach Level 10.',                              cat:'xp',     rarity:'epic',   xpBonus:250,
      check: (s) => s.level >= 10,           progress: (s) => ({ val: Math.min(s.level,10),           max:10    }) },
    { id:'level_20',      icon:'🌍', name:'GRANDMASTER',     desc:'Reach Level 20.',                              cat:'xp',     rarity:'legend', xpBonus:500,
      check: (s) => s.level >= 20,           progress: (s) => ({ val: Math.min(s.level,20),           max:20    }) },
];

const RARITY_LABELS = { common:'COMMON', rare:'RARE', epic:'EPIC', legend:'LEGENDARY' };

let currentFilter = 'all';
let playerStats   = {};

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

// ── LOAD PLAYER STATS (with backend XP/level) ──
async function loadPlayerStats() {
    const token = localStorage.getItem('token');

    const streak  = JSON.parse(localStorage.getItem('hq-streak') || '{}');
    const habits  = JSON.parse(localStorage.getItem('habits')    || '[]');
    const history = JSON.parse(localStorage.getItem('hq-habit-history') || '{}');
    const lsStats = JSON.parse(localStorage.getItem('stats') || '{}');

    const habitsCompleted = Object.values(history).reduce((a,b) => a+b, 0);
    const habitsFormed    = habits.filter(h => (h.doneDates||[]).length >= (h.goalDays||21)).length;

    // Start with localStorage values as fallback
    let xp    = lsStats.xp    || 0;
    let level = lsStats.level || 1;

    // Pull real XP + level from backend
    if (token) {
        try {
            const userId = JSON.parse(atob(token.split('.')[1])).userId;
            const res    = await fetch('http://localhost:3137/api/leaderboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const me   = (data.data||[]).find(u => u.userId===userId||u.id===userId);
                if (me) { xp = me.total_points||0; level = me.level||1; }
            }
        } catch(e) { /* use localStorage fallback */ }
    }

    playerStats = {
        xp,
        level,
        totalHabits:     habits.length,
        habitsCompleted,
        habitsFormed,
        currentStreak:   streak.current || 0,
        longestStreak:   streak.longest || 0,
    };
}

// ── COMPUTE EARNED ──
function isEarned(ach) {
    return ach.check(playerStats);
}

// ── RENDER ──
function render() {
    const grid = document.getElementById('achievements-grid');

    const filtered = ACHIEVEMENTS.filter(a => {
        if (currentFilter === 'all')    return true;
        if (currentFilter === 'earned') return isEarned(a);
        if (currentFilter === 'locked') return !isEarned(a);
        return a.cat === currentFilter;
    });

    grid.innerHTML = filtered.map(a => renderCard(a)).join('');

    setTimeout(() => {
        document.querySelectorAll('.ach-mini-fill').forEach(el => {
            el.style.width = el.dataset.pct + '%';
        });
    }, 100);

    updateSummary();
}

function renderCard(a) {
    const earned = isEarned(a);
    const prog   = a.progress(playerStats);
    const pct    = Math.min((prog.val / prog.max) * 100, 100);

    return `
    <div class="rarity-${a.rarity}">
    <div class="ach-card ${earned ? 'earned' : 'locked'}" onclick="openDetail('${a.id}')">
        ${earned ? '<span class="ach-earned-stamp">✅</span>' : '<span class="ach-lock-icon"><i class="fa-solid fa-lock"></i></span>'}
        <span class="ach-icon">${a.icon}</span>
        <div class="ach-name">${a.name}</div>
        <div class="ach-type">${RARITY_LABELS[a.rarity]} · ${a.cat.toUpperCase()}</div>
        <div class="ach-mini-bar">
            <div class="ach-mini-fill" data-pct="${pct}" style="width:0%"></div>
        </div>
    </div>
    </div>`;
}

function updateSummary() {
    const total   = ACHIEVEMENTS.length;
    const earned  = ACHIEVEMENTS.filter(a => isEarned(a)).length;
    const locked  = total - earned;
    const pct     = Math.round((earned / total) * 100);
    const bonusXp = ACHIEVEMENTS.filter(a => isEarned(a)).reduce((s,a) => s + a.xpBonus, 0);

    document.getElementById('sum-earned').textContent  = earned;
    document.getElementById('sum-locked').textContent  = locked;
    document.getElementById('sum-pct').textContent     = pct + '%';
    document.getElementById('sum-xp').textContent      = bonusXp;
    document.getElementById('total-badge').textContent = `${earned} / ${total}`;

    setTimeout(() => {
        document.getElementById('overall-bar').style.width = pct + '%';
    }, 150);
}

// ── FILTER ──
function setFilter(f) {
    currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.f === f));
    render();
}

// ── DETAIL MODAL ──
function openDetail(id) {
    const a      = ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    const earned = isEarned(a);
    const prog   = a.progress(playerStats);
    const pct    = Math.min((prog.val / prog.max) * 100, 100);

    document.getElementById('m-icon').textContent = a.icon;
    document.getElementById('m-name').textContent = a.name;
    document.getElementById('m-desc').textContent = a.desc;

    const statusEl = document.getElementById('m-status');
    statusEl.textContent = earned ? '✅ EARNED' : '🔒 LOCKED';
    statusEl.className   = 'modal-status ' + (earned ? 'earned' : 'locked');

    const progWrap = document.getElementById('m-progress-wrap');
    if (prog.max > 1 || !earned) {
        progWrap.style.display = 'block';
        document.getElementById('m-prog-label').textContent =
            `${prog.val} / ${prog.max}  ·  ${RARITY_LABELS[a.rarity]}  ·  +${a.xpBonus} BONUS XP`;
        setTimeout(() => {
            document.getElementById('m-prog-fill').style.width = pct + '%';
        }, 50);
    } else {
        progWrap.style.display = 'none';
    }

    document.getElementById('detail-modal').classList.add('active');
}

function closeDetail() {
    document.getElementById('detail-modal').classList.remove('active');
    document.getElementById('m-prog-fill').style.width = '0%';
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDetail();
});

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
    // ── FIX: requireAuth guard ──
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'index.html'; return; }

    loadThemePrefs();

    // ── FIX: await backend XP before rendering ──
    await loadPlayerStats();
    render();
});

// ── EXPOSE TO HTML ──
window.setFilter   = setFilter;
window.openDetail  = openDetail;
window.closeDetail = closeDetail;