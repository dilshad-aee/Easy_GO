/**
 * Quiz Module - Handle quiz functionality
 */

const Quiz = {
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    answers: [],
    startTime: null,
    topicPerformance: {},

    /**
     * Start a new quiz
     */
    async start(chapterId, questionCount, shuffle) {
        try {
            let questions = [];

            console.log('Starting quiz with chapterId:', chapterId);

            // Check if it's a custom file
            if (chapterId.startsWith('custom_')) {
                console.log('Loading custom file...');
                const customFiles = JSON.parse(localStorage.getItem('customQuestionFiles') || '[]');
                console.log('Custom files in storage:', customFiles);

                const customFile = customFiles.find(f => f.id === chapterId);
                console.log('Found custom file:', customFile);

                if (customFile && customFile.questions && Array.isArray(customFile.questions)) {
                    questions = [...customFile.questions];
                    console.log('Loaded questions:', questions.length);

                    if (shuffle) {
                        questions = this.shuffleArray(questions);
                    }
                    if (questionCount && questionCount < questions.length) {
                        questions = questions.slice(0, questionCount);
                    }
                } else {
                    console.error('Custom file not found or invalid:', chapterId);
                    alert('Custom file not found or has no questions!');
                    return false;
                }
            } else {
                // Fetch questions from API
                let url;
                if (chapterId === 'all') {
                    url = `/api/questions/all?limit=${questionCount}&shuffle=${shuffle}`;
                } else {
                    url = `/api/questions/${chapterId}?limit=${questionCount}&shuffle=${shuffle}`;
                }

                const response = await fetch(url);
                const data = await response.json();
                questions = data.questions || [];
            }

            console.log('Final questions count:', questions.length);

            if (questions.length === 0) {
                alert('No questions available!');
                return false;
            }

            this.questions = questions;

            // Initialize quiz state
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.answers = new Array(this.questions.length).fill(null);
            this.startTime = Date.now();
            this.topicPerformance = {};

            // Show quiz view
            showPage('quizPage');

            // Display first question
            this.displayQuestion();

            return true;
        } catch (error) {
            console.error('Error starting quiz:', error);
            alert('Failed to load questions. Please try again.');
            return false;
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
            return; // Already answered
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
            // Show correct answer
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

        // Show feedback
        this.showFeedback(isCorrect, question.explanation);

        // Show next/finish button and hide skip button
        const nextBtn = document.getElementById('nextBtn');
        const finishBtn = document.getElementById('finishBtn');
        const skipBtn = document.getElementById('skipBtn');

        // Hide skip button since question is answered
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

        // Hide next/finish buttons initially (shown after answering)
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
        // Only allow skipping if question hasn't been answered
        if (this.answers[this.currentQuestionIndex] !== null) {
            return; // Already answered, can't skip
        }

        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        } else {
            // Last question - show finish button
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

                // Show appropriate button
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
        const timeSpent = Math.round((Date.now() - this.startTime) / 1000 / 60); // minutes

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
            timestamp: new Date().toISOString()
        };

        // Save to storage
        Storage.saveQuizAttempt(result);

        // Show results
        this.showResults(result);
    },

    /**
     * Show results view
     */
    showResults(result) {
        const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);

        // Update results
        const scorePercentage = document.getElementById('scorePercentage');
        if (scorePercentage) scorePercentage.textContent = `${percentage}%`;

        const correctCount = document.getElementById('correctCount');
        if (correctCount) correctCount.textContent = result.correctAnswers;

        const wrongCount = document.getElementById('wrongCount');
        if (wrongCount) wrongCount.textContent = result.wrongAnswers;

        const missedCount = document.getElementById('missedCount');
        if (missedCount) missedCount.textContent = result.missedQuestions || 0;

        const totalResultQuestions = document.getElementById('totalResultQuestions');
        if (totalResultQuestions) totalResultQuestions.textContent = result.totalQuestions;

        // Display topics covered
        const topicsCovered = document.getElementById('topicsCovered');
        if (topicsCovered && result.topicPerformance) {
            const topicsHTML = Object.entries(result.topicPerformance).map(([topic, stats]) => {
                const topicAccuracy = Math.round((stats.correct / stats.total) * 100);
                return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-light);">
                        <span><i class="fas fa-check-circle" style="color: var(--accent); margin-right: 8px;"></i>${topic}</span>
                        <span class="badge badge-${topicAccuracy >= 70 ? 'success' : 'error'}">${stats.correct}/${stats.total} (${topicAccuracy}%)</span>
                    </div>
                `;
            }).join('');
            topicsCovered.innerHTML = topicsHTML || '<p class="text-secondary">No topics data available</p>';
        }

        // Show results view
        showPage('resultsPage');
    },

    /**
     * Quit quiz
     */
    quit() {
        if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
            showPage('homePage');
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
