// ============================================
//  HABITQUEST DASHBOARD JS (Backend wired)
// ============================================
import { leaderboardAPI, requireAuth, getToken, logout as apiLogout } from './api.js';

const BG_GRADIENTS={default:'linear-gradient(135deg,#111016,#1a1020)',space:'linear-gradient(135deg,#0a0f1e,#0d1830)',forest:'linear-gradient(135deg,#0a1a10,#0d2818)',dusk:'linear-gradient(135deg,#180820,#100018)',steel:'linear-gradient(135deg,#0e1220,#141a2e)',crimson:'linear-gradient(135deg,#180808,#220d0d)'};
const BG_GRADIENTS_LIGHT={default:'linear-gradient(135deg,#f5f0eb,#ede4d8)',space:'linear-gradient(135deg,#e8f0f5,#d8e8f0)',forest:'linear-gradient(135deg,#e8f5ee,#d8f0e4)',dusk:'linear-gradient(135deg,#f0e8f5,#e8d8f0)',steel:'linear-gradient(135deg,#eaedf5,#d8dced)',crimson:'linear-gradient(135deg,#f5e8e8,#f0d8d8)'};
const SWATCH_DARK={default:'linear-gradient(135deg,#111016,#1a1020)',space:'linear-gradient(135deg,#0a0f1e,#0d1830)',forest:'linear-gradient(135deg,#0a1a10,#0d2818)',dusk:'linear-gradient(135deg,#180820,#100018)',steel:'linear-gradient(135deg,#0e1220,#141a2e)',crimson:'linear-gradient(135deg,#180808,#220d0d)'};
const SWATCH_LIGHT={default:'linear-gradient(135deg,#f5f0eb,#ede4d8)',space:'linear-gradient(135deg,#e8f0f5,#d8e8f0)',forest:'linear-gradient(135deg,#e8f5ee,#d8f0e4)',dusk:'linear-gradient(135deg,#f0e8f5,#e8d8f0)',steel:'linear-gradient(135deg,#eaedf5,#d8dced)',crimson:'linear-gradient(135deg,#f5e8e8,#f0d8d8)'};

// ── THEME ──
function savePrefs(){const p={mode:document.documentElement.getAttribute('data-mode')||'dark',theme:document.documentElement.getAttribute('data-theme')||'orange',bg:localStorage.getItem('hq-bg')||'default',accent:localStorage.getItem('hq-custom-accent')||''};localStorage.setItem('hq-prefs',JSON.stringify(p));}
function loadPrefs(){const raw=localStorage.getItem('hq-prefs');if(!raw){updateSwatchPreviews();return;}try{const p=JSON.parse(raw);if(p.mode)applyMode(p.mode,false);if(p.theme)applyTheme(p.theme,false);if(p.bg)applyBg(p.bg,false);if(p.accent)applyCustomAccent(p.accent,false);}catch(e){}updateSwatchPreviews();}
function setMode(m){applyMode(m,true);}
function applyMode(m,save){document.documentElement.setAttribute('data-mode',m);document.getElementById('btn-dark').classList.toggle('active',m==='dark');document.getElementById('btn-light').classList.toggle('active',m==='light');applyBg(localStorage.getItem('hq-bg')||'default',false);updateSwatchPreviews();if(save)savePrefs();}
function setTheme(n){applyTheme(n,true);}
function applyTheme(n,save){document.documentElement.setAttribute('data-theme',n);document.querySelectorAll('.preset-dot').forEach(d=>d.classList.toggle('active',d.dataset.theme===n));localStorage.removeItem('hq-custom-accent');['--accent','--accent-rgb','--accent-dim','--accent-border','--accent-glow','--bg-card','--bg-header','--bg-sidebar','--text-primary','--text-secondary','--text-muted'].forEach(v=>document.documentElement.style.removeProperty(v));if(save)savePrefs();}
function setCustomAccent(hex){applyCustomAccent(hex,true);}
function applyCustomAccent(hex,save){const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);if(!m)return;const[r,g,b]=[parseInt(m[1],16),parseInt(m[2],16),parseInt(m[3],16)];const root=document.documentElement;root.style.setProperty('--accent',hex);root.style.setProperty('--accent-rgb',`${r}, ${g}, ${b}`);root.style.setProperty('--accent-dim',`rgba(${r},${g},${b},0.12)`);root.style.setProperty('--accent-border',`rgba(${r},${g},${b},0.25)`);root.style.setProperty('--accent-glow',`rgba(${r},${g},${b},0.4)`);document.getElementById('color-hex').textContent=hex.toUpperCase();document.getElementById('accent-picker').value=hex;document.querySelectorAll('.preset-dot').forEach(d=>d.classList.remove('active'));if(save){localStorage.setItem('hq-custom-accent',hex);savePrefs();}}
function setBg(k){applyBg(k,true);}
function applyBg(k,save){const m=document.documentElement.getAttribute('data-mode')||'dark';const map=m==='light'?BG_GRADIENTS_LIGHT:BG_GRADIENTS;const g=map[k]||map['default'];document.documentElement.style.background=g;document.documentElement.style.backgroundAttachment='fixed';document.documentElement.style.setProperty('--bg-gradient',g);document.querySelectorAll('.bg-swatch').forEach(s=>s.classList.toggle('active',s.dataset.bg===k));localStorage.setItem('hq-bg',k);if(save)savePrefs();}
function updateSwatchPreviews(){const m=document.documentElement.getAttribute('data-mode')||'dark';const map=m==='light'?SWATCH_LIGHT:SWATCH_DARK;document.querySelectorAll('.bg-swatch').forEach(s=>{s.style.background=map[s.dataset.bg]||map['default'];});}
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('active');document.getElementById('overlay').classList.toggle('active');}
function logout(){apiLogout();}

