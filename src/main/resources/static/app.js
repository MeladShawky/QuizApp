// QuizCraft - SPA Client Logic

// Configuration & API endpoints
const API_BASE = '';
const ENDPOINTS = {
    getAllQuestions: `${API_BASE}/question/allQuestions`,
    addQuestion: `${API_BASE}/question/add`,
    createQuiz: `${API_BASE}/quiz/create`,
    getQuiz: (id) => `${API_BASE}/quiz/get/${id}`,
    getAllQuizzes: `${API_BASE}/quiz/all`,
    submitQuiz: (id) => `${API_BASE}/quiz/submit/${id}`
};

// Global App State
const state = {
    questions: [],
    quizzes: [],
    categories: new Set(),
    activeTab: 'dashboard',
    currentQuiz: {
        id: null,
        title: '',
        category: '',
        questions: [],
        answers: {}, // questionId -> selectedAnswerText
        currentIndex: 0,
        timerInterval: null,
        secondsElapsed: 0
    }
};

// DOM Elements
const elements = {
    // Navigation
    navLinks: document.querySelectorAll('.nav-link'),
    tabs: document.querySelectorAll('.tab-content, .quiz-play-view, .results-view'),
    viewTitle: document.getElementById('current-view-title'),
    btnRefreshData: document.getElementById('btn-refresh-data'),

    // Dashboard
    statTotalQuizzes: document.getElementById('stat-total-quizzes'),
    statTotalQuestions: document.getElementById('stat-total-questions'),
    statCategoriesCount: document.getElementById('stat-categories-count'),
    quizzesContainer: document.getElementById('quizzes-container'),
    quizCountBadge: document.getElementById('quiz-count-badge'),

    // Create Quiz
    quizForm: document.getElementById('quiz-generator-form'),
    quizTitleInput: document.getElementById('quiz-title'),
    quizCategorySelect: document.getElementById('quiz-category'),
    quizNumQInput: document.getElementById('quiz-num-q'),

    // Question Bank
    searchQuestions: document.getElementById('search-questions'),
    filterCategory: document.getElementById('filter-category'),
    questionsListContainer: document.getElementById('questions-list-container'),
    addQuestionForm: document.getElementById('add-question-form'),
    qTitle: document.getElementById('q-title'),
    qCategory: document.getElementById('q-category'),
    qDifficulty: document.getElementById('q-difficulty'),
    qOpt1: document.getElementById('q-opt1'),
    qOpt2: document.getElementById('q-opt2'),
    qOpt3: document.getElementById('q-opt3'),
    qOpt4: document.getElementById('q-opt4'),
    qAnswer: document.getElementById('q-answer'),

    // Quiz Play
    quizPlayOverlay: document.getElementById('tab-quiz-play'),
    playQuizCategory: document.getElementById('play-quiz-category'),
    playQuizTitle: document.getElementById('play-quiz-title'),
    quizTimerText: document.getElementById('quiz-timer-text'),
    progressBar: document.getElementById('quiz-progress-bar'),
    currentQIndex: document.getElementById('current-q-index'),
    totalQCount: document.getElementById('total-q-count'),
    playQuestionTitle: document.getElementById('play-question-title'),
    playOptionsContainer: document.getElementById('play-options-container'),
    btnQuizPrev: document.getElementById('btn-quiz-prev'),
    btnQuizNext: document.getElementById('btn-quiz-next'),

    // Quiz Results
    quizResultsOverlay: document.getElementById('tab-quiz-results'),
    resultsQuizTitle: document.getElementById('results-quiz-title'),
    resultsRingProgress: document.getElementById('results-ring-progress'),
    resultsScoreValue: document.getElementById('results-score-value'),
    resultsScorePercent: document.getElementById('results-score-percent'),
    resultsSummaryTotal: document.getElementById('results-summary-total'),
    resultsSummaryCorrect: document.getElementById('results-summary-correct'),
    resultsSummaryWrong: document.getElementById('results-summary-wrong'),
    resultsFeedbackMessage: document.getElementById('results-feedback-message'),
    btnResultsRetry: document.getElementById('btn-results-retry'),
    btnResultsDashboard: document.getElementById('btn-results-dashboard'),

    // Toast Notification
    toastContainer: document.getElementById('toast-container')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupTabNavigation();
    setupEventListeners();
    refreshAllData();
}

