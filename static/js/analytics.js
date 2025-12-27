/**
 * Analytics Page JavaScript
 */

let performanceChart = null;
let topicChart = null;

// Initialize analytics page
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupThemeToggle();
    initAnalytics();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function setupThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const icon = themeToggle.querySelector('i');
    if (!icon) return;

    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// Analytics Functions
function initAnalytics() {
    updateOverviewStats();
    renderPerformanceChart();
    renderTopicChart();
    renderRecentQuizzes();
}

function updateOverviewStats() {
    const stats = Storage.getOverallStats();

    const totalAttemptsEl = document.getElementById('totalAttempts');
    const averageScoreEl = document.getElementById('averageScore');
    const bestScoreEl = document.getElementById('bestScore');
    const totalQuestionsEl = document.getElementById('totalQuestions');

    if (totalAttemptsEl) totalAttemptsEl.textContent = stats.totalAttempts;
    if (averageScoreEl) averageScoreEl.textContent = `${stats.averageScore}%`;
    if (bestScoreEl) bestScoreEl.textContent = `${stats.bestScore}%`;
    if (totalQuestionsEl) totalQuestionsEl.textContent = stats.totalQuestions;
}

function renderPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    const history = Storage.getQuizHistory();

    if (performanceChart) {
        performanceChart.destroy();
    }

    if (history.length === 0) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }

    const labels = history.map((_, index) => `Quiz ${index + 1}`);
    const scores = history.map(attempt =>
        Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
    );

    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Score (%)',
                data: scores,
                borderColor: '#FF6B35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#FF6B35',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            return `Score: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function (value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function renderTopicChart() {
    const ctx = document.getElementById('topicChart');
    if (!ctx) return;

    const history = Storage.getQuizHistory();

    if (topicChart) {
        topicChart.destroy();
    }

    if (history.length === 0) {
        ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
        return;
    }

    // Aggregate performance by topic
    const topicStats = {};

    history.forEach(attempt => {
        if (attempt.topicPerformance) {
            Object.entries(attempt.topicPerformance).forEach(([topic, stats]) => {
                if (!topicStats[topic]) {
                    topicStats[topic] = { correct: 0, total: 0 };
                }
                topicStats[topic].correct += stats.correct;
                topicStats[topic].total += stats.total;
            });
        }
    });

    const topics = Object.keys(topicStats);
    const accuracies = topics.map(topic =>
        Math.round((topicStats[topic].correct / topicStats[topic].total) * 100)
    );

    topicChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topics,
            datasets: [{
                label: 'Accuracy (%)',
                data: accuracies,
                backgroundColor: '#FF6B35',
                borderColor: '#FF6B35',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function (value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function renderRecentQuizzes() {
    const container = document.getElementById('recentQuizzes');
    if (!container) return;

    const history = Storage.getQuizHistory();

    if (history.length === 0) {
        container.innerHTML = '<p class="text-secondary">No quiz history yet. Take a quiz to see your progress!</p>';
        return;
    }

    const recentHistory = [...history].reverse().slice(0, 10);

    const table = document.createElement('table');
    table.className = 'table';

    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Topic</th>
                <th>Questions</th>
                <th>Score</th>
            </tr>
        </thead>
        <tbody>
            ${recentHistory.map(attempt => {
        const date = new Date(attempt.timestamp);
        const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const score = Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100);

        return `
                    <tr>
                        <td>${dateStr}</td>
                        <td>${attempt.chapterTitle || 'All Topics'}</td>
                        <td>${attempt.totalQuestions}</td>
                        <td><span class="badge badge-${score >= 70 ? 'success' : 'error'}">${score}%</span></td>
                    </tr>
                `;
    }).join('')}
        </tbody>
    `;

    container.innerHTML = '';
    container.appendChild(table);
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all quiz history? This cannot be undone.')) {
        localStorage.removeItem('quizHistory');
        localStorage.removeItem('quizStats');

        alert('Quiz history has been cleared');
        initAnalytics();
    }
}

// Make functions global
window.clearHistory = clearHistory;
window.toggleTheme = toggleTheme;
