/* Oral Exam Tutor — App logic with navigation and state */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    lastSession: "oralExam_lastSession",
    sessionHistory: "oralExam_sessionHistory",
    weakAreas: "oralExam_weakAreas",
    examDate: "oralExam_examDate",
    focusToday: "oralExam_focusToday",
    customSubjects: "oralExam_customSubjects",
  };

  const ROUTES = ["home", "subjects", "performance", "weak", "settings", "folder", "library"];
  const SESSION_ROUTES = ["think", "answer", "feedback", "complete"];

  const screens = {
    home: document.getElementById("screenHome"),
    subjects: document.getElementById("screenSubjects"),
    folder: document.getElementById("screenFolder"),
    library: document.getElementById("screenLibrary"),
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
    homePerformanceEmpty: document.getElementById("homePerformanceEmpty"),
    homePerformancePreview: document.getElementById("homePerformancePreview"),
    homePerformanceStats: document.getElementById("homePerformanceStats"),
    homeWeakEmpty: document.getElementById("homeWeakEmpty"),
    homeWeakPreview: document.getElementById("homeWeakPreview"),
    homeWeakList: document.getElementById("homeWeakList"),
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
    statSessions: document.getElementById("statSessions"),
    statScore: document.getElementById("statScore"),
    statStreak: document.getElementById("statStreak"),
    statSubject: document.getElementById("statSubject"),
    focusTodayText: document.getElementById("focusTodayText"),
    focusTodayInput: document.getElementById("focusTodayInput"),
    focusTodayEdit: document.getElementById("focusTodayEdit"),
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
    folderSubject: null,
    folderSubfolderFilter: "",
    folderBackRoute: "subjects",
    editingNoteId: null,
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

  function getQuickStats() {
    const history = loadStorage(STORAGE_KEYS.sessionHistory, []);
    const sessionsCompleted = history.length;
    const byTopic = {};
    history.forEach((h) => {
      byTopic[h.topic] = (byTopic[h.topic] || 0) + 1;
    });
    const mostPracticed =
      Object.keys(byTopic).length === 0
        ? null
        : Object.entries(byTopic).sort((a, b) => b[1] - a[1])[0][0];
    const daySet = new Set(history.map((h) => (h.date || "").slice(0, 10)).filter(Boolean));
    const sortedDays = Array.from(daySet).sort().reverse();
    let currentStreak = 0;
    if (sortedDays.length > 0) {
      const mostRecent = sortedDays[0];
      for (let i = 0; i < 365; i++) {
        const d = new Date(mostRecent);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().slice(0, 10);
        if (daySet.has(dayStr)) currentStreak++;
        else break;
      }
    }
    return {
      sessionsCompleted,
      averageScore: null,
      currentStreak,
      mostPracticed,
    };
  }

  function renderQuickStats() {
    const stats = getQuickStats();
    elements.statSessions.textContent = String(stats.sessionsCompleted);
    elements.statScore.textContent = stats.averageScore != null ? `${Math.round(stats.averageScore)}%` : "—";
    elements.statStreak.textContent = String(stats.currentStreak);
    elements.statSubject.textContent = stats.mostPracticed || "—";
  }

  function getFocusToday() {
    const raw = loadStorage(STORAGE_KEYS.focusToday, null);
    if (!raw || typeof raw !== "object") return "";
    return raw.text || "";
  }

  function setFocusToday(text) {
    const trimmed = (text || "").trim();
    saveStorage(STORAGE_KEYS.focusToday, { date: new Date().toISOString().slice(0, 10), text: trimmed });
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
    renderQuickStats();
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
      case "folder":
        renderFolder();
        break;
      case "library":
        renderLibrary();
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

    const focusText = getFocusToday();
    if (elements.focusTodayText) {
      elements.focusTodayText.textContent = focusText || "Set your focus for today";
      elements.focusTodayText.classList.toggle("empty", !focusText);
    }
    if (elements.focusTodayEdit) elements.focusTodayEdit.hidden = true;
    if (elements.focusTodayInput) elements.focusTodayInput.value = focusText;

    const history = loadStorage(STORAGE_KEYS.sessionHistory, []);
    if (history.length > 0) {
      elements.homePerformanceEmpty.hidden = true;
      elements.homePerformancePreview.hidden = false;
      const byTopic = {};
      history.slice(0, 5).forEach((h) => {
        byTopic[h.topic] = (byTopic[h.topic] || 0) + 1;
      });
      elements.homePerformanceStats.innerHTML = Object.entries(byTopic)
        .map(
          ([t, n]) =>
            `<div class="performance-row"><strong>${escapeHtml(t)}</strong><span>${n}</span></div>`
        )
        .join("");
    } else {
      elements.homePerformanceEmpty.hidden = false;
      elements.homePerformancePreview.hidden = true;
    }

    const weak = getWeakAreas();
    if (weak.length > 0) {
      elements.homeWeakEmpty.hidden = true;
      elements.homeWeakPreview.hidden = false;
      elements.homeWeakList.innerHTML = weak
        .slice(0, 3)
        .map(
          (w) =>
            `<li>${escapeHtml(w.topic)}: ${escapeHtml(w.question.slice(0, 30))}${w.question.length > 30 ? "…" : ""}</li>`
        )
        .join("");
    } else {
      elements.homeWeakEmpty.hidden = false;
      elements.homeWeakPreview.hidden = true;
    }
  }

  function renderSubjects() {
    elements.subjectGrid.innerHTML = "";
    Object.keys(QUESTIONS_BY_TOPIC).forEach((topic) => {
      const card = document.createElement("div");
      card.className = "subject-card";
      card.innerHTML = `
        <span class="subject-name">${escapeHtml(topic)}</span>
        <div class="subject-card-actions">
          <button type="button" class="btn btn-primary btn-sm" data-action="practice" data-topic="${escapeHtml(topic)}">Practice</button>
          <button type="button" class="btn btn-secondary btn-sm" data-action="folder" data-topic="${escapeHtml(topic)}">Folder</button>
        </div>
      `;
      card.querySelector('[data-action="practice"]').addEventListener("click", () => selectTopic(topic));
      card.querySelector('[data-action="folder"]').addEventListener("click", () => openFolder(topic));
      elements.subjectGrid.appendChild(card);
    });
  }

  function openFolder(subject, backRoute) {
    state.folderSubject = subject;
    state.folderSubfolderFilter = "";
    state.folderBackRoute = backRoute || "subjects";
    navigate("folder");
  }

  async function renderFolder() {
    if (!state.folderSubject) return;
    const subject = state.folderSubject;
    document.getElementById("folderSubjectTitle").textContent = subject + " — Notes & files";

    const items = await getAllBySubject(subject);
    const subfolders = await getSubfolders(subject);
    const select = document.getElementById("folderSubfolder");
    select.innerHTML = '<option value="">All</option>' + subfolders.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
    select.value = state.folderSubfolderFilter;
    document.getElementById("subfolderDatalist").innerHTML = subfolders.map((s) => `<option value="${escapeHtml(s)}">`).join("");

    const filtered = state.folderSubfolderFilter
      ? items.filter((i) => (i.subfolder || "") === state.folderSubfolderFilter)
      : items;
    filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

    const emptyEl = document.getElementById("folderEmpty");
    const listEl = document.getElementById("folderItems");
    if (filtered.length === 0) {
      emptyEl.hidden = false;
      listEl.hidden = true;
    } else {
      emptyEl.hidden = true;
      listEl.hidden = false;
      listEl.innerHTML = filtered
        .map(
          (item) => `
        <li class="folder-item" data-id="${escapeHtml(item.id)}">
          <span class="folder-item-icon">${item.type === "note" ? "📝" : "📎"}</span>
          <div class="folder-item-info">
            <span class="folder-item-name">${escapeHtml(item.name)}</span>
            ${item.subfolder ? `<span class="folder-item-sub">${escapeHtml(item.subfolder)}</span>` : ""}
          </div>
          <div class="folder-item-actions">
            <button type="button" class="btn-icon" data-action="edit" title="Edit">✎</button>
            <button type="button" class="btn-icon" data-action="open" title="Open">→</button>
            <button type="button" class="btn-icon btn-icon-danger" data-action="delete" title="Delete">×</button>
          </div>
        </li>
      `
        )
        .join("");
      listEl.querySelectorAll(".folder-item").forEach((li) => {
        const id = li.dataset.id;
        li.querySelector('[data-action="edit"]').addEventListener("click", () => openNoteEditor(id));
        li.querySelector('[data-action="open"]').addEventListener("click", () => openItem(id));
        li.querySelector('[data-action="delete"]').addEventListener("click", () => deleteFolderItem(id));
      });
    }
  }

  async function renderLibrary() {
    const practiceSubjects = Object.keys(QUESTIONS_BY_TOPIC || {});
    const dbSubjects = await getUniqueSubjects();
    const custom = loadStorage(STORAGE_KEYS.customSubjects, []);
    const allSubjects = [...new Set([...practiceSubjects, ...dbSubjects, ...custom])].sort();

    const emptyEl = document.getElementById("libraryEmpty");
    const listEl = document.getElementById("libraryFolders");
    if (allSubjects.length === 0) {
      emptyEl.hidden = false;
      listEl.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    listEl.hidden = false;

    const rows = await Promise.all(
      allSubjects.map(async (subject) => {
        const items = await getAllBySubject(subject);
        const notes = items.filter((i) => i.type === "note").length;
        const files = items.filter((i) => i.type !== "note").length;
        return { subject, notes, files };
      })
    );

    listEl.innerHTML = rows
      .map(
        (r) => `
        <li class="library-folder-item">
          <div class="library-folder-info">
            <span class="library-folder-name">${escapeHtml(r.subject)}</span>
            <span class="library-folder-meta">${r.notes} note${r.notes !== 1 ? "s" : ""}, ${r.files} file${r.files !== 1 ? "s" : ""}</span>
          </div>
          <button type="button" class="btn btn-primary btn-sm" data-library-open="${escapeHtml(r.subject)}">Open</button>
        </li>
      `
      )
      .join("");

    listEl.querySelectorAll("[data-library-open]").forEach((btn) => {
      const subject = btn.getAttribute("data-library-open");
      btn.addEventListener("click", () => openFolder(subject, "library"));
    });
  }

  async function openItem(id) {
    const item = await getItem(id);
    if (!item) return;
    if (item.type === "note") {
      openNoteEditor(id);
    } else {
      const blob = item.content instanceof Blob ? item.content : new Blob([item.content], { type: item.mimeType || "application/octet-stream" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = item.name;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }

  function openNoteEditor(id) {
    state.editingNoteId = id || null;
    const modal = document.getElementById("noteModal");
    const titleEl = document.getElementById("noteTitle");
    const contentEl = document.getElementById("noteContent");
    const subfolderEl = document.getElementById("noteSubfolder");
    if (id) {
      getItem(id).then((item) => {
        titleEl.value = item.name;
        contentEl.value = item.content || "";
        subfolderEl.value = item.subfolder || "";
        modal.hidden = false;
        titleEl.focus();
      });
    } else {
      titleEl.value = "";
      contentEl.value = "";
      subfolderEl.value = state.folderSubfolderFilter || "";
      modal.hidden = false;
      titleEl.focus();
    }
  }

  function closeNoteEditor() {
    document.getElementById("noteModal").hidden = true;
    state.editingNoteId = null;
  }

  async function saveNote() {
    const title = document.getElementById("noteTitle").value.trim();
    const content = document.getElementById("noteContent").value;
    const subfolder = document.getElementById("noteSubfolder").value.trim();
    if (!title) return;
    if (state.editingNoteId) {
      await updateItem(state.editingNoteId, { name: title, content, subfolder });
    } else {
      await addItem({
        subject: state.folderSubject,
        name: title,
        type: "note",
        content,
        subfolder,
      });
    }
    closeNoteEditor();
    renderFolder();
  }

  async function deleteFolderItem(id) {
    if (!confirm("Delete this item?")) return;
    await deleteItem(id);
    if (state.editingNoteId === id) closeNoteEditor();
    renderFolder();
  }

  async function handleFileUpload(files) {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`"${file.name}" is too large (max 10 MB).`);
        continue;
      }
      const content = await readFileAsBlob(file);
      await addItem({
        subject: state.folderSubject,
        name: file.name,
        type: "file",
        content,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      });
    }
    document.getElementById("fileUpload").value = "";
    renderFolder();
  }

  function readFileAsBlob(file) {
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsArrayBuffer(file);
    });
  }

  async function createSubfolder() {
    const name = document.getElementById("newSubfolderName").value.trim();
    if (!name) return;
    await addItem({
      subject: state.folderSubject,
      name: "New note",
      type: "note",
      content: "",
      subfolder: name,
    });
    document.getElementById("subfolderModal").hidden = true;
    document.getElementById("newSubfolderName").value = "";
    renderFolder();
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
  document.getElementById("logoHome").addEventListener("click", () => navigate("home"));
  document.getElementById("btnSettings").addEventListener("click", () => navigate("settings"));
  document.getElementById("btnBackFromSubjects").addEventListener("click", () => navigate("home"));
  document.getElementById("btnBackFromFolder").addEventListener("click", () => navigate(state.folderBackRoute || "subjects"));

  document.getElementById("folderSubfolder").addEventListener("change", (e) => {
    state.folderSubfolderFilter = e.target.value;
    renderFolder();
  });
  document.getElementById("btnNewSubfolder").addEventListener("click", () => {
    document.getElementById("subfolderModal").hidden = false;
    document.getElementById("newSubfolderName").value = "";
    document.getElementById("newSubfolderName").focus();
  });
  document.getElementById("btnAddNote").addEventListener("click", () => openNoteEditor(null));
  document.getElementById("fileUpload").addEventListener("change", (e) => {
    if (e.target.files.length) handleFileUpload(Array.from(e.target.files));
  });
  document.getElementById("btnPracticeFromFolder").addEventListener("click", () => {
    if (state.folderSubject) selectTopic(state.folderSubject);
  });

  document.getElementById("btnCloseNote").addEventListener("click", closeNoteEditor);
  document.getElementById("noteModal").querySelector(".modal-backdrop").addEventListener("click", closeNoteEditor);
  document.getElementById("btnSaveNote").addEventListener("click", saveNote);
  document.getElementById("btnDeleteNote").addEventListener("click", () => {
    if (state.editingNoteId) deleteFolderItem(state.editingNoteId);
  });
  document.getElementById("btnCloseSubfolder").addEventListener("click", () => {
    document.getElementById("subfolderModal").hidden = true;
  });
  document.getElementById("subfolderModal").querySelector(".modal-backdrop").addEventListener("click", () => {
    document.getElementById("subfolderModal").hidden = true;
  });
  document.getElementById("btnCreateSubfolder").addEventListener("click", createSubfolder);
  document.getElementById("btnBackFromPerformance").addEventListener("click", () => navigate("home"));
  document.getElementById("btnBackFromWeak").addEventListener("click", () => navigate("home"));
  document.getElementById("btnBackFromSettings").addEventListener("click", () => navigate("home"));

  document.getElementById("btnStartMockExam").addEventListener("click", () => navigate("subjects"));
  document.getElementById("btnStartExamTile").addEventListener("click", () => navigate("subjects"));
  document.getElementById("btnOpenLibrary").addEventListener("click", () => navigate("library"));
  document.getElementById("btnBackFromLibrary").addEventListener("click", () => navigate("home"));
  document.getElementById("btnNavToPerformance").addEventListener("click", () => navigate("performance"));
  document.getElementById("btnNewFolder").addEventListener("click", () => {
    document.getElementById("newFolderName").value = "";
    document.getElementById("newFolderModal").hidden = false;
    document.getElementById("newFolderName").focus();
  });
  document.getElementById("btnCloseNewFolder").addEventListener("click", () => {
    document.getElementById("newFolderModal").hidden = true;
  });
  document.querySelector("#newFolderModal .modal-backdrop").addEventListener("click", () => {
    document.getElementById("newFolderModal").hidden = true;
  });
  document.getElementById("btnCreateNewFolder").addEventListener("click", () => {
    const input = document.getElementById("newFolderName");
    const name = (input.value || "").trim();
    if (!name) return;
    const custom = loadStorage(STORAGE_KEYS.customSubjects, []);
    if (!custom.includes(name)) {
      custom.push(name);
      saveStorage(STORAGE_KEYS.customSubjects, custom);
    }
    document.getElementById("newFolderModal").hidden = true;
    input.value = "";
    openFolder(name, "library");
  });
  document.getElementById("btnEditFocusToday").addEventListener("click", () => {
    elements.focusTodayEdit.hidden = false;
    document.getElementById("btnEditFocusToday").hidden = true;
    elements.focusTodayInput.value = getFocusToday();
    elements.focusTodayInput.focus();
  });
  document.getElementById("btnSaveFocusToday").addEventListener("click", () => {
    setFocusToday(elements.focusTodayInput.value);
    elements.focusTodayEdit.hidden = true;
    document.getElementById("btnEditFocusToday").hidden = false;
    renderHome();
  });
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