// -------------------------------------------------------------
// EVENT LISTENERS & SETUP
// -------------------------------------------------------------
function setupTabNavigation() {
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

function setupEventListeners() {
    // Refresh Button
    elements.btnRefreshData.addEventListener('click', refreshAllData);

    // Create Quiz Form Submit
    elements.quizForm.addEventListener('submit', handleCreateQuizSubmit);

    // Question Bank Filters
    elements.searchQuestions.addEventListener('input', renderQuestionBankList);
    elements.filterCategory.addEventListener('change', renderQuestionBankList);

    // Question Bank Form Submit
    elements.addQuestionForm.addEventListener('submit', handleAddQuestionSubmit);

    // Quiz Play Navigation
    elements.btnQuizPrev.addEventListener('click', handleQuizPrevQuestion);
    elements.btnQuizNext.addEventListener('click', handleQuizNextQuestion);

    // Results Actions
    elements.btnResultsRetry.addEventListener('click', handleRetryQuiz);
    elements.btnResultsDashboard.addEventListener('click', () => {
        closeOverlayViews();
        switchTab('dashboard');
    });
}

// -------------------------------------------------------------
// NAVIGATION LOGIC
// -------------------------------------------------------------
function switchTab(tabId) {
    state.activeTab = tabId;
    
    // Update active nav link
    elements.navLinks.forEach(link => {
        if (link.getAttribute('data-tab') === tabId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Update Active Tab Content
    elements.tabs.forEach(tab => {
        const id = tab.id;
        if (id === `tab-${tabId}`) {
            tab.classList.add('active');
        } else if (!id.includes('play') && !id.includes('results')) {
            // Keep overlays separate
            tab.classList.remove('active');
        }
    });

    // Update Title in Navbar
    const titles = {
        'dashboard': 'Dashboard',
        'create-quiz': 'Quiz Generator',
        'question-bank': 'Questions Management'
    };
    elements.viewTitle.innerText = titles[tabId] || 'QuizCraft';
}

function closeOverlayViews() {
    elements.quizPlayOverlay.classList.remove('active');
    elements.quizResultsOverlay.classList.remove('active');
    stopTimer();
}

// -------------------------------------------------------------
// DATA SYNCHRONIZATION (FETCH APIs)
// -------------------------------------------------------------
async function refreshAllData() {
    showToast('Syncing with database...', 'info');
    try {
        await Promise.all([
            fetchQuestions(),
            fetchQuizzes()
        ]);
        
        updateStats();
        populateCategoryDropdowns();
        renderQuizzes();
        renderQuestionBankList();
        showToast('System synchronized successfully!', 'success');
    } catch (error) {
        console.error(error);
        showToast('Database connection failed. Check your local server.', 'error');
    }
}

async function fetchQuestions() {
    const response = await fetch(ENDPOINTS.getAllQuestions);
    if (!response.ok) throw new Error('Failed to load questions.');
    state.questions = await response.json();
    
    // Extract categories
    state.categories.clear();
    state.questions.forEach(q => {
        if (q.category) {
            state.categories.add(q.category.trim());
        }
    });
}

async function fetchQuizzes() {
    const response = await fetch(ENDPOINTS.getAllQuizzes);
    if (!response.ok) throw new Error('Failed to load quizzes.');
    state.quizzes = await response.json();
}

function updateStats() {
    elements.statTotalQuestions.innerText = state.questions.length;
    elements.statTotalQuizzes.innerText = state.quizzes.length;
    elements.statCategoriesCount.innerText = state.categories.size;
}

function populateCategoryDropdowns() {
    // Create Quiz Category Select
    const quizCategorySelect = elements.quizCategorySelect;
    const currentQuizVal = quizCategorySelect.value;
    quizCategorySelect.innerHTML = '<option value="" disabled selected>Select category...</option>';
    
    // Filter Category Select
    const filterCategory = elements.filterCategory;
    const currentFilterVal = filterCategory.value;
    filterCategory.innerHTML = '<option value="all">All Categories</option>';

    // Sort categories alphabetically
    const sortedCats = Array.from(state.categories).sort();
    
    sortedCats.forEach(cat => {
        // Quiz creation dropdown
        const option1 = document.createElement('option');
        option1.value = cat;
        option1.innerText = cat;
        quizCategorySelect.appendChild(option1);

        // Filter dropdown
        const option2 = document.createElement('option');
        option2.value = cat;
        option2.innerText = cat;
        filterCategory.appendChild(option2);
    });

    // Reapply previous selections if they still exist
    if (state.categories.has(currentQuizVal)) {
        quizCategorySelect.value = currentQuizVal;
    }
    if (state.categories.has(currentFilterVal) || currentFilterVal === 'all') {
        filterCategory.value = currentFilterVal;
    }
}

// -------------------------------------------------------------
// DASHBOARD RENDERING
// -------------------------------------------------------------
function renderQuizzes() {
    const container = elements.quizzesContainer;
    container.innerHTML = '';
    elements.quizCountBadge.innerText = `${state.quizzes.length} Quizzes`;

    if (state.quizzes.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="fa-solid fa-clipboard-list"></i>
                <p>No quizzes available. Generate one in the <strong>Create Quiz</strong> tab!</p>
            </div>
        `;
        return;
    }

    state.quizzes.forEach(quiz => {
        const card = document.createElement('div');
        card.className = 'quiz-card';
        card.innerHTML = `
            <div class="quiz-info">
                <h3>${escapeHtml(quiz.title)}</h3>
                <div class="quiz-meta">
                    <span class="quiz-meta-item"><i class="fa-solid fa-fingerprint"></i> ID: ${quiz.id}</span>
                </div>
            </div>
            <button class="btn btn-primary btn-block" onclick="startQuizPlay(${quiz.id}, '${escapeQuote(quiz.title)}')">
                <i class="fa-solid fa-play"></i> Start Quiz
            </button>
        `;
        container.appendChild(card);
    });
}

// -------------------------------------------------------------
// CREATOR LOGIC
// -------------------------------------------------------------
async function handleCreateQuizSubmit(e) {
    e.preventDefault();
    const title = elements.quizTitleInput.value.trim();
    const category = elements.quizCategorySelect.value;
    const numQ = parseInt(elements.quizNumQInput.value);

    if (!title || !category || !numQ) {
        showToast('Please fill out all fields.', 'error');
        return;
    }

    const submitBtn = document.getElementById('btn-create-quiz-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';

    try {
        const url = `${ENDPOINTS.createQuiz}?category=${encodeURIComponent(category)}&numQ=${numQ}&title=${encodeURIComponent(title)}`;
        const response = await fetch(url, {
            method: 'POST'
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || 'Fail to create quiz.');
        }

        showToast(`Quiz "${title}" created successfully!`, 'success');
        elements.quizForm.reset();
        
        // Switch to dashboard and refresh data
        await fetchQuizzes();
        renderQuizzes();
        updateStats();
        switchTab('dashboard');
    } catch (err) {
        console.error(err);
        showToast(`Failed to create quiz: ${err.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-sparkles"></i> Create Quiz';
    }
}

// -------------------------------------------------------------
// QUESTION BANK LOGIC
// -------------------------------------------------------------
function renderQuestionBankList() {
    const listContainer = elements.questionsListContainer;
    listContainer.innerHTML = '';

    const searchQuery = elements.searchQuestions.value.toLowerCase().trim();
    const filterCat = elements.filterCategory.value;

    const filtered = state.questions.filter(q => {
        const matchesSearch = q.questionTitle.toLowerCase().includes(searchQuery) ||
                              q.option1.toLowerCase().includes(searchQuery) ||
                              q.option2.toLowerCase().includes(searchQuery) ||
                              q.option3.toLowerCase().includes(searchQuery) ||
                              q.option4.toLowerCase().includes(searchQuery);
        
        const matchesCategory = filterCat === 'all' || q.category === filterCat;
        return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <p>No questions found matching your filters.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(q => {
        const item = document.createElement('div');
        item.className = 'question-item';

        // Check which options are matching correct answer
        const isOpt1Correct = isAnswerMatch(q.option1, q.rightAnswer);
        const isOpt2Correct = isAnswerMatch(q.option2, q.rightAnswer);
        const isOpt3Correct = isAnswerMatch(q.option3, q.rightAnswer);
        const isOpt4Correct = isAnswerMatch(q.option4, q.rightAnswer);

        item.innerHTML = `
            <div class="q-item-header">
                <span class="badge"><i class="fa-solid fa-folder"></i> ${escapeHtml(q.category)}</span>
                <div class="q-item-tags">
                    <span class="tag-difficulty ${q.difficultyLevel.toLowerCase()}">${q.difficultyLevel}</span>
                </div>
            </div>
            <div class="q-item-text">${escapeHtml(q.questionTitle)}</div>
            <div class="q-item-options">
                <div class="q-item-opt ${isOpt1Correct ? 'correct' : ''}">1: ${escapeHtml(q.option1)} ${isOpt1Correct ? '✓' : ''}</div>
                <div class="q-item-opt ${isOpt2Correct ? 'correct' : ''}">2: ${escapeHtml(q.option2)} ${isOpt2Correct ? '✓' : ''}</div>
                <div class="q-item-opt ${isOpt3Correct ? 'correct' : ''}">3: ${escapeHtml(q.option3)} ${isOpt3Correct ? '✓' : ''}</div>
                <div class="q-item-opt ${isOpt4Correct ? 'correct' : ''}">4: ${escapeHtml(q.option4)} ${isOpt4Correct ? '✓' : ''}</div>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

function isAnswerMatch(optionText, rightAnswerText) {
    if (!optionText || !rightAnswerText) return false;
    return optionText.trim().toLowerCase() === rightAnswerText.trim().toLowerCase();
}

async function handleAddQuestionSubmit(e) {
    e.preventDefault();
    
    const questionTitle = elements.qTitle.value.trim();
    const category = elements.qCategory.value.trim();
    const difficultyLevel = elements.qDifficulty.value;
    const option1 = elements.qOpt1.value.trim();
    const option2 = elements.qOpt2.value.trim();
    const option3 = elements.qOpt3.value.trim();
    const option4 = elements.qOpt4.value.trim();
    const selectedAnswerIndex = elements.qAnswer.value;

    if (!selectedAnswerIndex) {
        showToast('Please specify the correct option.', 'error');
        return;
    }

    // Map rightAnswer text based on selection index
    let rightAnswer = '';
    if (selectedAnswerIndex === '1') rightAnswer = option1;
    else if (selectedAnswerIndex === '2') rightAnswer = option2;
    else if (selectedAnswerIndex === '3') rightAnswer = option3;
    else if (selectedAnswerIndex === '4') rightAnswer = option4;

    const payload = {
        questionTitle,
        category,
        difficultyLevel,
        option1,
        option2,
        option3,
        option4,
        rightAnswer
    };

    try {
        const response = await fetch(ENDPOINTS.addQuestion, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Failed to save question to database.');
        }

        showToast('Question saved to database!', 'success');
        elements.addQuestionForm.reset();
        
        // Refresh local cache and list
        await fetchQuestions();
        updateStats();
        populateCategoryDropdowns();
        renderQuestionBankList();
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}

// -------------------------------------------------------------
// QUIZ ENGINE PLAY LOGIC
// -------------------------------------------------------------
window.startQuizPlay = async function(quizId, quizTitle) {
    showToast('Fetching quiz questions...', 'info');
    try {
        const response = await fetch(ENDPOINTS.getQuiz(quizId));
        if (!response.ok) throw new Error('Could not fetch quiz questions.');
        
        const quizQuestions = await response.json();
        if (!quizQuestions || quizQuestions.length === 0) {
            showToast('This quiz has no questions associated.', 'error');
            return;
        }

        // Initialize quiz play state
        state.currentQuiz.id = quizId;
        state.currentQuiz.title = quizTitle;
        state.currentQuiz.questions = quizQuestions;
        state.currentQuiz.answers = {};
        state.currentQuiz.currentIndex = 0;
        state.currentQuiz.secondsElapsed = 0;

        // UI updates
        elements.playQuizTitle.innerText = quizTitle;
        elements.playQuizCategory.innerText = 'Quiz Taker';
        elements.totalQCount.innerText = quizQuestions.length;

        // Show view
        elements.quizPlayOverlay.classList.add('active');
        
        // Render first question
        renderPlayQuestion();
        
        // Start Timer
        startTimer();
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}

function renderPlayQuestion() {
    const quiz = state.currentQuiz;
    const qIndex = quiz.currentIndex;
    const currentQ = quiz.questions[qIndex];

    elements.currentQIndex.innerText = qIndex + 1;
    elements.playQuestionTitle.innerText = currentQ.questionTitle;

    // Progress Bar
    const progressPercent = ((qIndex) / quiz.questions.length) * 100;
    elements.progressBar.style.width = `${progressPercent}%`;

    // Render Options
    const optionsContainer = elements.playOptionsContainer;
    optionsContainer.innerHTML = '';

    const options = [
        { key: 'A', text: currentQ.option1 },
        { key: 'B', text: currentQ.option2 },
        { key: 'C', text: currentQ.option3 },
        { key: 'D', text: currentQ.option4 }
    ];

    options.forEach(opt => {
        if (!opt.text) return; // Skip empty option fields
        
        const isSelected = quiz.answers[currentQ.id] === opt.text;
        
        const btn = document.createElement('button');
        btn.className = `option-btn ${isSelected ? 'selected' : ''}`;
        btn.innerHTML = `
            <span class="option-letter">${opt.key}</span>
            <span class="option-val">${escapeHtml(opt.text)}</span>
        `;
        btn.addEventListener('click', () => handleOptionSelect(currentQ.id, opt.text));
        optionsContainer.appendChild(btn);
    });

    // Footer buttons state
    elements.btnQuizPrev.disabled = qIndex === 0;
    
    if (qIndex === quiz.questions.length - 1) {
        elements.btnQuizNext.innerHTML = 'Submit Quiz <i class="fa-solid fa-paper-plane"></i>';
        elements.btnQuizNext.className = 'btn btn-primary';
    } else {
        elements.btnQuizNext.innerHTML = 'Next <i class="fa-solid fa-arrow-right"></i>';
        elements.btnQuizNext.className = 'btn btn-secondary';
    }
}

function handleOptionSelect(questionId, optionText) {
    state.currentQuiz.answers[questionId] = optionText;
    renderPlayQuestion();
}

function handleQuizPrevQuestion() {
    if (state.currentQuiz.currentIndex > 0) {
        state.currentQuiz.currentIndex--;
        renderPlayQuestion();
    }
}

function handleQuizNextQuestion() {
    const quiz = state.currentQuiz;
    const isLast = quiz.currentIndex === quiz.questions.length - 1;

    // Optional Check: Warn user if option is not selected
    const currentQId = quiz.questions[quiz.currentIndex].id;
    if (!quiz.answers[currentQId]) {
        showToast('Please select an option to proceed.', 'warning');
        return;
    }

    if (!isLast) {
        quiz.currentIndex++;
        renderPlayQuestion();
    } else {
        submitQuizAnswers();
    }
}

async function submitQuizAnswers() {
    const quiz = state.currentQuiz;
    stopTimer();

    // Show submitting indicator
    elements.btnQuizNext.disabled = true;
    elements.btnQuizNext.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Grading...';

    // Format payload: List<Response>
    const payload = quiz.questions.map(q => ({
        id: q.id,
        response: quiz.answers[q.id] || ''
    }));

    try {
        const response = await fetch(ENDPOINTS.submitQuiz(quiz.id), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Error received from grading service.');
        
        const score = await response.json(); // score is an integer
        showQuizResults(score);
    } catch (err) {
        console.error(err);
        showToast(`Grading failed: ${err.message}`, 'error');
        elements.btnQuizNext.disabled = false;
        elements.btnQuizNext.innerHTML = 'Submit Quiz <i class="fa-solid fa-paper-plane"></i>';
    }
}

// -------------------------------------------------------------
// TIMER LOGIC
// -------------------------------------------------------------
function startTimer() {
    stopTimer();
    state.currentQuiz.secondsElapsed = 0;
    elements.quizTimerText.innerText = '00:00';
    
    state.currentQuiz.timerInterval = setInterval(() => {
        state.currentQuiz.secondsElapsed++;
        const mins = String(Math.floor(state.currentQuiz.secondsElapsed / 60)).padStart(2, '0');
        const secs = String(state.currentQuiz.secondsElapsed % 60).padStart(2, '0');
        elements.quizTimerText.innerText = `${mins}:${secs}`;
    }, 1000);
}

function stopTimer() {
    if (state.currentQuiz.timerInterval) {
        clearInterval(state.currentQuiz.timerInterval);
        state.currentQuiz.timerInterval = null;
    }
}

// -------------------------------------------------------------
// RESULTS LOGIC
// -------------------------------------------------------------
function showQuizResults(score) {
    const quiz = state.currentQuiz;
    const total = quiz.questions.length;
    const correct = score;
    const wrong = total - correct;
    const percentage = Math.round((correct / total) * 100);

    // Hide Play overlay, show Results overlay
    elements.quizPlayOverlay.classList.remove('active');
    elements.quizResultsOverlay.classList.add('active');

    elements.resultsQuizTitle.innerText = quiz.title;
    elements.resultsScoreValue.innerText = `${correct}/${total}`;
    elements.resultsScorePercent.innerText = `${percentage}%`;

    elements.resultsSummaryTotal.innerText = total;
    elements.resultsSummaryCorrect.innerText = correct;
    elements.resultsSummaryWrong.innerText = wrong;

    // Feedback message based on performance
    let feedback = '';
    if (percentage === 100) feedback = 'Perfect Score! You are a genius! 🌟';
    else if (percentage >= 80) feedback = 'Excellent job! Outstanding performance! 🎉';
    else if (percentage >= 50) feedback = 'Well done! You passed the quiz. Keep practicing! 👍';
    else feedback = 'Keep learning and try again! You can do this! 💪';
    elements.resultsFeedbackMessage.innerText = feedback;

    // SVG Circular Progress transition
    const circle = elements.resultsRingProgress;
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
    
    // Trigger paint before animating
    setTimeout(() => {
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }, 100);
}

function handleRetryQuiz() {
    elements.quizResultsOverlay.classList.remove('active');
    startQuizPlay(state.currentQuiz.id, state.currentQuiz.title);
}

// -------------------------------------------------------------
// TOAST NOTIFICATIONS
// -------------------------------------------------------------
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = {
        success: 'fa-circle-check',
        error: 'fa-triangle-exclamation',
        info: 'fa-circle-info',
        warning: 'fa-exclamation'
    }[type] || 'fa-bell';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    elements.toastContainer.appendChild(toast);

    // Fade out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.5s ease';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// -------------------------------------------------------------
// SECURITY UTILITIES (XSS PREVENTION)
// -------------------------------------------------------------
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, (m) => map[m]);
}

function escapeQuote(text) {
    if (!text) return '';
    return text.toString().replace(/'/g, "\\'");
}