// ── GET MY USER ID FROM JWT ──
function getMyUserId() {
    try { return JSON.parse(atob(getToken().split('.')[1])).userId; } catch { return null; }
}
function getMyNameFromToken() {
    try { const p=JSON.parse(atob(getToken().split('.')[1])); return (p.name||p.username||'PLAYER').toUpperCase(); } catch { return 'PLAYER'; }
}

// ── LOAD ALL USER DATA ──
async function loadUserData() {
    // Name + avatar
    const profile = JSON.parse(localStorage.getItem('hq-profile') || '{}');
    const name    = (profile.username || getMyNameFromToken()).toUpperCase();
    document.getElementById('header-username').textContent = name;
    document.getElementById('welcome-username').textContent = name;
    if (profile.avatar) {
        document.getElementById('header-avatar-img').src = profile.avatar;
        document.getElementById('header-avatar-img').style.display = 'block';
        document.getElementById('header-avatar-icon').style.display = 'none';
    }

    // Greeting
    const h = new Date().getHours();
    document.getElementById('greet-text').textContent = h<12?'GOOD MORNING':h<18?'GOOD AFTERNOON':'GOOD EVENING';

    // Local stats (habits, focus, streaks)
    const streak  = JSON.parse(localStorage.getItem('hq-streak') || '{"days":{},"current":0,"longest":0}');
    const habits  = JSON.parse(localStorage.getItem('habits')    || '[]');
    const focusH  = JSON.parse(localStorage.getItem('hq-focus-history') || '{}');
    const focusMin = Object.values(focusH).reduce((a,b)=>a+b,0);

    document.getElementById('stat-habits').textContent        = habits.length;
    document.getElementById('stat-focus').textContent         = Math.floor(focusMin/60)+'h';
    document.getElementById('stat-longest-streak').textContent = streak.longest||0;

    // XP + level from backend leaderboard
    let xp = 0, level = 1, badges = 0;
    try {
        const res  = await leaderboardAPI.get();
        const myId = getMyUserId();
        const me   = (res.data||[]).find(u => u.userId===myId || u.id===myId);
        if (me) { xp = me.total_points||0; level = me.level||1; }
    } catch(e) {
        // Fallback to localStorage
        const ls = JSON.parse(localStorage.getItem('stats')||'{}');
        xp = ls.xp||0; level = ls.level||1;
    }

    // Badges count from localStorage (gamification page handles detail)
    const earnedBadges = JSON.parse(localStorage.getItem('hq-earned-badges') || '[]');
    badges = earnedBadges.length || JSON.parse(localStorage.getItem('stats')||'{}').badges || 0;
    document.getElementById('stat-badges').textContent = badges;

    // XP bar
    const need = level * 500;
    const pct  = Math.min((xp / need) * 100, 100);
    document.getElementById('xp-numbers').textContent = `${xp} / ${need} XP`;
    document.getElementById('header-level').textContent     = `⚔ LEVEL ${level}`;
    document.getElementById('header-level-tag').textContent = `LVL ${level}`;
    setTimeout(() => { document.getElementById('xp-fill').style.width = pct+'%'; }, 400);

    loadHabitsPreview();
    loadTimetable();
    loadStreak();
}

