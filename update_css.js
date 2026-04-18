const fs = require('fs');

const files = [
    'client/css/dashboard.css',
    'client/css/achievements.css',
    'client/css/auth.css',
    'client/css/focus.css',
    'client/css/habits.css',
    'client/css/leaderboard.css',
    'client/css/main.css',
    'client/css/profile.css',
    'client/css/puzzle.css',
    'client/css/stats.css',
    'client/css/timetable.css'
];

// Add global styles for elegance
const elegantStyles = `

/* --- Luxurious & Elegant Overrides --- */
body {
    background: #0a0a0c !important; /* Deep expensive black */
    color: #f4f0ec !important; /* Soft pearl white */
    font-family: 'Cinzel', 'Playfair Display', 'Helvetica Neue', sans-serif !important;
}

* {
    border-radius: 4px !important; /* Sharp, slight rounding for elegance */
    box-shadow: none !important; /* Remove squishy shadows */
    border-color: rgba(212, 175, 55, 0.25) !important; /* Subtle gold borders */
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important; /* Smooth slow transitions */
}

/* Glassy, sharp cards */
.card, .panel, .login-box, .app-header, .sidebar, .leaderboard-item, .habit-card {
    background: rgba(18, 18, 18, 0.7) !important;
    backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(212, 175, 55, 0.15) !important;
    border-radius: 0px !important;
}

/* Elegant Buttons */
button, .btn {
    background: linear-gradient(135deg, #d4af37, #b28d22) !important;
    color: #000 !important;
    text-transform: uppercase;
    letter-spacing: 2px !important;
    font-weight: 300 !important;
    border: none !important;
    border-radius: 0px !important;
}
button:hover, .btn:hover {
    background: #fff !important;
    color: #d4af37 !important;
    box-shadow: 0 0 15px rgba(212, 175, 55, 0.3) !important;
}

/* Inputs */
input, select, textarea {
    background: rgba(0,0,0,0.5) !important;
    border-bottom: 1px solid #d4af37 !important;
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
    border-radius: 0 !important;
    color: #d4af37 !important;
}

/* Typography Enhancements */
h1, h2, h3, h4, .app-logo {
    font-family: 'Cinzel', serif !important;
    color: #d4af37 !important;
    text-transform: uppercase !important;
    letter-spacing: 3px !important;
    font-weight: 400 !important;
}

`;

try {
    const mainCssPath = 'client/css/main.css';
    let content = fs.readFileSync(mainCssPath, 'utf8');
    if (!content.includes('Luxurious & Elegant Overrides')) {
        content += "\n@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;1,400&display=swap');\n" + elegantStyles;
        fs.writeFileSync(mainCssPath, content);
        console.log('Injected override styles into main.css');
    }
} catch (e) {
    console.error('Error modifying main.css:', e);
}

