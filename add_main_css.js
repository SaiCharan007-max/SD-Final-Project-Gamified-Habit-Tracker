const fs = require('fs');

const files = [
    'client/achievements.html',
    'client/dashboard.html',
    'client/focus.html',
    'client/habits.html',
    'client/leaderboard.html',
    'client/profile.html',
    'client/puzzle.html',
    'client/stats.html',
    'client/timetable.html'
];

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        // Check if main.css is already linked
        if (!content.includes('css/main.css')) {
            // Find a good place to insert, e.g., right before </head> or after another stylesheet
            content = content.replace(/(<link rel="stylesheet" href="css\/[a-zA-Z0-9_.-]+.css"\s*\/>)/, '$1\n    <link rel="stylesheet" href="css/main.css"/>');
            fs.writeFileSync(file, content, 'utf8');
        }
    } catch(e) {
        console.error("Error for file: " + file, e);
    }
});

console.log('Added main.css link to all HTML files');
