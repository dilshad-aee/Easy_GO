// Results page
// Shows quiz stats after completion

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupThemeToggle();
    displayResults();
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
    const curr = document.body.getAttribute('data-theme');
    const newTheme = curr === 'light' ? 'dark' : 'light';

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

// Main display function
function displayResults() {
    const result = JSON.parse(localStorage.getItem('currentQuizResult') || '{}');

    if (!result.totalQuestions) {
        alert('No quiz results found. Redirecting to home...');
        window.location.href = '/';
        return;
    }

    const pct = Math.round((result.correctAnswers / result.totalQuestions) * 100);

    // update UI elements
    const scoreEl = document.getElementById('scorePercentage');
    if (scoreEl) scoreEl.textContent = `${pct}%`;

    const correctEl = document.getElementById('correctCount');
    if (correctEl) correctEl.textContent = result.correctAnswers;

    const wrongEl = document.getElementById('wrongCount');
    if (wrongEl) wrongEl.textContent = result.wrongAnswers || 0;

    const missedEl = document.getElementById('missedCount');
    if (missedEl) missedEl.textContent = result.totalQuestions - result.correctAnswers - (result.wrongAnswers || 0);

    const totalEl = document.getElementById('totalCount');
    if (totalEl) totalEl.textContent = result.totalQuestions;

    // performance message
    const msgEl = document.getElementById('performanceMessage');
    if (msgEl) {
        let msg = '';
        if (pct >= 90) msg = '🎉 Outstanding! You really know your stuff!';
        else if (pct >= 75) msg = '👍 Great job! Keep up the good work!';
        else if (pct >= 60) msg = '📚 Not bad! A bit more practice will help.';
        else if (pct >= 40) msg = '💪 Keep trying! Practice makes perfect.';
        else msg = '📖 More study needed. Don\'t give up!';

        msgEl.textContent = msg;
    }

    // topic performance
    const topicsEl = document.getElementById('topicsCovered');
    if (topicsEl && result.topicPerformance) {
        const topicsHTML = Object.entries(result.topicPerformance).map(([topic, stats]) => {
            const acc = Math.round((stats.correct / stats.total) * 100);
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-light);">
                    <span><i class="fas fa-check-circle" style="color: var(--accent); margin-right: 8px;"></i>${topic}</span>
                    <span class="badge badge-${acc >= 70 ? 'success' : 'error'}">${stats.correct}/${stats.total} (${acc}%)</span>
                </div>
            `;
        }).join('');
        topicsEl.innerHTML = topicsHTML || '<p class="text-secondary">No topics data available</p>';
    }

    // wrong questions section (for Boost feature)
    if (result.wrongAnswersFromQuiz && result.wrongAnswersFromQuiz.length > 0) {
        displayWrongQuestionsSection(result.wrongAnswersFromQuiz);
    }
}

// Show wrong questions that can be retried
function displayWrongQuestionsSection(wrongAnswers) {
    const section = document.getElementById('wrongQuestionsSection');
    const list = document.getElementById('wrongQuestionsList');

    if (!section || !list || wrongAnswers.length === 0) return;

    // group by topic
    const byTopic = {};
    wrongAnswers.forEach(wa => {
        const topic = wa.topic || 'General';
        if (!byTopic[topic]) byTopic[topic] = 0;
        byTopic[topic]++;
    });

    const topicsHTML = Object.entries(byTopic).map(([topic, count]) => `
        <div style="padding: 8px 12px; background: var(--surface-variant); border-radius: 8px; margin-bottom: 8px;">
            <i class="fas fa-book" style="color: var(--accent);"></i>
            ${topic}: <strong>${count} question${count > 1 ? 's' : ''}</strong>
        </div>
    `).join('');

    list.innerHTML = topicsHTML;
    section.style.display = 'block';
}

// Retry wrong questions - creates a boost quiz
function retryWrongQuestions() {
    const result = JSON.parse(localStorage.getItem('currentQuizResult') || '{}');

    // get all wrong answers from storage for current pack
    const cfg = JSON.parse(localStorage.getItem('quizConfig') || '{}');
    const wrongAnswers = Storage.getWrongAnswersByPack(cfg.fileId);

    if (wrongAnswers.length === 0) {
        alert('No wrong questions found to retry!');
        return;
    }

    // create boost quiz config
    const boostCfg = {
        fileId: `boost_${cfg.fileId}`,
        fileName: `Retry: ${cfg.fileName || 'Quiz'}`,
        questionCount: wrongAnswers.length,
        shuffle: false,
        isBoost: true,
        boostQuestions: wrongAnswers
    };

    localStorage.setItem('quizConfig', JSON.stringify(boostCfg));
    window.location.href = '/quiz.html';
}
