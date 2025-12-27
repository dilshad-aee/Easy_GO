// Home page - stats and theme
// Pretty straightforward

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupThemeToggle();
    updateHomeStats();
});

function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', theme);
    updateThemeUI(theme);
}

function setupThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
        toggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';

    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI(newTheme);
}

function updateThemeUI(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Update stats on home page
function updateHomeStats() {
    const files = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
    const totalQs = files.reduce((sum, file) => sum + (file.questions?.length || 0), 0);

    const totalQEl = document.getElementById('totalQuestions');
    if (totalQEl) {
        totalQEl.textContent = totalQs;
    }

    const packsEl = document.getElementById('totalPacks');
    if (packsEl) {
        packsEl.textContent = files.length;
    }

    // quiz history
    const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    const quizzesTaken = document.getElementById('quizzesTaken');
    if (quizzesTaken) {
        quizzesTaken.textContent = history.length;
    }

    // avg score
    if (history.length > 0) {
        const avg = history.reduce((sum, quiz) => {
            const pct = (quiz.correctAnswers / quiz.totalQuestions) * 100;
            return sum + pct;
        }, 0) / history.length;

        const avgEl = document.getElementById('avgScore');
        if (avgEl) {
            avgEl.textContent = Math.round(avg) + '%';
        }
    }
}
