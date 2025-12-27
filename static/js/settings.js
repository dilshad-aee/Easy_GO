// Settings page
// File upload and theme controls

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupThemeToggle();
    setupFileUpload();
    updateStats();
});

function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', theme);
    updateThemeUI(theme);
}

function setupThemeToggle() {
    const btn = document.getElementById('themeToggleBtn');
    const toggle = document.getElementById('themeToggle');

    if (btn) btn.addEventListener('click', toggleTheme);
    if (toggle) toggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const curr = document.body.getAttribute('data-theme');
    const newTheme = curr === 'light' ? 'dark' : 'light';

    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI(newTheme);
}

function updateThemeUI(theme) {
    const icons = document.querySelectorAll('#themeToggle i, #themeToggleBtn i');
    const txt = document.getElementById('themeText');

    icons.forEach(icon => {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });

    if (txt) {
        txt.textContent = theme === 'dark' ? 'Light' : 'Dark';
    }
}

// File upload handling
function setupFileUpload() {
    const input = document.getElementById('fileInput');
    const upload = document.querySelector('.file-upload');

    if (!input) return;

    input.addEventListener('change', handleFileSelect);

    // drag and drop
    upload.addEventListener('dragover', (e) => {
        e.preventDefault();
        upload.style.borderColor = 'var(--accent)';
        upload.style.background = 'var(--accent-light)';
    });

    upload.addEventListener('dragleave', () => {
        upload.style.borderColor = '';
        upload.style.background = '';
    });

    upload.addEventListener('drop', (e) => {
        e.preventDefault();
        upload.style.borderColor = '';
        upload.style.background = '';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) handleFile(file);
}

function handleFile(file) {
    if (!file.name.endsWith('.json')) {
        showUploadStatus('error', 'Please upload a JSON file');
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const questions = JSON.parse(e.target.result);

            // validate
            if (!Array.isArray(questions)) {
                throw new Error('JSON must be an array of questions');
            }

            // check each question
            questions.forEach((q, idx) => {
                if (!q.question || !Array.isArray(q.options) || q.correctAnswer === undefined || !q.topic) {
                    throw new Error(`Invalid question format at index ${idx}`);
                }

                if (q.options.length !== 4) {
                    throw new Error(`Question ${idx} must have exactly 4 options`);
                }

                if (q.correctAnswer < 0 || q.correctAnswer > 3) {
                    throw new Error(`Question ${idx} has invalid correctAnswer (must be 0-3)`);
                }
            });

            // get existing files
            const files = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');

            // create entry
            const fileName = file.name.replace('.json', '');
            const entry = {
                id: 'custom_' + Date.now(),
                name: fileName,
                questions: questions,
                uploadedAt: new Date().toISOString()
            };

            files.push(entry);
            localStorage.setItem('customQuestionFiles', JSON.stringify(files));

            showUploadStatus('success', `Successfully uploaded "${fileName}" with ${questions.length} questions! Refresh the page to see it in topics.`);
            updateStats();

        } catch (err) {
            showUploadStatus('error', `Error: ${err.message}`);
        }
    };

    reader.onerror = () => {
        showUploadStatus('error', 'Error reading file');
    };

    reader.readAsText(file);
}

function showUploadStatus(type, msg) {
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.style.display = 'block';
    statusDiv.className = `alert alert-${type}`;
    statusDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
}

// Export/Reset
function exportData() {
    const data = {
        quizHistory: JSON.parse(localStorage.getItem('quizHistory') || '[]'),
        stats: JSON.parse(localStorage.getItem('quizStats') || '{}'),
        customQuestions: JSON.parse(localStorage.getItem('customQuestions') || '[]'),
        theme: localStorage.getItem('theme') || 'light'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bcs011-quiz-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function resetData() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        localStorage.removeItem('quizHistory');
        localStorage.removeItem('quizStats');
        localStorage.removeItem('customQuestions');

        alert('All data has been reset');
        updateStats();
    }
}

function updateStats() {
    const customQuestions = JSON.parse(localStorage.getItem('customQuestions') || '[]');
    const el = document.getElementById('totalQuestionsCount');

    if (el) {
        const total = 300 + customQuestions.length;
        el.textContent = `${total} questions available (300 default + ${customQuestions.length} custom)`;
    }
}

// make global
window.exportData = exportData;
window.resetData = resetData;
window.toggleTheme = toggleTheme;
