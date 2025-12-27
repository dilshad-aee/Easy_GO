/**
 * Quiz Page JavaScript
 * Handles quiz functionality and navigation
 */

const Quiz = {
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    answers: [],
    startTime: null,
    topicPerformance: {},

    /**
     * Initialize quiz from configuration
     */
    async init() {
        try {
            // Load quiz configuration
            const quizConfig = JSON.parse(localStorage.getItem('quizConfig') || '{}');

            if (!quizConfig.fileId) {
                alert('No quiz configuration found. Redirecting to pack selection...');
                window.location.href = '/pack-selection.html';
                return;
            }

            // Load questions
            let questions = [];

            // Check if this is a Boost quiz (retry wrong answers)
            if (quizConfig.isBoost && quizConfig.boostQuestions) {
                questions = quizConfig.boostQuestions.map(wa => ({
                    question: wa.question,
                    options: wa.options,
                    correctAnswer: wa.correctAnswer,
                    explanation: wa.explanation,
                    topic: wa.topic,
                    wrongAnswerId: wa.id  // Track for clearing on correct answer
                }));

                if (quizConfig.shuffle) {
                    questions = this.shuffleArray(questions);
                }
            } else if (quizConfig.fileId.startsWith('custom_')) {
                const customFiles = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
                const customFile = customFiles.find(f => f.id === quizConfig.fileId);

                if (customFile && customFile.questions && Array.isArray(customFile.questions)) {
                    questions = [...customFile.questions];

                    if (quizConfig.shuffle) {
                        questions = this.shuffleArray(questions);
                    }
                    if (quizConfig.questionCount && quizConfig.questionCount < questions.length) {
                        questions = questions.slice(0, quizConfig.questionCount);
                    }
                } else {
                    alert('Custom file not found or has no questions!');
                    window.location.href = '/pack-selection.html';
                    return;
                }
            } else {
                // API-based questions would go here
                alert('Built-in questions not yet implemented.');
                window.location.href = '/pack-selection.html';
                return;
            }

            if (questions.length === 0) {
                alert('No questions available!');
                window.location.href = '/pack-selection.html';
                return;
            }

            this.questions = questions;
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.answers = new Array(this.questions.length).fill(null);
            this.startTime = Date.now();
            this.topicPerformance = {};

            // Display first question
            this.displayQuestion();
        } catch (error) {
            console.error('Error initializing quiz:', error);
            alert('Failed to load quiz. Please try again.');
            window.location.href = '/pack-selection.html';
        }
    },

    /**
     * Shuffle array helper
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    /**
     * Display current question
     */
    displayQuestion() {
        const question = this.questions[this.currentQuestionIndex];

        // Update progress
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        const progressBar = document.getElementById('progressBar');
        if (progressBar) progressBar.style.width = `${progress}%`;

        const currentQ = document.getElementById('currentQuestion');
        if (currentQ) currentQ.textContent = this.currentQuestionIndex + 1;

        const totalQ = document.getElementById('totalQuizQuestions');
        if (totalQ) totalQ.textContent = this.questions.length;

        // Update score
        const currentScore = document.getElementById('currentScore');
        if (currentScore) currentScore.textContent = this.score;

        const maxScore = document.getElementById('maxScore');
        if (maxScore) maxScore.textContent = this.currentQuestionIndex;

        // Update question number
        const questionNumber = document.getElementById('questionNumber');
        if (questionNumber) questionNumber.textContent = `Question ${this.currentQuestionIndex + 1}`;

        // Display question
        const questionTopic = document.getElementById('questionTopic');
        if (questionTopic) questionTopic.textContent = question.topic || 'General';

        const questionText = document.getElementById('questionText');
        if (questionText) questionText.textContent = question.question;

        // Display options
        const optionsList = document.getElementById('optionsList');
        if (optionsList) {
            optionsList.innerHTML = question.options.map((option, index) => `
                <div class="option" data-index="${index}" onclick="Quiz.selectAnswer(${index})">
                    <div class="option-label">${String.fromCharCode(65 + index)}</div>
                    <div class="option-text">${option}</div>
                </div>
            `).join('');
        }

        // Hide feedback
        const feedback = document.getElementById('feedbackSection');
        if (feedback) feedback.style.display = 'none';

        // Update navigation buttons
        this.updateNavigationButtons();
    },

    /**
     * Handle answer selection
     */
    selectAnswer(selectedIndex) {
        // Prevent answering the same question multiple times
        if (this.answers[this.currentQuestionIndex] !== null) {
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        const options = document.querySelectorAll('.option');

        // Disable all options
        options.forEach(opt => opt.classList.add('disabled'));

        // Mark selected option
        const selectedOption = options[selectedIndex];
        selectedOption.classList.add('selected');

        // Check if correct
        const isCorrect = selectedIndex === question.correctAnswer;

        // Store answer
        this.answers[this.currentQuestionIndex] = {
            questionId: this.currentQuestionIndex,
            selectedAnswer: selectedIndex,
            correctAnswer: question.correctAnswer,
            isCorrect: isCorrect,
            topic: question.topic
        };

        // Update score
        if (isCorrect) {
            this.score++;
            selectedOption.classList.add('correct');
        } else {
            selectedOption.classList.add('wrong');
            options[question.correctAnswer].classList.add('correct');
        }

        // Update score display
        const currentScore = document.getElementById('currentScore');
        if (currentScore) currentScore.textContent = this.score;

        const maxScore = document.getElementById('maxScore');
        if (maxScore) maxScore.textContent = this.currentQuestionIndex + 1;

        // Track topic performance
        const topic = question.topic || 'General';
        if (!this.topicPerformance[topic]) {
            this.topicPerformance[topic] = { correct: 0, total: 0 };
        }
        this.topicPerformance[topic].total++;
        if (isCorrect) {
            this.topicPerformance[topic].correct++;
        }

        // === BOOST FEATURE: Wrong Answer Logging ===
        const quizConfig = JSON.parse(localStorage.getItem('quizConfig') || '{}');

        if (!isCorrect) {
            // Log wrong answer to Boost system
            const wrongAnswerData = {
                questionId: this.currentQuestionIndex,
                question: question.question,
                options: question.options,
                correctAnswer: question.correctAnswer,
                userAnswer: selectedIndex,
                explanation: question.explanation || '',
                topic: question.topic || 'General',
                packId: quizConfig.fileId || 'unknown',
                packName: quizConfig.fileName || 'Unknown Pack',
                timestamp: new Date().toISOString(),
                attemptCount: 1
            };
            Storage.logWrongAnswer(wrongAnswerData);
        } else {
            // If answered correctly, clear from Boost if it was previously wrong
            Storage.clearMatchingWrongAnswer(question, quizConfig.fileId);

            // Special handling for Boost quiz mode - clear by wrong answer ID
            if (question.wrongAnswerId) {
                Storage.clearWrongAnswer(question.wrongAnswerId);
            }
        }

        // Show feedback
        this.showFeedback(isCorrect, question.explanation);

        // Show next/finish button and hide skip button
        const nextBtn = document.getElementById('nextBtn');
        const finishBtn = document.getElementById('finishBtn');
        const skipBtn = document.getElementById('skipBtn');

        if (skipBtn) skipBtn.style.display = 'none';

        if (this.currentQuestionIndex < this.questions.length - 1) {
            if (nextBtn) nextBtn.style.display = 'inline-flex';
            if (finishBtn) finishBtn.style.display = 'none';
        } else {
            if (nextBtn) nextBtn.style.display = 'none';
            if (finishBtn) finishBtn.style.display = 'inline-flex';
        }
    },

    /**
     * Show feedback for answer
     */
    showFeedback(isCorrect, explanation) {
        const feedback = document.getElementById('feedbackSection');
        if (!feedback) return;

        const feedbackTitle = document.getElementById('feedbackTitle');
        const feedbackText = document.getElementById('feedbackText');

        if (isCorrect) {
            feedback.className = 'feedback success';
            if (feedbackTitle) feedbackTitle.textContent = '✅ Correct!';
        } else {
            feedback.className = 'feedback error';
            if (feedbackTitle) feedbackTitle.textContent = '❌ Incorrect';
        }

        if (feedbackText) feedbackText.textContent = explanation || '';
        feedback.style.display = 'block';
    },

    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const skipBtn = document.getElementById('skipBtn');
        const finishBtn = document.getElementById('finishBtn');

        // Previous button
        if (prevBtn) prevBtn.disabled = this.currentQuestionIndex === 0;

        // Hide next/finish buttons initially
        if (nextBtn) nextBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'none';

        // Show skip button only if question not answered
        if (skipBtn) {
            skipBtn.style.display = this.answers[this.currentQuestionIndex] === null ? 'inline-flex' : 'none';
        }
    },

    /**
     * Go to next question
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        }
    },

    /**
     * Skip current question
     */
    skipQuestion() {
        if (this.answers[this.currentQuestionIndex] !== null) {
            return;
        }

        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        } else {
            const skipBtn = document.getElementById('skipBtn');
            if (skipBtn) skipBtn.style.display = 'none';

            const finishBtn = document.getElementById('finishBtn');
            if (finishBtn) finishBtn.style.display = 'inline-flex';
        }
    },

    /**
     * Go to previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();

            // If already answered, show the answer
            const answer = this.answers[this.currentQuestionIndex];
            if (answer !== null) {
                const options = document.querySelectorAll('.option');
                options.forEach(opt => opt.classList.add('disabled'));

                options[answer.selectedAnswer].classList.add('selected');
                if (answer.isCorrect) {
                    options[answer.selectedAnswer].classList.add('correct');
                } else {
                    options[answer.selectedAnswer].classList.add('wrong');
                    options[answer.correctAnswer].classList.add('correct');
                }

                this.showFeedback(answer.isCorrect, this.questions[this.currentQuestionIndex].explanation);

                if (this.currentQuestionIndex < this.questions.length - 1) {
                    document.getElementById('nextBtn').style.display = 'inline-flex';
                } else {
                    document.getElementById('finishBtn').style.display = 'inline-flex';
                }
            }
        }
    },

    /**
     * Finish quiz and show results
     */
    finishQuiz() {
        // Calculate time spent
        const timeSpent = Math.round((Date.now() - this.startTime) / 1000 / 60);

        // Calculate streak
        let currentStreak = 0;
        let maxStreak = 0;
        let missedQuestions = 0;

        this.answers.forEach(answer => {
            if (!answer) {
                missedQuestions++;
            } else if (answer.isCorrect) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });

        // Prepare quiz result
        const result = {
            chapterId: this.questions[0].chapterId || 'all',
            chapterTitle: this.questions[0].chapterTitle || 'All Topics',
            totalQuestions: this.questions.length,
            correctAnswers: this.score,
            wrongAnswers: this.questions.length - this.score - missedQuestions,
            missedQuestions: missedQuestions,
            timeSpent: timeSpent,
            streak: maxStreak,
            topicPerformance: this.topicPerformance,
            timestamp: new Date().toISOString(),
            // Add wrong answers from this quiz session for results page
            wrongAnswersFromQuiz: this.answers
                .map((answer, index) => ({
                    ...answer,
                    question: this.questions[index]
                }))
                .filter(a => a && a.answer !== null && !a.isCorrect)
                .map(a => ({
                    questionId: a.questionId,
                    topic: a.topic,
                    question: a.question
                }))
        };

        // Save to storage
        Storage.saveQuizAttempt(result);

        // Save result to localStorage for results page
        localStorage.setItem('currentQuizResult', JSON.stringify(result));

        // Navigate to results page
        window.location.href = '/results.html';
    },

    /**
     * Quit quiz
     */
    quit() {
        if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
            window.location.href = '/';
        }
    }
};

// Global functions for HTML onclick handlers
function nextQuestion() {
    Quiz.nextQuestion();
}

function previousQuestion() {
    Quiz.previousQuestion();
}

function skipQuestion() {
    Quiz.skipQuestion();
}

function finishQuiz() {
    Quiz.finishQuiz();
}

function quitQuiz() {
    Quiz.quit();
}

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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupThemeToggle();
    Quiz.init();
});
