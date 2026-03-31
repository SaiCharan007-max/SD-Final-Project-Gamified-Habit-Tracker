// ============================================
//  HABITQUEST — STATS JS
// ============================================

const BADGES_ALL = [
    {emoji:'🔥',name:'ON FIRE',    desc:'7 habit streak'},
    {emoji:'⚡',name:'LIGHTNING',  desc:'1 focus session'},
    {emoji:'🏆',name:'CHAMPION',   desc:'Reach Level 5'},
    {emoji:'💎',name:'DIAMOND',    desc:'30-day streak'},
    {emoji:'🌟',name:'SUPERSTAR',  desc:'All badges'},
    {emoji:'🎯',name:'FOCUSED',    desc:'10 sessions'},
    {emoji:'📚',name:'SCHOLAR',    desc:'10h focus'},
    {emoji:'💪',name:'WARRIOR',    desc:'50 habits'},
];
const LEVEL_TITLES = ['NOVICE','APPRENTICE','WARRIOR','KNIGHT','CHAMPION','LEGEND','MASTER','GRANDMASTER'];

function loadThemePrefs(){
    try{
        const p=JSON.parse(localStorage.getItem('hq-prefs')||'{}'),h=document.documentElement;
        if(p.mode)h.setAttribute('data-mode',p.mode);
        if(p.theme)h.setAttribute('data-theme',p.theme);
        const BG={default:'linear-gradient(135deg,#111016,#1a1020)',space:'linear-gradient(135deg,#0a0f1e,#0d1830)',forest:'linear-gradient(135deg,#0a1a10,#0d2818)',dusk:'linear-gradient(135deg,#180820,#100018)',steel:'linear-gradient(135deg,#0e1220,#141a2e)',crimson:'linear-gradient(135deg,#180808,#220d0d)'};
        const BGL={default:'linear-gradient(135deg,#f5f0eb,#ede4d8)',space:'linear-gradient(135deg,#e8f0f5,#d8e8f0)',forest:'linear-gradient(135deg,#e8f5ee,#d8f0e4)',dusk:'linear-gradient(135deg,#f0e8f5,#e8d8f0)',steel:'linear-gradient(135deg,#eaedf5,#d8dced)',crimson:'linear-gradient(135deg,#f5e8e8,#f0d8d8)'};
        if(p.bg){const isL=p.mode==='light';const g=(isL?BGL:BG)[p.bg]||(isL?BGL.default:BG.default);h.style.background=g;h.style.backgroundAttachment='fixed';h.style.setProperty('--bg-gradient',g);}
        if(p.accent){const c=p.accent,r=parseInt(c.slice(1,3),16),g2=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);h.style.setProperty('--accent',c);h.style.setProperty('--accent-rgb',`${r},${g2},${b}`);h.style.setProperty('--accent-dim',`rgba(${r},${g2},${b},0.12)`);h.style.setProperty('--accent-border',`rgba(${r},${g2},${b},0.25)`);h.style.setProperty('--accent-glow',`rgba(${r},${g2},${b},0.4)`);}
    }catch(e){}
}

