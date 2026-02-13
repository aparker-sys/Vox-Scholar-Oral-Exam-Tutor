/* Oral Exam Tutor — App logic with navigation and state */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    lastSession: "oralExam_lastSession",
    sessionHistory: "oralExam_sessionHistory",
    weakAreas: "oralExam_weakAreas",
    examDate: "oralExam_examDate",
  };

  const ROUTES = ["home", "subjects", "performance", "weak", "settings"];
  const SESSION_ROUTES = ["think", "answer", "feedback", "complete"];

  const screens = {
    home: document.getElementById("screenHome"),
    subjects: document.getElementById("screenSubjects"),
    performance: document.getElementById("screenPerformance"),
    weak: document.getElementById("screenWeak"),
    settings: document.getElementById("screenSettings"),
    think: document.getElementById("screenThink"),
    answer: document.getElementById("screenAnswer"),
    feedback: document.getElementById("screenFeedback"),
    complete: document.getElementById("screenComplete"),
  };

  const elements = {
    subjectGrid: document.getElementById("subjectGrid"),
    thinkTime: document.getElementById("thinkTime"),
    answerTime: document.getElementById("answerTime"),
    thinkQuestion: document.getElementById("thinkQuestion"),
    answerQuestion: document.getElementById("answerQuestion"),
    feedbackQuestion: document.getElementById("feedbackQuestion"),
    thinkTimerValue: document.getElementById("thinkTimerValue"),
    answerTimer: document.getElementById("answerTimer"),
    answerTimerValue: document.getElementById("answerTimerValue"),
    answerNotes: document.getElementById("answerNotes"),
    keyPoints: document.getElementById("keyPoints"),
    sessionSummary: document.getElementById("sessionSummary"),
    progressFill: document.getElementById("progressFill"),
    questionCounter: document.getElementById("questionCounter"),
    continueEmpty: document.getElementById("continueEmpty"),
    continueContent: document.getElementById("continueContent"),
    continueTopic: document.getElementById("continueTopic"),
    continueProgress: document.getElementById("continueProgress"),
    performanceEmpty: document.getElementById("performanceEmpty"),
    performanceContentFull: document.getElementById("performanceContentFull"),
    performanceStats: document.getElementById("performanceStats"),
    weakEmpty: document.getElementById("weakEmpty"),
    weakList: document.getElementById("weakList"),
    countdownSet: document.getElementById("countdownSet"),
    countdownDisplay: document.getElementById("countdownDisplay"),
    countdownLabel: document.getElementById("countdownLabel"),
    countdownValue: document.getElementById("countdownValue"),
    examDate: document.getElementById("examDate"),
    progressBar: document.querySelector(".progress-bar"),
  };

  /* Centralized app state */
  const state = {
    route: "home",
    sessionRoute: null,
    navStack: ["home"],
    topic: null,
    questions: [],
    currentIndex: 0,
    questionOrder: [],
    thinkInterval: null,
    answerInterval: null,
    thinkRemaining: 0,
    answerRemaining: 0,
  };

  function loadStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function saveLastSession() {
    if (!state.topic || !state.questions.length) return;
    saveStorage(STORAGE_KEYS.lastSession, {
      topic: state.topic,
      currentIndex: state.currentIndex,
      questionOrder: state.questionOrder,
      timestamp: Date.now(),
    });
  }

  function clearLastSession() {
    localStorage.removeItem(STORAGE_KEYS.lastSession);
  }

  function loadLastSession() {
    return loadStorage(STORAGE_KEYS.lastSession, null);
  }

  function addSessionToHistory(topic, completed) {
    const history = loadStorage(STORAGE_KEYS.sessionHistory, []);
    history.unshift({ topic, completed, date: new Date().toISOString() });
    saveStorage(STORAGE_KEYS.sessionHistory, history.slice(0, 20));
  }

  function getWeakAreas() {
    return loadStorage(STORAGE_KEYS.weakAreas, []);
  }

  function addWeakArea(topic, question) {
    const areas = getWeakAreas();
    if (areas.some((a) => a.topic === topic && a.question === question)) return;
    areas.unshift({ topic, question });
    saveStorage(STORAGE_KEYS.weakAreas, areas.slice(0, 30));
  }

  function removeWeakArea(index) {
    const areas = getWeakAreas();
    areas.splice(index, 1);
    saveStorage(STORAGE_KEYS.weakAreas, areas);
    renderRoute(state.route);
  }

  function getExamDate() {
    return loadStorage(STORAGE_KEYS.examDate, null);
  }

  function setExamDate(iso) {
    saveStorage(STORAGE_KEYS.examDate, iso || null);
  }

  function formatCountdown(iso) {
    const exam = new Date(iso);
    const now = new Date();
    exam.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: "Exam date passed", value: `${Math.abs(diff)} days ago` };
    if (diff === 0) return { label: "Exam is today", value: "Good luck!" };
    if (diff === 1) return { label: "Exam tomorrow", value: "1 day" };
    return { label: "Days until exam", value: `${diff} days` };
  }

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  /* Navigation */
  function navigate(route) {
    if (!ROUTES.includes(route)) return;
    state.route = route;
    if (!state.navStack.includes(route)) state.navStack.push(route);
    state.navStack = state.navStack.slice(-10);
    updateUI();
  }

  function showSessionScreen(sessionRoute) {
    state.sessionRoute = sessionRoute;
    updateUI();
  }

  function exitSession() {
    state.sessionRoute = null;
    state.topic = null;
    state.questions = [];
    state.currentIndex = 0;
    stopThinkTimer();
    stopAnswerTimer();
    updateProgress();
    if (elements.questionCounter) elements.questionCounter.textContent = "";
    updateUI();
  }

  function updateUI() {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.route === state.route);
    });

    const inSession = state.sessionRoute && SESSION_ROUTES.includes(state.sessionRoute);
    if (elements.progressBar) {
      elements.progressBar.classList.toggle("hidden", !inSession);
    }

    ROUTES.forEach((r) => {
      const s = screens[r];
      if (s) s.classList.remove("active");
    });
    SESSION_ROUTES.forEach((r) => {
      const s = screens[r];
      if (s) s.classList.remove("active");
    });

    if (inSession) {
      const s = screens[state.sessionRoute];
      if (s) s.classList.add("active");
    } else {
      const s = screens[state.route];
      if (s) s.classList.add("active");
      renderRoute(state.route);
    }
  }

  function renderRoute(route) {
    switch (route) {
      case "home":
        renderHome();
        break;
      case "subjects":
        renderSubjects();
        break;
      case "performance":
        renderPerformance();
        break;
      case "weak":
        renderWeak();
        break;
      case "settings":
        renderSettings();
        break;
    }
  }

  function renderHome() {
    const last = loadLastSession();
    if (last && QUESTIONS_BY_TOPIC[last.topic]) {
      elements.continueEmpty.hidden = true;
      elements.continueContent.hidden = false;
      elements.continueTopic.textContent = last.topic;
      elements.continueProgress.textContent = `Question ${last.currentIndex + 1} of ${last.questionOrder.length}`;
    } else {
      elements.continueEmpty.hidden = false;
      elements.continueContent.hidden = true;
    }
  }

  function renderSubjects() {
    elements.subjectGrid.innerHTML = "";
    Object.keys(QUESTIONS_BY_TOPIC).forEach((topic) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "subject-btn";
      btn.textContent = topic;
      btn.addEventListener("click", () => selectTopic(topic));
      elements.subjectGrid.appendChild(btn);
    });
  }

  function renderPerformance() {
    const history = loadStorage(STORAGE_KEYS.sessionHistory, []);
    if (history.length > 0) {
      elements.performanceEmpty.hidden = true;
      elements.performanceContentFull.hidden = false;
      const byTopic = {};
      history.slice(0, 20).forEach((h) => {
        byTopic[h.topic] = (byTopic[h.topic] || 0) + 1;
      });
      elements.performanceStats.innerHTML = Object.entries(byTopic)
        .map(
          ([t, n]) =>
            `<div class="performance-row"><strong>${escapeHtml(t)}</strong><span>${n} session${n > 1 ? "s" : ""}</span></div>`
        )
        .join("");
    } else {
      elements.performanceEmpty.hidden = false;
      elements.performanceContentFull.hidden = true;
    }
  }

  function renderWeak() {
    const weak = getWeakAreas();
    if (weak.length > 0) {
      elements.weakEmpty.hidden = true;
      elements.weakList.hidden = false;
      elements.weakList.innerHTML = weak
        .map(
          (w, i) =>
            `<li><span>${escapeHtml(w.topic)}: ${escapeHtml(w.question.slice(0, 50))}${w.question.length > 50 ? "…" : ""}</span><span class="weak-actions"><button type="button" class="btn btn-primary btn-sm weak-practice" data-topic="${escapeHtml(w.topic)}">Practice</button><button type="button" class="weak-remove" data-index="${i}">×</button></span></li>`
        )
        .join("");
      elements.weakList.querySelectorAll(".weak-remove").forEach((btn) => {
        btn.addEventListener("click", () => removeWeakArea(parseInt(btn.dataset.index, 10)));
      });
      elements.weakList.querySelectorAll(".weak-practice").forEach((btn) => {
        btn.addEventListener("click", () => selectTopic(btn.dataset.topic));
      });
    } else {
      elements.weakEmpty.hidden = false;
      elements.weakList.hidden = true;
    }
  }

  function renderSettings() {
    const exam = getExamDate();
    if (exam) {
      elements.countdownSet.hidden = true;
      elements.countdownDisplay.hidden = false;
      const { label, value } = formatCountdown(exam);
      elements.countdownLabel.textContent = label;
      elements.countdownValue.textContent = value;
    } else {
      elements.countdownSet.hidden = false;
      elements.countdownDisplay.hidden = true;
    }
  }

  function updateProgress() {
    const total = state.questions.length;
    const done = state.currentIndex;
    const pct = total > 0 ? (done / total) * 100 : 0;
    if (elements.progressFill) elements.progressFill.style.width = `${pct}%`;
  }

  function updateCounter() {
    const total = state.questions.length;
    const current = state.currentIndex + 1;
    if (elements.questionCounter) {
      elements.questionCounter.textContent = total > 0 ? `Question ${current} of ${total}` : "";
    }
  }

  function startThinkTimer() {
    const secs = Math.max(5, parseInt(elements.thinkTime.value, 10) || 30);
    state.thinkRemaining = secs;
    elements.thinkTimerValue.textContent = formatTime(secs);
    if (state.thinkInterval) clearInterval(state.thinkInterval);
    state.thinkInterval = setInterval(() => {
      state.thinkRemaining--;
      elements.thinkTimerValue.textContent = formatTime(state.thinkRemaining);
      if (state.thinkRemaining <= 0) {
        clearInterval(state.thinkInterval);
        state.thinkInterval = null;
      }
    }, 1000);
  }

  function startAnswerTimer() {
    const secs = Math.max(30, parseInt(elements.answerTime.value, 10) || 120);
    state.answerRemaining = secs;
    elements.answerTimerValue.textContent = formatTime(secs);
    elements.answerTimer.classList.remove("warning");
    if (state.answerInterval) clearInterval(state.answerInterval);
    state.answerInterval = setInterval(() => {
      state.answerRemaining--;
      elements.answerTimerValue.textContent = formatTime(state.answerRemaining);
      if (state.answerRemaining <= 30) elements.answerTimer.classList.add("warning");
      if (state.answerRemaining <= 0) {
        clearInterval(state.answerInterval);
        state.answerInterval = null;
      }
    }, 1000);
  }

  function stopThinkTimer() {
    if (state.thinkInterval) {
      clearInterval(state.thinkInterval);
      state.thinkInterval = null;
    }
  }

  function stopAnswerTimer() {
    if (state.answerInterval) {
      clearInterval(state.answerInterval);
      state.answerInterval = null;
    }
  }

  function selectTopic(topic) {
    if (!QUESTIONS_BY_TOPIC[topic]) return;
    state.topic = topic;
    const raw = [...QUESTIONS_BY_TOPIC[topic]];
    state.questions = shuffleArray(raw.map((q, i) => ({ ...q, _idx: i })));
    state.questionOrder = state.questions.map((q) => q._idx);
    state.currentIndex = 0;
    elements.answerNotes.value = "";
    saveLastSession();
    updateProgress();
    updateCounter();
    showSessionScreen("think");
    const q = state.questions[0];
    elements.thinkQuestion.textContent = q.question;
    startThinkTimer();
  }

  function continueLastSession() {
    const last = loadLastSession();
    if (!last || !QUESTIONS_BY_TOPIC[last.topic]) return;
    state.topic = last.topic;
    const raw = QUESTIONS_BY_TOPIC[last.topic];
    state.questions = last.questionOrder.map((i) => ({ ...raw[i], _idx: i }));
    state.questionOrder = last.questionOrder;
    state.currentIndex = last.currentIndex;
    elements.answerNotes.value = "";
    updateProgress();
    updateCounter();
    showSessionScreen("think");
    const q = state.questions[state.currentIndex];
    elements.thinkQuestion.textContent = q.question;
    startThinkTimer();
  }

  function onStartAnswer() {
    stopThinkTimer();
    const q = state.questions[state.currentIndex];
    elements.answerQuestion.textContent = q.question;
    elements.answerNotes.value = "";
    showSessionScreen("answer");
    startAnswerTimer();
  }

  function onNextQuestion() {
    stopAnswerTimer();
    saveLastSession();
    const q = state.questions[state.currentIndex];
    elements.feedbackQuestion.textContent = q.question;
    elements.keyPoints.innerHTML = q.keyPoints.map((p) => `<li>${escapeHtml(p)}</li>`).join("");
    showSessionScreen("feedback");
  }

  function nextOrComplete() {
    state.currentIndex++;
    saveLastSession();
    updateProgress();
    if (state.currentIndex >= state.questions.length) {
      clearLastSession();
      addSessionToHistory(state.topic, true);
      const total = state.questions.length;
      elements.sessionSummary.textContent = `You completed ${total} question${total === 1 ? "" : "s"} on "${state.topic}". Great work.`;
      elements.questionCounter.textContent = "";
      showSessionScreen("complete");
    } else {
      updateCounter();
      showSessionScreen("think");
      const q = state.questions[state.currentIndex];
      elements.thinkQuestion.textContent = q.question;
      startThinkTimer();
    }
  }

  function endSession() {
    stopThinkTimer();
    stopAnswerTimer();
    clearLastSession();
    addSessionToHistory(state.topic || "Unknown", false);
    exitSession();
    navigate("home");
  }

  function backToHome() {
    exitSession();
    navigate("home");
  }

  function practiceMore() {
    exitSession();
    navigate("subjects");
  }

  /* Wire all buttons */
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => navigate(btn.dataset.route));
  });

  document.getElementById("btnNavToSubjects").addEventListener("click", () => navigate("subjects"));
  document.getElementById("btnNavToPerformance").addEventListener("click", () => navigate("performance"));
  document.getElementById("btnNavToWeak").addEventListener("click", () => navigate("weak"));

  document.getElementById("btnContinueSession").addEventListener("click", continueLastSession);
  document.getElementById("btnStartAnswer").addEventListener("click", onStartAnswer);
  document.getElementById("btnNextQuestion").addEventListener("click", onNextQuestion);
  document.getElementById("btnFlagWeak").addEventListener("click", () => {
    const q = state.questions[state.currentIndex];
    addWeakArea(state.topic, q.question);
    renderRoute(state.route);
  });
  document.getElementById("btnContinueAfterFeedback").addEventListener("click", nextOrComplete);
  document.getElementById("btnEndSessionThink").addEventListener("click", endSession);
  document.getElementById("btnEndSessionAnswer").addEventListener("click", endSession);
  document.getElementById("btnEndSessionFeedback").addEventListener("click", endSession);
  document.getElementById("btnBackToHome").addEventListener("click", backToHome);
  document.getElementById("btnPracticeMore").addEventListener("click", practiceMore);

  document.getElementById("btnSetExam").addEventListener("click", () => {
    const v = elements.examDate.value;
    if (v) setExamDate(v);
    renderSettings();
  });
  document.getElementById("btnClearExam").addEventListener("click", () => {
    setExamDate(null);
    elements.examDate.value = "";
    renderSettings();
  });

  /* Init */
  renderSubjects();
  updateUI();
})();
