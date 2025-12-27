/**
 * Storage Handler - LocalStorage Wrapper
 * 
 * Handles all localStorage operations for the quiz app
 * Created: Late 2024
 * Last modified: Dec 2024 - added Boost feature support
 */

const Storage = {
    // storage keys
    KEYS: {
        QUIZ_HISTORY: 'quizHistory',
        THEME: 'theme',
        ACHIEVEMENTS: 'achievements',
        WRONG_ANSWERS: 'wrongAnswers'  // added for boost feature
    },

    // Get quiz history
    getQuizHistory() {
        try {
            const history = localStorage.getItem(this.KEYS.QUIZ_HISTORY);
            return history ? JSON.parse(history) : [];
        } catch (err) {
            console.error('Error reading quiz history:', err);
            return [];
        }
    },

    // Save a quiz attempt
    saveQuizAttempt(attempt) {
        try {
            const history = this.getQuizHistory();

            if (!attempt.timestamp) {
                attempt.timestamp = new Date().toISOString();
            }

            attempt.id = Date.now(); // simple unique id
            history.push(attempt);

            localStorage.setItem(this.KEYS.QUIZ_HISTORY, JSON.stringify(history));
            return true;
        } catch (err) {
            console.error('Error saving quiz attempt:', err);
            return false;
        }
    },

    getTheme() {
        return localStorage.getItem(this.KEYS.THEME) || 'light';
    },

    saveTheme(theme) {
        localStorage.setItem(this.KEYS.THEME, theme);
    },

    // Achievements stuff
    getAchievements() {
        try {
            const achievements = localStorage.getItem(this.KEYS.ACHIEVEMENTS);
            return achievements ? JSON.parse(achievements) : [];
        } catch (err) {
            console.error('Error reading achievements:', err);
            return [];
        }
    },

    saveAchievement(achievement) {
        try {
            const achievements = this.getAchievements();

            // don't add duplicates
            if (achievements.some(a => a.id === achievement.id)) {
                return false;
            }

            achievement.unlockedAt = new Date().toISOString();
            achievements.push(achievement);

            localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
            return true;
        } catch (err) {
            console.error('Error saving achievement:', err);
            return false;
        }
    },

    // Clear everything - use with caution!
    clearAll() {
        if (confirm('Are you sure you want to delete all your quiz data? This cannot be undone.')) {
            localStorage.removeItem(this.KEYS.QUIZ_HISTORY);
            localStorage.removeItem(this.KEYS.ACHIEVEMENTS);
            localStorage.removeItem(this.KEYS.WRONG_ANSWERS);
            return true;
        }
        return false;
    },

    // Export to JSON file
    exportData() {
        const data = {
            quizHistory: this.getQuizHistory(),
            achievements: this.getAchievements(),
            wrongAnswers: this.getWrongAnswers(),
            exportedAt: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quiz-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
    },

    // Calculate stats from history
    getOverallStats() {
        const history = this.getQuizHistory();

        if (history.length === 0) {
            return {
                totalAttempts: 0,
                totalQuestions: 0,
                totalCorrect: 0,
                averageScore: 0,
                bestScore: 0,
                bestStreak: 0
            };
        }

        let totalQuestions = 0;
        let totalCorrect = 0;
        let bestScore = 0;
        let bestStreak = 0;

        history.forEach(attempt => {
            totalQuestions += attempt.totalQuestions;
            totalCorrect += attempt.correctAnswers;

            const scorePercent = (attempt.correctAnswers / attempt.totalQuestions) * 100;
            if (scorePercent > bestScore) {
                bestScore = scorePercent;
            }

            if (attempt.streak && attempt.streak > bestStreak) {
                bestStreak = attempt.streak;
            }
        });

        const avg = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

        return {
            totalAttempts: history.length,
            totalQuestions,
            totalCorrect,
            averageScore: Math.round(avg),
            bestScore: Math.round(bestScore),
            bestStreak
        };
    },

    // ========== BOOST FEATURE - WRONG ANSWER TRACKING ==========
    // Added Dec 2024 for the new Boost learning feature

    getWrongAnswers() {
        try {
            const wrongAnswers = localStorage.getItem(this.KEYS.WRONG_ANSWERS);
            return wrongAnswers ? JSON.parse(wrongAnswers) : [];
        } catch (err) {
            console.error('Error reading wrong answers:', err);
            return [];
        }
    },

    // Log a wrong answer for later practice
    logWrongAnswer(questionData) {
        try {
            const wrongAnswers = this.getWrongAnswers();

            // check if already exists for this pack
            const existingIdx = wrongAnswers.findIndex(wa =>
                wa.questionId === questionData.questionId &&
                wa.packId === questionData.packId &&
                wa.question === questionData.question
            );

            if (existingIdx !== -1) {
                // already there - just increment attempts
                wrongAnswers[existingIdx].attemptCount++;
                wrongAnswers[existingIdx].timestamp = new Date().toISOString();
                wrongAnswers[existingIdx].userAnswer = questionData.userAnswer;
            } else {
                // new wrong answer
                const wrongAnswer = {
                    id: `wa_${Date.now()}_${questionData.questionId}`,
                    questionId: questionData.questionId,
                    question: questionData.question,
                    options: questionData.options,
                    correctAnswer: questionData.correctAnswer,
                    userAnswer: questionData.userAnswer,
                    explanation: questionData.explanation || '',
                    topic: questionData.topic || 'General',
                    packId: questionData.packId,
                    packName: questionData.packName || 'Unknown Pack',
                    timestamp: new Date().toISOString(),
                    attemptCount: 1
                };

                wrongAnswers.push(wrongAnswer);
            }

            localStorage.setItem(this.KEYS.WRONG_ANSWERS, JSON.stringify(wrongAnswers));
            return true;
        } catch (err) {
            console.error('Error logging wrong answer:', err);
            return false;
        }
    },

    // Get wrong answers for specific pack
    getWrongAnswersByPack(packId) {
        try {
            const all = this.getWrongAnswers();
            return all.filter(wa => wa.packId === packId);
        } catch (err) {
            console.error('Error getting wrong answers by pack:', err);
            return [];
        }
    },

    // Remove specific wrong answer (when answered correctly)
    clearWrongAnswer(wrongAnswerId) {
        try {
            const wrongAnswers = this.getWrongAnswers();
            const filtered = wrongAnswers.filter(wa => wa.id !== wrongAnswerId);

            localStorage.setItem(this.KEYS.WRONG_ANSWERS, JSON.stringify(filtered));
            return true;
        } catch (err) {
            console.error('Error clearing wrong answer:', err);
            return false;
        }
    },

    // Clear wrong answer by matching question
    clearMatchingWrongAnswer(question, packId) {
        try {
            const wrongAnswers = this.getWrongAnswers();
            const filtered = wrongAnswers.filter(wa =>
                !(wa.question === question.question && wa.packId === packId)
            );

            if (filtered.length < wrongAnswers.length) {
                localStorage.setItem(this.KEYS.WRONG_ANSWERS, JSON.stringify(filtered));
                console.log('✅ Question cleared from Boost!');
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error clearing matching wrong answer:', err);
            return false;
        }
    },

    getWrongAnswersCount() {
        try {
            return this.getWrongAnswers().length;
        } catch (err) {
            console.error('Error getting wrong answers count:', err);
            return 0;
        }
    },

    // Get stats about wrong answers
    getWrongAnswerStats() {
        try {
            const wrongAnswers = this.getWrongAnswers();

            if (wrongAnswers.length === 0) {
                return {
                    totalWrongAnswers: 0,
                    uniquePacks: 0,
                    topicBreakdown: {},
                    packBreakdown: {}
                };
            }

            const topicBreakdown = {};
            const packBreakdown = {};
            const uniquePacks = new Set();

            wrongAnswers.forEach(wa => {
                // count by topic
                const topic = wa.topic || 'General';
                if (!topicBreakdown[topic]) {
                    topicBreakdown[topic] = 0;
                }
                topicBreakdown[topic]++;

                // count by pack
                if (!packBreakdown[wa.packId]) {
                    packBreakdown[wa.packId] = {
                        packName: wa.packName,
                        count: 0
                    };
                }
                packBreakdown[wa.packId].count++;
                uniquePacks.add(wa.packId);
            });

            return {
                totalWrongAnswers: wrongAnswers.length,
                uniquePacks: uniquePacks.size,
                topicBreakdown,
                packBreakdown
            };
        } catch (err) {
            console.error('Error getting wrong answer stats:', err);
            return {
                totalWrongAnswers: 0,
                uniquePacks: 0,
                topicBreakdown: {},
                packBreakdown: {}
            };
        }
    },

    // Clear all wrong answers for a pack
    clearWrongAnswersByPack(packId) {
        try {
            const wrongAnswers = this.getWrongAnswers();
            const filtered = wrongAnswers.filter(wa => wa.packId !== packId);

            localStorage.setItem(this.KEYS.WRONG_ANSWERS, JSON.stringify(filtered));
            return true;
        } catch (err) {
            console.error('Error clearing wrong answers by pack:', err);
            return false;
        }
    }
};