function dateKey(d){return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
function daysAgoKey(n){const d=new Date();d.setDate(d.getDate()-n);return dateKey(d);}
function dayLabel(n){const d=new Date();d.setDate(d.getDate()-n);return['SU','MO','TU','WE','TH','FR','SA'][d.getDay()];}
function accentColor(){return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#cb7341';}
function accentRgb(){return getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim()||'203,115,65';}

function loadXp(stats){
    const lvl=stats.level||1, xp=stats.xp||0, need=lvl*500, pct=Math.min(xp/need,1);
    const circ=2*Math.PI*50;
    setTimeout(()=>{
        document.getElementById('xp-ring-fill').style.strokeDashoffset=circ*(1-pct);
        document.getElementById('xp-bar').style.width=(pct*100)+'%';
    },300);
    document.getElementById('xp-val').textContent=xp;
    document.getElementById('xp-lvl-badge').textContent=`LVL ${lvl}`;
    document.getElementById('xp-title').textContent=LEVEL_TITLES[Math.min(lvl-1,LEVEL_TITLES.length-1)];
    document.getElementById('xp-sub').textContent=`${xp} / ${need} XP`;
    document.getElementById('xp-next').textContent=`${need-xp} XP TO LEVEL ${lvl+1}`;
}

function loadOverview(stats,streak){
    document.getElementById('ov-streak').textContent=streak.current||0;
    document.getElementById('ov-longest').textContent=streak.longest||0;
    document.getElementById('ov-habits').textContent=stats.habits||0;
    document.getElementById('ov-focus').textContent=Math.floor((stats.focusMin||0)/60)+'h';
    document.getElementById('ov-badges').textContent=stats.badges||0;
    document.getElementById('ov-days').textContent=Object.keys(streak.days||{}).length;
}

function loadBadges(earned){
    document.getElementById('badge-pill').textContent=`${earned}/${BADGES_ALL.length}`;
    document.getElementById('badges-grid').innerHTML=BADGES_ALL.map((b,i)=>`
        <div class="badge-item ${i>=earned?'locked':''}">
            <div class="badge-emoji">${b.emoji}</div>
            <div class="badge-name">${b.name}</div>
        </div>`).join('');
}

function drawLine(id,data,color,gradRgb){
    const canvas=document.getElementById(id);
    if(!canvas)return;
    const parent=canvas.parentElement;
    const W=parent.clientWidth, H=parent.clientHeight||110;
    const dpr=window.devicePixelRatio||1;
    canvas.width=W*dpr; canvas.height=H*dpr;
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    const ctx=canvas.getContext('2d');
    ctx.scale(dpr,dpr);
    const pL=30,pR=8,pT=12,pB=22;
    const cW=W-pL-pR, cH=H-pT-pB;
    const max=Math.max(...data,1);
    const n=data.length;
    const pts=data.map((v,i)=>({x:pL+(i/(n-1))*cW, y:pT+cH-(v/max)*cH}));

    // grid
    ctx.strokeStyle='rgba(128,128,128,0.07)'; ctx.lineWidth=1;
    for(let i=0;i<=2;i++){const y=pT+(cH/2)*i;ctx.beginPath();ctx.moveTo(pL,y);ctx.lineTo(W-pR,y);ctx.stroke();}

    // y labels
    ctx.fillStyle='rgba(128,128,128,0.45)'; ctx.font=`8px Orbitron,sans-serif`; ctx.textAlign='right';
    for(let i=0;i<=1;i++){ctx.fillText(Math.round(max*(1-i)),pL-4,pT+(cH*i)+4);}

    // gradient fill
    const grad=ctx.createLinearGradient(0,pT,0,pT+cH);
    grad.addColorStop(0,`rgba(${gradRgb},0.22)`);
    grad.addColorStop(1,`rgba(${gradRgb},0)`);
    ctx.beginPath(); ctx.moveTo(pts[0].x,pT+cH);
    pts.forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.lineTo(pts[n-1].x,pT+cH); ctx.closePath();
    ctx.fillStyle=grad; ctx.fill();

    // line
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<n;i++){const mx=(pts[i-1].x+pts[i].x)/2;ctx.bezierCurveTo(mx,pts[i-1].y,mx,pts[i].y,pts[i].x,pts[i].y);}
    ctx.strokeStyle=color; ctx.lineWidth=2; ctx.shadowColor=color; ctx.shadowBlur=6; ctx.stroke(); ctx.shadowBlur=0;

    // dots + labels
    pts.forEach((p,i)=>{
        ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2);
        ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=8; ctx.fill(); ctx.shadowBlur=0;
        if(data[i]>0){ctx.fillStyle=color;ctx.font='8px Orbitron,sans-serif';ctx.textAlign='center';ctx.fillText(data[i],p.x,p.y-7);}
    });

    // x labels
    ctx.fillStyle='rgba(128,128,128,0.55)'; ctx.font='8px Orbitron,sans-serif'; ctx.shadowBlur=0;
    const labels=[];for(let i=6;i>=0;i--)labels.push(dayLabel(i));
    labels.forEach((l,i)=>{
        const x=pL+(i/(n-1))*cW;
        ctx.fillStyle=(i===n-1)?color:'rgba(128,128,128,0.55)';
        ctx.textAlign='center'; ctx.fillText(l,x,H-5);
    });
}

function loadCalendar(streak){
    document.getElementById('streak-badge').textContent=`${streak.current||0} 🔥`;
    const grid=document.getElementById('cal-grid');
    const todayK=dateKey(new Date());
    grid.innerHTML='';
    for(let i=69;i>=0;i--){
        const d=new Date(); d.setDate(d.getDate()-i);
        const k=dateKey(d), isToday=k===todayK, done=!!streak.days[k];
        const cell=document.createElement('div');
        cell.className='cal-cell'+(done?' done':'')+(isToday?' today':'');
        cell.title=`${d.toLocaleDateString('en',{month:'short',day:'numeric'})} ${done?'✓':'—'}`;
        grid.appendChild(cell);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Guard: redirect if not logged in
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'index.html'; return; }

    loadThemePrefs();

    // Base stats from localStorage
    const lsStats = JSON.parse(localStorage.getItem('stats')||'{"habits":0,"badges":0,"focusMin":0,"xp":0,"level":1}');
    const streak  = JSON.parse(localStorage.getItem('hq-streak')||'{"days":{},"current":0,"longest":0}');

    // Pull real XP + level from backend leaderboard
    let xp = lsStats.xp||0, level = lsStats.level||1;
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

    // Local supplementary stats
    const focusH   = JSON.parse(localStorage.getItem('hq-focus-history')||'{}');
    const focusMin = Object.values(focusH).reduce((a,b)=>a+b,0);
    const habits   = JSON.parse(localStorage.getItem('habits')||'[]');
    const earnedBadges = JSON.parse(localStorage.getItem('hq-earned-badges')||'[]');
    const badges   = earnedBadges.length || lsStats.badges || 0;

    const stats = { ...lsStats, xp, level, focusMin, habits: habits.length, badges };

    loadXp(stats);
    loadOverview(stats, streak);
    loadBadges(badges);
    loadCalendar(streak);

    const habitHistory = JSON.parse(localStorage.getItem('hq-habit-history')||'{}');
    const doneCnt = habits.filter(h=>h.done).length;
    if (doneCnt>0) habitHistory[dateKey(new Date())] = doneCnt;
    const habitData=[]; for(let i=6;i>=0;i--)habitData.push(habitHistory[daysAgoKey(i)]||0);

    const focusHistory = JSON.parse(localStorage.getItem('hq-focus-history')||'{}');
    const focusData=[]; for(let i=6;i>=0;i--)focusData.push(focusHistory[daysAgoKey(i)]||0);

    const ac=accentColor(), rgb=accentRgb();
    drawLine('habit-chart',habitData,ac,rgb);
    drawLine('focus-chart',focusData,'#a855f7','168,85,247');
});