// ── DATE HELPERS ──
function getTodayKey(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
function getDateKey(n){const d=new Date();d.setDate(d.getDate()-n);return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}

// ── STREAK ──
function loadStreak(){
    const sd    = JSON.parse(localStorage.getItem('hq-streak')||'{"days":{},"current":0,"longest":0}');
    const habits = JSON.parse(localStorage.getItem('habits')||'[]');
    const tk    = getTodayKey();

    // Mark today if any habit done
    if (habits.some(h=>h.done) && !sd.days[tk]) {
        sd.days[tk] = true;
        let s=0; for(let i=0;i<=365;i++){if(sd.days[getDateKey(i)])s++;else break;}
        sd.current = s; sd.longest = Math.max(sd.longest||0, s);
        localStorage.setItem('hq-streak', JSON.stringify(sd));
    }

    const cur = sd.current||0;
    document.getElementById('streak-total-badge').textContent = `${cur} 🔥`;
    document.getElementById('stat-longest-streak').textContent = sd.longest||0;

    // Week circles
    const today=new Date(), todayDow=today.getDay();
    const monday=new Date(today); monday.setDate(today.getDate()-((todayDow+6)%7));
    const container=document.getElementById('week-circles'); container.innerHTML='';
    const wl=['MO','TU','WE','TH','FR','SA','SU'];
    for(let i=0;i<7;i++){
        const d=new Date(monday); d.setDate(monday.getDate()+i);
        const k=`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
        const isToday=k===tk, completed=!!sd.days[k], isFuture=d>today&&!isToday;
        const div=document.createElement('div'); div.className=`day-circle${isToday?' today-label':''}`;
        const ring=document.createElement('div'); ring.className='day-circle-ring';
        if(completed)ring.classList.add('completed'); if(isToday)ring.classList.add('today');
        if(isFuture)ring.style.opacity='0.3'; ring.textContent=completed?'✓':wl[i];
        const lbl=document.createElement('div'); lbl.className='day-circle-label'; lbl.textContent=wl[i];
        div.appendChild(ring); div.appendChild(lbl); container.appendChild(div);
    }

    const xpText=document.getElementById('streak-xp-text'), xpRow=document.getElementById('streak-xp-row');
    if(cur===0) xpText.textContent='Complete a habit to start your streak!';
    else if(cur<7) xpText.textContent=`${cur} day streak! +${cur*5} bonus XP!`;
    else{xpText.textContent=`🔥 ${cur} days! You're on fire! +${cur*5} XP`; xpRow.style.borderColor='var(--accent)';}
}

// ── HABITS PREVIEW ──
function loadHabitsPreview() {
    const habits = JSON.parse(localStorage.getItem('habits')||'[]');
    const list   = document.getElementById('habit-list');
    if (habits.length === 0) { list.innerHTML='<div class="empty-hint">No habits yet.</div>'; return; }
    list.innerHTML = habits.map((h,i) =>
        `<div class="habit-item">
            <div class="habit-check ${h.done?'done':''}" onclick="event.stopPropagation();toggleHabit(${i})"></div>
            <span>${h.name}</span>
            ${h.time?`<span style="margin-left:auto;font-size:9px;opacity:0.5;">${h.time}</span>`:''}
        </div>`
    ).join('');
}

function toggleHabit(i) {
    // Dashboard toggle is local only — full logic is on habits.html
    const habits = JSON.parse(localStorage.getItem('habits')||'[]');
    habits[i].done = !habits[i].done;
    localStorage.setItem('habits', JSON.stringify(habits));
    loadHabitsPreview();
    loadStreak();
}

function openAddHabitModal() { window.location.href='habits.html'; }
function handleHabitsBlockClick(e) { if(e.target.closest('.habit-check')||e.target.closest('.add-habit-btn'))return; window.location.href='habits.html'; }

// ── TIMETABLE PREVIEW ──
function loadTimetable() {
    const tt   = JSON.parse(localStorage.getItem('timetable')||'[]');
    const list = document.getElementById('timetable-list');
    if (tt.length===0){list.innerHTML='<div class="empty-state"><i class="fa-regular fa-calendar"></i><span>No schedule yet</span></div>';return;}
    const now=new Date(), cm=now.getHours()*60+now.getMinutes();
    list.innerHTML=tt.map(s=>{
        const[h,m]=s.time.split(':').map(Number);
        const active=Math.abs((h*60+m)-cm)<60;
        return `<div class="timetable-row"><span class="t-time">${s.time}</span><div class="t-bar ${active?'active-slot':''}"><div class="t-dot"></div>${s.label}</div></div>`;
    }).join('');
}

// ── MINI FOCUS WIDGET ──
let focusRunning=false,focusSeconds=25*60,focusInterval=null,focusElapsed=0;
function toggleFocus(){
    if(focusRunning){
        clearInterval(focusInterval);focusRunning=false;
        document.getElementById('focus-icon').className='fa-solid fa-play';
        document.getElementById('focus-btn-text').textContent='START';
        document.getElementById('focus-ring').classList.remove('running');
    } else {
        focusRunning=true;
        document.getElementById('focus-icon').className='fa-solid fa-pause';
        document.getElementById('focus-btn-text').textContent='PAUSE';
        document.getElementById('focus-ring').classList.add('running');
        focusInterval=setInterval(()=>{
            if(focusSeconds<=0){
                clearInterval(focusInterval);focusRunning=false;focusElapsed+=25;
                document.getElementById('focus-total-display').textContent=focusElapsed+' min';
                document.getElementById('focus-display').textContent='DONE!';
                document.getElementById('focus-icon').className='fa-solid fa-play';
                document.getElementById('focus-btn-text').textContent='START';
                document.getElementById('focus-ring').classList.remove('running');
                return;
            }
            focusSeconds--;
            const m=Math.floor(focusSeconds/60).toString().padStart(2,'0');
            const s=(focusSeconds%60).toString().padStart(2,'0');
            document.getElementById('focus-display').textContent=`${m}:${s}`;
        },1000);
    }
}
function resetFocus(){clearInterval(focusInterval);focusRunning=false;focusSeconds=25*60;document.getElementById('focus-display').textContent='25:00';document.getElementById('focus-icon').className='fa-solid fa-play';document.getElementById('focus-btn-text').textContent='START';document.getElementById('focus-ring').classList.remove('running');}
function handleFocusBlockClick(e){if(e.target.closest('.focus-btn'))return;window.location.href='focus.html';}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    requireAuth();
    loadPrefs();
    loadUserData();
});

// ── EXPOSE TO HTML ──
window.setMode              = setMode;
window.setTheme             = setTheme;
window.setCustomAccent      = setCustomAccent;
window.setBg                = setBg;
window.toggleSidebar        = toggleSidebar;
window.logout               = logout;
window.toggleHabit          = toggleHabit;
window.openAddHabitModal    = openAddHabitModal;
window.handleHabitsBlockClick = handleHabitsBlockClick;
window.toggleFocus          = toggleFocus;
window.resetFocus           = resetFocus;
window.handleFocusBlockClick = handleFocusBlockClick;