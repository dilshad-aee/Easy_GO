/**
 * Main Application JavaScript
 * Handles quiz setup, page navigation, and custom file loading
 */

// Page Navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId.replace('Page', '')) {
            link.classList.add('active');
        }
    });

    // Load data when showing setup page
    if (pageId === 'setupPage') {
        loadCustomFiles();
        updateCustomFilesCount();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupThemeToggle();
    loadCustomFiles();
    updateCustomFilesCount();
    updateHomeStats();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

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

// Custom Files Management
function loadCustomFiles() {
    const customFiles = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
    const customFilesList = document.getElementById('customFilesList');

    if (!customFilesList) return;

    if (customFiles.length === 0) {
        customFilesList.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                No custom files uploaded yet. Go to <a href="/settings.html">Settings</a> to upload your question files.
            </div>
        `;
        return;
    }

    customFilesList.innerHTML = customFiles.map(file => `
        <label class="checkbox-label">
            <input type="checkbox" class="custom-file-checkbox" value="${file.id}" data-count="${file.questions.length}">
            <span>
                <i class="fas fa-file-alt"></i>
                ${file.name} (${file.questions.length} questions)
            </span>
        </label>
    `).join('');
}

function updateCustomFilesCount() {
    const customFiles = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
    const customFilesCount = document.getElementById('customFilesCount');

    if (customFilesCount) {
        const totalQuestions = customFiles.reduce((sum, file) => sum + (file.questions?.length || 0), 0);
        customFilesCount.textContent = customFiles.length > 0
            ? `${customFiles.length} files, ${totalQuestions} questions`
            : 'No files uploaded yet';
    }
}

// Source Selection Handler
function handleSourceChange() {
    const selectedSource = document.querySelector('input[name="questionSource"]:checked').value;
    const customFilesSection = document.getElementById('customFilesSection');
    const topicSelectionSection = document.getElementById('topicSelectionSection');
    const topicStepNumber = document.getElementById('topicStepNumber');
    const optionsStepNumber = document.getElementById('optionsStepNumber');

    if (selectedSource === 'custom') {
        // Show custom files, hide topics
        customFilesSection.style.display = 'block';
        topicSelectionSection.style.display = 'none';
        topicStepNumber.textContent = '3';
        optionsStepNumber.textContent = '3';
    } else if (selectedSource === 'mixed') {
        // Show both
        customFilesSection.style.display = 'block';
        topicSelectionSection.style.display = 'block';
        topicStepNumber.textContent = '3';
        optionsStepNumber.textContent = '4';
    } else {
        // Built-in only - hide custom files
        customFilesSection.style.display = 'none';
        topicSelectionSection.style.display = 'block';
        topicStepNumber.textContent = '2';
        optionsStepNumber.textContent = '3';
    }
}

// Topic Selection
function selectAllTopics() {
    document.querySelectorAll('#topicsList input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
    });
}

function deselectAllTopics() {
    document.querySelectorAll('#topicsList input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
}

// Start Quiz
async function startQuizNew() {
    const selectedSource = document.querySelector('input[name="questionSource"]:checked').value;
    const questionCount = parseInt(document.getElementById('questionCount').value);
    const shuffle = document.getElementById('shuffleQuestions').checked;

    console.log('Starting quiz with source:', selectedSource);

    if (selectedSource === 'custom') {
        // Get selected custom files
        const selectedFiles = Array.from(document.querySelectorAll('.custom-file-checkbox:checked'));

        if (selectedFiles.length === 0) {
            alert('Please select at least one custom file');
            return;
        }

        // For now, just use the first selected file
        const fileId = selectedFiles[0].value;
        console.log('Loading custom file:', fileId);

        // Start quiz with custom file
        const success = await Quiz.start(fileId, questionCount, shuffle);
        if (!success) {
            console.error('Failed to start quiz');
        }
    } else if (selectedSource === 'builtin') {
        // Use built-in questions (would need API endpoint)
        alert('Built-in questions require a backend server. Please use custom files for now.');
    } else {
        // Mixed mode
        alert('Mixed mode not yet implemented. Please select either built-in or custom.');
    }
}

// Update Home Stats
function updateHomeStats() {
    const customFiles = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
    const totalQuestions = customFiles.reduce((sum, file) => sum + (file.questions?.length || 0), 0);

    const totalQuestionsEl = document.getElementById('totalQuestions');
    if (totalQuestionsEl) {
        totalQuestionsEl.textContent = totalQuestions || '300';
    }

    const totalTopicsEl = document.getElementById('totalTopics');
    if (totalTopicsEl) {
        // Count unique topics from custom files
        const allTopics = new Set();
        customFiles.forEach(file => {
            file.questions?.forEach(q => {
                if (q.topic) allTopics.add(q.topic);
            });
        });
        totalTopicsEl.textContent = allTopics.size || '14';
    }

    // Load quiz history
    const quizHistory = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    const quizzesTakenEl = document.getElementById('quizzesTaken');
    if (quizzesTakenEl) {
        quizzesTakenEl.textContent = quizHistory.length;
    }

    // Calculate average score
    if (quizHistory.length > 0) {
        const avgScore = quizHistory.reduce((sum, quiz) => {
            const percentage = (quiz.correctAnswers / quiz.totalQuestions) * 100;
            return sum + percentage;
        }, 0) / quizHistory.length;

        const avgScoreEl = document.getElementById('avgScore');
        if (avgScoreEl) {
            avgScoreEl.textContent = Math.round(avgScore) + '%';
        }
    }
}

// Make functions global
window.showPage = showPage;
window.handleSourceChange = handleSourceChange;
window.selectAllTopics = selectAllTopics;
window.deselectAllTopics = deselectAllTopics;
window.startQuizNew = startQuizNew;
window.toggleTheme = toggleTheme;
