// Boost page - practice your weak questions
// Dec 2024

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupThemeToggle();
    loadBoostData();
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

// Load and display boost data
function loadBoostData() {
    const stats = Storage.getWrongAnswerStats();

    displayBoostStats(stats);

    if (stats.totalWrongAnswers === 0) {
        showEmptyState();
        return;
    }

    loadAndDisplayPacks(stats.packBreakdown);
}

function displayBoostStats(stats) {
    const total = document.getElementById('totalWeakQuestions');
    const packs = document.getElementById('uniquePacksCount');
    const topics = document.getElementById('uniqueTopicsCount');

    if (total) total.textContent = stats.totalWrongAnswers;
    if (packs) packs.textContent = stats.uniquePacks;
    if (topics) topics.textContent = Object.keys(stats.topicBreakdown).length;
}

function showEmptyState() {
    const empty = document.getElementById('emptyState');
    const grid = document.getElementById('packGridContainer');

    if (empty) empty.style.display = 'block';
    if (grid) grid.style.display = 'none';
}

function loadAndDisplayPacks(packBreakdown) {
    const container = document.getElementById('packGridContainer');
    const grid = document.getElementById('packGrid');

    if (!grid) return;

    if (container) container.style.display = 'block';

    // get custom files
    const files = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');

    if (files.length === 0) {
        grid.innerHTML = '<p class="text-secondary">No question packs found. Please upload some questions first.</p>';
        return;
    }

    // only show packs with wrong answers
    const packsWithErrors = files.filter(file => {
        return packBreakdown[file.id] && packBreakdown[file.id].count > 0;
    });

    if (packsWithErrors.length === 0) {
        showEmptyState();
        return;
    }

    // render cards
    const html = packsWithErrors.map(pack => {
        const wrongCount = packBreakdown[pack.id].count;
        const totalQs = pack.questions ? pack.questions.length : 0;

        return renderPackCard(pack, wrongCount, totalQs);
    }).join('');

    grid.innerHTML = html;
}

function renderPackCard(pack, wrongCount, totalQs) {
    const pct = totalQs > 0 ? Math.round((wrongCount / totalQs) * 100) : 0;

    // topic breakdown for this pack
    const wrongAnswers = Storage.getWrongAnswersByPack(pack.id);
    const topics = {};
    wrongAnswers.forEach(wa => {
        const t = wa.topic || 'General';
        if (!topics[t]) topics[t] = 0;
        topics[t]++;
    });

    const topTopics = Object.entries(topics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([topic, count]) => `
            <div style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">
                • ${topic} (${count})
            </div>
        `).join('');

    return `
        <div class="card pack-card" style="padding: 24px;">
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
                <i class="fas fa-book" style="font-size: 32px; color: var(--accent); margin-right: 16px;"></i>
                <div style="flex: 1;">
                    <h3 style="margin: 0; font-size: 18px;">${pack.name}</h3>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">
                        ${totalQs} total questions
                    </div>
                </div>
            </div>
            
            <div style="background: var(--surface-variant); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 14px; color: var(--text-secondary);">Weak Questions</span>
                    <span style="font-size: 24px; font-weight: 700; color: var(--error);">
                        ${wrongCount}
                    </span>
                </div>
                <div style="margin-top: 8px; height: 6px; background: var(--border-light); border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; background: var(--error); width: ${pct}%;"></div>
                </div>
            </div>
            
            ${topTopics ? `
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Topics needing work:</div>
                    ${topTopics}
                </div>
            ` : ''}
            
            <button onclick="startBoostQuiz('${pack.id}')" class="btn btn-primary" style="width: 100%;">
                <i class="fas fa-rocket"></i>
                <span>Start Boost Quiz (${wrongCount} questions)</span>
            </button>
        </div>
    `;
}

// Start boost quiz for selected pack
function startBoostQuiz(packId) {
    const wrongAnswers = Storage.getWrongAnswersByPack(packId);

    if (wrongAnswers.length === 0) {
        alert('No wrong questions found for this pack!');
        return;
    }

    // get pack name
    const files = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
    const pack = files.find(f => f.id === packId);
    const packName = pack ? pack.name : 'Unknown Pack';

    // create config
    const cfg = {
        fileId: `boost_${packId}`,
        fileName: `Boost: ${packName}`,
        questionCount: wrongAnswers.length,
        shuffle: false,
        isBoost: true,
        boostQuestions: wrongAnswers
    };

    localStorage.setItem('quizConfig', JSON.stringify(cfg));
    window.location.href = '/quiz.html';
}
