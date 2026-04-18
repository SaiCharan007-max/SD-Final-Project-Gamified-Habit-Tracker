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

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        let newContent = content
            .replace(/#cb7341/gi, '#d4af37')
            .replace(/203,\s*115,\s*65/g, '212, 175, 55');
        fs.writeFileSync(file, newContent, 'utf8');
    } catch(e) {}
});

console.log('Variables replaced');
