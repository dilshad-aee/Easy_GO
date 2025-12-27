// Pack selection page
// Choose what quiz to take

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupThemeToggle();
    loadCustomFiles();
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

// Load custom question files
function loadCustomFiles() {
    const files = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
    const list = document.getElementById('customFilesList');

    if (!list) return;

    if (files.length === 0) {
        list.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                No custom files uploaded yet. Go to <a href="/settings.html">Settings</a> to upload your question files.
            </div>
        `;
        return;
    }

    // create card grid - looks much better than old checkbox list
    list.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 16px;">
            ${files.map(file => `
                <label class="custom-file-card" style="cursor: pointer; position: relative;">
                    <input type="checkbox" class="custom-file-checkbox" value="${file.id}" data-count="${file.questions.length}" style="position: absolute; opacity: 0; pointer-events: none;">
                    <div class="card" style="padding: 20px; transition: all 0.3s ease; border: 2px solid var(--border-light); height: 100%;">
                        <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
                            <div style="width: 40px; height: 40px; background: var(--accent-light); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <i class="fas fa-file-alt" style="font-size: 18px; color: var(--accent);"></i>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h4 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${file.name}">${file.name}</h4>
                                <div style="font-size: 14px; color: var(--text-secondary);">
                                    ${file.questions.length} questions
                                </div>
                            </div>
                            <div class="card-checkbox" style="width: 24px; height: 24px; border: 2px solid var(--border); border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; flex-shrink: 0;">
                                <i class="fas fa-check" style="font-size: 14px; color: white; opacity: 0; transition: opacity 0.2s;"></i>
                            </div>
                        </div>
                        ${file.description ? `
                            <p style="margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                                ${file.description}
                            </p>
                        ` : ''}
                    </div>
                </label>
            `).join('')}
        </div>
        <style>
            .custom-file-card input:checked + .card {
                border-color: var(--accent);
                background: var(--accent-light);
                box-shadow: 0 4px 12px rgba(var(--accent-rgb, 99, 102, 241), 0.15);
            }
            .custom-file-card input:checked + .card .card-checkbox {
                background: var(--accent);
                border-color: var(--accent);
            }
            .custom-file-card input:checked + .card .card-checkbox i {
                opacity: 1;
            }
            .custom-file-card .card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
        </style>
    `;
}

// Start the quiz
async function startQuizNew() {
    const questionCount = parseInt(document.getElementById('questionCount').value);
    const shuffle = document.getElementById('shuffleQuestions').checked;

    const selected = Array.from(document.querySelectorAll('.custom-file-checkbox:checked'));

    if (selected.length === 0) {
        alert('Please select at least one question pack');
        return;
    }

    // just use first one for now
    const fileId = selected[0].value;
    const fileName = selected[0].closest('.custom-file-card').querySelector('h4').textContent;

    const cfg = {
        fileId: fileId,
        fileName: fileName,
        questionCount: questionCount,
        shuffle: shuffle
    };
    localStorage.setItem('quizConfig', JSON.stringify(cfg));

    window.location.href = '/quiz.html';
}

// make global
window.startQuizNew = startQuizNew;
window.toggleTheme = toggleTheme;
