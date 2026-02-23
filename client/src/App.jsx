import { useState, useEffect, useRef, useCallback } from "react";
import {
  initBackend,
  loadStorage,
  saveStorage,
  clearLastSessionStorage,
  getAllBySubject,
  getUniqueSubjects,
  getItem,
  addItem,
  updateItem,
  deleteItem,
  getSubfolders,
  STORAGE_KEYS,
  login,
  signup,
  putOnboarding,
  clearToken,
} from "./api/client";
import { QUESTIONS_BY_TOPIC } from "./data/questions.js";
import { formatTime, escapeHtml, shuffleArray, formatCountdown, getQuickStats } from "./utils";

const ROUTES = ["home", "subjects", "performance", "weak", "settings", "folder", "library"];
const SESSION_ROUTES = ["think", "answer", "feedback", "complete"];

export default function App() {
  const [apiReady, setApiReady] = useState(false);
  const [user, setUser] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [backendOk, setBackendOk] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");
  const [route, setRoute] = useState("home");
  const [sessionRoute, setSessionRoute] = useState(null);
  const [thinkTime, setThinkTime] = useState(30);
  const [answerTime, setAnswerTime] = useState(120);
  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionOrder, setQuestionOrder] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [folderSubject, setFolderSubject] = useState(null);
  const [folderSubfolderFilter, setFolderSubfolderFilter] = useState("");
  const [folderBackRoute, setFolderBackRoute] = useState("subjects");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [librarySubjects, setLibrarySubjects] = useState([]);
  const [libraryPendingFiles, setLibraryPendingFiles] = useState(null);
  const [thinkRemaining, setThinkRemaining] = useState(0);
  const [answerRemaining, setAnswerRemaining] = useState(0);
  const [answerNotes, setAnswerNotes] = useState("");
  const [sessionSummary, setSessionSummary] = useState("");
  const [focusTodayEdit, setFocusTodayEdit] = useState(false);
  const [focusTodayInputVal, setFocusTodayInputVal] = useState("");
  const [examDateInput, setExamDateInput] = useState("");

  const [noteModal, setNoteModal] = useState({ open: false, title: "", content: "", subfolder: "" });
  const [subfolderModalOpen, setSubfolderModalOpen] = useState(false);
  const [newSubfolderName, setNewSubfolderName] = useState("");
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [libraryAddFilesModalOpen, setLibraryAddFilesModalOpen] = useState(false);
  const [libraryAddFilesFolder, setLibraryAddFilesFolder] = useState("");
  const [libraryNewNoteModalOpen, setLibraryNewNoteModalOpen] = useState(false);
  const [libraryNewNote, setLibraryNewNote] = useState({ folder: "", title: "", content: "" });
  const [folderRefreshKey, setFolderRefreshKey] = useState(0);

  const thinkIntervalRef = useRef(null);
  const answerIntervalRef = useRef(null);

  useEffect(() => {
    initBackend().then(({ user: u, needsOnboarding: ob, backendOk: ok }) => {
      setUser(u);
      setNeedsOnboarding(ob);
      setBackendOk(ok ?? true);
      setApiReady(true);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!apiReady) return;
    const practiceSubjects = Object.keys(QUESTIONS_BY_TOPIC || {});
    getUniqueSubjects().then((dbSubjects) => {
      const custom = loadStorage(STORAGE_KEYS.customSubjects, []) || [];
      setLibrarySubjects([...new Set([...practiceSubjects, ...dbSubjects, ...custom])].sort());
    });
  }, [apiReady, route]);

  const navigate = useCallback((r) => {
    if (!ROUTES.includes(r)) return;
    setRoute(r);
  }, []);

  const saveLastSession = useCallback(() => {
    if (!topic || !questions.length) return;
    saveStorage(STORAGE_KEYS.lastSession, {
      topic,
      currentIndex,
      questionOrder,
      timestamp: Date.now(),
    });
  }, [topic, questions.length, currentIndex, questionOrder]);

  const addSessionToHistory = useCallback((t, completed) => {
    const history = loadStorage(STORAGE_KEYS.sessionHistory, []) || [];
    const next = [{ topic: t, completed, date: new Date().toISOString() }, ...history].slice(0, 20);
    saveStorage(STORAGE_KEYS.sessionHistory, next);
  }, []);

  const getFocusToday = useCallback(() => {
    const raw = loadStorage(STORAGE_KEYS.focusToday, null);
    if (!raw || typeof raw !== "object") return "";
    return raw.text || "";
  }, []);

  const setFocusToday = useCallback((text) => {
    const trimmed = (text || "").trim();
    saveStorage(STORAGE_KEYS.focusToday, {
      date: new Date().toISOString().slice(0, 10),
      text: trimmed,
    });
  }, []);

  const getWeakAreas = useCallback(
    () => loadStorage(STORAGE_KEYS.weakAreas, []) || [],
    []
  );

  const addWeakArea = useCallback((t, question) => {
    const areas = getWeakAreas();
    if (areas.some((a) => a.topic === t && a.question === question)) return;
    saveStorage(STORAGE_KEYS.weakAreas, [{ topic: t, question }, ...areas].slice(0, 30));
  }, [getWeakAreas]);

  const removeWeakArea = useCallback((index) => {
    const areas = getWeakAreas();
    areas.splice(index, 1);
    saveStorage(STORAGE_KEYS.weakAreas, areas);
  }, [getWeakAreas]);

  const getExamDate = useCallback(
    () => loadStorage(STORAGE_KEYS.examDate, null),
    []
  );

  const setExamDate = useCallback((iso) => {
    saveStorage(STORAGE_KEYS.examDate, iso || null);
  }, []);

  const stats = apiReady ? getQuickStats(loadStorage, STORAGE_KEYS) : { sessionsCompleted: 0, averageScore: null, currentStreak: 0, mostPracticed: null };
  const lastSession = apiReady ? loadStorage(STORAGE_KEYS.lastSession, null) : null;
  const sessionHistory = apiReady ? (loadStorage(STORAGE_KEYS.sessionHistory, []) || []) : [];
  const weakAreas = apiReady ? getWeakAreas() : [];
  const examDate = apiReady ? getExamDate() : null;

  const inSession = sessionRoute && SESSION_ROUTES.includes(sessionRoute);
  const progressPct = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  const openFolder = useCallback((subject, backRoute = "subjects") => {
    setFolderSubject(subject);
    setFolderSubfolderFilter("");
    setFolderBackRoute(backRoute || "subjects");
    setRoute("folder");
  }, []);

  const selectTopic = useCallback(
    (t) => {
      if (!QUESTIONS_BY_TOPIC[t]) return;
      const raw = [...QUESTIONS_BY_TOPIC[t]];
      const shuffled = shuffleArray(raw.map((q, i) => ({ ...q, _idx: i })));
      setTopic(t);
      setQuestions(shuffled);
      setQuestionOrder(shuffled.map((q) => q._idx));
      setCurrentIndex(0);
      setAnswerNotes("");
      saveLastSession();
      setSessionRoute("think");
      setThinkRemaining(Math.max(5, thinkTime));
    },
    [thinkTime, saveLastSession]
  );

  useEffect(() => {
    if (sessionRoute !== "think" || !questions.length) return;
    const secs = Math.max(5, thinkTime);
    setThinkRemaining(secs);
    if (thinkIntervalRef.current) clearInterval(thinkIntervalRef.current);
    thinkIntervalRef.current = setInterval(() => {
      setThinkRemaining((prev) => {
        if (prev <= 1) {
          if (thinkIntervalRef.current) clearInterval(thinkIntervalRef.current);
          thinkIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (thinkIntervalRef.current) clearInterval(thinkIntervalRef.current);
    };
  }, [sessionRoute, currentIndex, thinkTime]);

  const onStartAnswer = useCallback(() => {
    if (thinkIntervalRef.current) {
      clearInterval(thinkIntervalRef.current);
      thinkIntervalRef.current = null;
    }
    setSessionRoute("answer");
    setAnswerNotes("");
    setAnswerRemaining(Math.max(30, answerTime));
  }, [answerTime]);

  useEffect(() => {
    if (sessionRoute !== "answer") return;
    const secs = Math.max(30, answerTime);
    setAnswerRemaining(secs);
    if (answerIntervalRef.current) clearInterval(answerIntervalRef.current);
    answerIntervalRef.current = setInterval(() => {
      setAnswerRemaining((prev) => {
        if (prev <= 1) {
          if (answerIntervalRef.current) clearInterval(answerIntervalRef.current);
          answerIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (answerIntervalRef.current) clearInterval(answerIntervalRef.current);
    };
  }, [sessionRoute, currentIndex, answerTime]);

  const onNextQuestion = useCallback(() => {
    if (answerIntervalRef.current) {
      clearInterval(answerIntervalRef.current);
      answerIntervalRef.current = null;
    }
    setSessionRoute("feedback");
  }, []);

  const nextOrComplete = useCallback(() => {
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    if (nextIndex >= questions.length) {
      clearLastSessionStorage();
      addSessionToHistory(topic, true);
      setSessionSummary(
        `You completed ${questions.length} question${questions.length === 1 ? "" : "s"} on "${topic}". Great work.`
      );
      setSessionRoute("complete");
    } else {
      saveLastSession();
      setSessionRoute("think");
      setThinkRemaining(Math.max(5, thinkTime));
    }
  }, [currentIndex, questions.length, topic, thinkTime, saveLastSession, addSessionToHistory]);

  const endSession = useCallback(() => {
    if (thinkIntervalRef.current) clearInterval(thinkIntervalRef.current);
    if (answerIntervalRef.current) clearInterval(answerIntervalRef.current);
    thinkIntervalRef.current = null;
    answerIntervalRef.current = null;
    clearLastSessionStorage();
    addSessionToHistory(topic || "Unknown", false);
    setSessionRoute(null);
    setTopic(null);
    setQuestions([]);
    setCurrentIndex(0);
    setRoute("home");
  }, [topic, addSessionToHistory]);

  const backToHome = useCallback(() => {
    if (thinkIntervalRef.current) clearInterval(thinkIntervalRef.current);
    if (answerIntervalRef.current) clearInterval(answerIntervalRef.current);
    setSessionRoute(null);
    setTopic(null);
    setQuestions([]);
    setCurrentIndex(0);
    setRoute("home");
  }, []);

  const practiceMore = useCallback(() => {
    setSessionRoute(null);
    setTopic(null);
    setQuestions([]);
    setCurrentIndex(0);
    setRoute("subjects");
  }, []);

  const openNoteEditor = useCallback(
    async (id) => {
      setEditingNoteId(id);
      if (id) {
        const item = await getItem(id);
        setNoteModal({
          open: true,
          title: item?.name || "",
          content: item?.content ?? "",
          subfolder: item?.subfolder || "",
        });
      } else {
        setNoteModal({
          open: true,
          title: "",
          content: "",
          subfolder: folderSubfolderFilter || "",
        });
      }
    },
    [folderSubfolderFilter]
  );

  const closeNoteEditor = useCallback(() => {
    setNoteModal((m) => ({ ...m, open: false }));
    setEditingNoteId(null);
  }, []);

  const saveNote = useCallback(async () => {
    const title = noteModal.title.trim();
    const content = noteModal.content;
    const subfolder = noteModal.subfolder.trim();
    if (!title) return;
    if (editingNoteId) {
      await updateItem(editingNoteId, { name: title, content, subfolder });
    } else {
      await addItem({
        subject: folderSubject,
        name: title,
        type: "note",
        content,
        subfolder,
      });
    }
    closeNoteEditor();
    setFolderRefreshKey((k) => k + 1);
  }, [noteModal, editingNoteId, folderSubject, closeNoteEditor]);

  const deleteFolderItem = useCallback(
    async (id) => {
      if (!window.confirm("Delete this item?")) return;
      await deleteItem(id);
      if (editingNoteId === id) closeNoteEditor();
      setRoute((r) => r);
    },
    [editingNoteId, closeNoteEditor]
  );

  const currentQuestion = questions[currentIndex];

  if (!authChecked || !apiReady) {
    return (
      <div className="app" style={{ justifyContent: "center", alignItems: "center" }}>
        <p>Loading…</p>
      </div>
    );
  }

  if (!backendOk) {
    return (
      <div className="app screen-auth">
        <div className="auth-card">
          <h1 className="logo" style={{ marginBottom: "1rem" }}>Vox Scholar</h1>
          <p className="auth-message">Server unavailable. Check your connection and try again.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        error={authError}
        setError={setAuthError}
        onSuccess={(u) => {
          setUser(u);
          setNeedsOnboarding(!u.onboardingComplete);
          setAuthError("");
        }}
      />
    );
  }

  if (needsOnboarding) {
    return (
      <OnboardingScreen
        user={user}
        onComplete={() => {
          setNeedsOnboarding(false);
          setUser((prev) => (prev ? { ...prev, onboardingComplete: true } : prev));
        }}
        addItem={addItem}
        getUniqueSubjects={getUniqueSubjects}
        loadStorage={loadStorage}
        saveStorage={saveStorage}
        STORAGE_KEYS={STORAGE_KEYS}
      />
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1 className="logo" onClick={() => navigate("home")}>
            Vox Scholar
          </h1>
          <p className="tagline">Practice like the real thing</p>
        </div>
        <button type="button" className="btn-settings" onClick={() => navigate("settings")} title="Settings">
          ⚙
        </button>
        <div className={`progress-bar ${inSession ? "" : "hidden"}`} aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      <main className="main">
        {/* Home */}
        {route === "home" && !inSession && (
          <section className="screen screen-home active">
            <div className="home-cta">
              <button
                type="button"
                className="btn-cta-primary"
                onClick={() => navigate("subjects")}
              >
                <span className="cta-label">🎤 Start Mock Exam</span>
                <span className="cta-sublabel">15-minute timed oral simulation</span>
              </button>
            </div>
            <div className="stats-bar">
              <div className="stat-item">
                <span className="stat-value">{stats.sessionsCompleted}</span>
                <span className="stat-label">Sessions completed</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.averageScore != null ? `${Math.round(stats.averageScore)}%` : "—"}</span>
                <span className="stat-label">Average score</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.currentStreak}</span>
                <span className="stat-label">Current streak</span>
              </div>
              <div className="stat-item">
                <span className="stat-value stat-subject">{stats.mostPracticed || "—"}</span>
                <span className="stat-label">Most practiced</span>
              </div>
            </div>
            <div className="home-two-col">
              <div className="home-left">
                <section className="home-tile home-continue">
                  <h2 className="tile-title">Continue Last Session</h2>
                  <div className="tile-body">
                    {lastSession && QUESTIONS_BY_TOPIC[lastSession.topic] ? (
                      <div className="continue-content">
                        <p className="continue-topic">{lastSession.topic}</p>
                        <p className="continue-progress">
                          Question {lastSession.currentIndex + 1} of {lastSession.questionOrder.length}
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            const last = lastSession;
                            const raw = QUESTIONS_BY_TOPIC[last.topic];
                            setTopic(last.topic);
                            setQuestions(
                              last.questionOrder.map((i) => ({ ...raw[i], _idx: i }))
                            );
                            setQuestionOrder(last.questionOrder);
                            setCurrentIndex(last.currentIndex);
                            setSessionRoute("think");
                            setThinkRemaining(Math.max(5, thinkTime));
                          }}
                        >
                          Continue
                        </button>
                      </div>
                    ) : (
                      <p className="continue-empty">No session in progress</p>
                    )}
                  </div>
                </section>
                <section className="home-tile home-start-exam">
                  <h2 className="tile-title">Start Exam</h2>
                  <div className="tile-body">
                    <p className="start-exam-desc">Pick a subject and run a timed practice session.</p>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate("subjects")}>
                      Start exam
                    </button>
                  </div>
                </section>
                <section className="home-tile focus-today-panel">
                  <h2 className="tile-title">Focus Today</h2>
                  <div className="tile-body focus-today-body">
                    {!focusTodayEdit ? (
                      <>
                        <p className={`focus-today-text ${!getFocusToday() ? "empty" : ""}`}>
                          {getFocusToday() || "Set your focus for today"}
                        </p>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm focus-today-btn"
                          onClick={() => {
                            setFocusTodayEdit(true);
                            setFocusTodayInputVal(getFocusToday());
                          }}
                        >
                          Edit focus
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="focus-today-edit">
                          <input
                            type="text"
                            className="focus-today-input"
                            value={focusTodayInputVal}
                            onChange={(e) => setFocusTodayInputVal(e.target.value)}
                            placeholder="e.g. Cardiorespiratory system"
                            maxLength={120}
                          />
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setFocusToday(focusTodayInputVal);
                              setFocusTodayEdit(false);
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </section>
                <section
                  className="home-tile home-library"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate("library")}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), navigate("library"))}
                >
                  <h2 className="tile-title">Library</h2>
                  <div className="tile-body">
                    <p className="library-desc">Add files from your computer, create notes, and organize by class.</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => (e.stopPropagation(), navigate("library"))}
                    >
                      Open library
                    </button>
                  </div>
                </section>
              </div>
              <div className="home-right">
                <section className="home-tile home-performance">
                  <h2 className="tile-title">Recent Performance</h2>
                  <div className="tile-body">
                    {sessionHistory.length === 0 ? (
                      <p className="performance-empty">Complete a session to see stats</p>
                    ) : (
                      <div className="performance-preview">
                        <div className="performance-stats">
                          {Object.entries(
                            sessionHistory.slice(0, 5).reduce((acc, h) => {
                              acc[h.topic] = (acc[h.topic] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([t, n]) => (
                            <div key={t} className="performance-row">
                              <strong>{escapeHtml(t)}</strong>
                              <span>{n}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <button type="button" className="btn btn-secondary btn-sm tile-more" onClick={() => navigate("performance")}>
                      View details
                    </button>
                  </div>
                </section>
                <section className="home-tile home-weak">
                  <h2 className="tile-title">Weak Areas</h2>
                  <div className="tile-body">
                    {weakAreas.length === 0 ? (
                      <p className="weak-empty">Flag questions during practice</p>
                    ) : (
                      <div className="weak-preview">
                        <ul>
                          {weakAreas.slice(0, 3).map((w, i) => (
                            <li key={i}>
                              {escapeHtml(w.topic)}: {escapeHtml(w.question.slice(0, 30))}
                              {w.question.length > 30 ? "…" : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button type="button" className="btn btn-secondary btn-sm tile-more" onClick={() => navigate("weak")}>
                      View all
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </section>
        )}

        {/* Subjects */}
        {route === "subjects" && !inSession && (
          <section className="screen screen-subjects active">
            <div className="screen-header">
              <button type="button" className="btn-back" onClick={() => navigate("home")}>
                ← Home
              </button>
              <h2 className="screen-title">Subjects</h2>
            </div>
            <div className="session-settings">
              <label className="setting">
                <span>Think time (sec)</span>
                <input
                  type="number"
                  value={thinkTime}
                  onChange={(e) => setThinkTime(Number(e.target.value) || 30)}
                  min={5}
                  max={120}
                  step={5}
                />
              </label>
              <label className="setting">
                <span>Answer time (sec)</span>
                <input
                  type="number"
                  value={answerTime}
                  onChange={(e) => setAnswerTime(Number(e.target.value) || 120)}
                  min={30}
                  max={600}
                  step={30}
                />
              </label>
            </div>
            <div className="subject-grid">
              {Object.keys(QUESTIONS_BY_TOPIC).map((t) => (
                <div key={t} className="subject-card">
                  <span className="subject-name">{escapeHtml(t)}</span>
                  <div className="subject-card-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => selectTopic(t)}>
                      Practice
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => openFolder(t)}>
                      Class
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Library */}
        {route === "library" && !inSession && (
          <LibraryScreen
            librarySubjects={librarySubjects}
            openFolder={openFolder}
            setLibraryPendingFiles={setLibraryPendingFiles}
            setLibraryAddFilesModalOpen={setLibraryAddFilesModalOpen}
            setLibraryNewNoteModalOpen={setLibraryNewNoteModalOpen}
            setNewFolderModalOpen={setNewFolderModalOpen}
            navigate={navigate}
            getUniqueSubjects={getUniqueSubjects}
            getAllBySubject={getAllBySubject}
            loadStorage={loadStorage}
            STORAGE_KEYS={STORAGE_KEYS}
            escapeHtml={escapeHtml}
          />
        )}

        {/* Folder */}
        {route === "folder" && !inSession && folderSubject && (
          <FolderScreen
            key={folderRefreshKey}
            folderSubject={folderSubject}
            folderSubfolderFilter={folderSubfolderFilter}
            setFolderSubfolderFilter={setFolderSubfolderFilter}
            folderBackRoute={folderBackRoute}
            navigate={navigate}
            openNoteEditor={openNoteEditor}
            openFolder={openFolder}
            selectTopic={selectTopic}
            getAllBySubject={getAllBySubject}
            getSubfolders={getSubfolders}
            getItem={getItem}
            addItem={addItem}
            updateItem={updateItem}
            deleteItem={deleteItem}
            setSubfolderModalOpen={setSubfolderModalOpen}
            setNewSubfolderName={setNewSubfolderName}
            escapeHtml={escapeHtml}
            setRoute={setRoute}
          />
        )}

        {/* Performance */}
        {route === "performance" && !inSession && (
          <section className="screen screen-performance active">
            <div className="screen-header">
              <button type="button" className="btn-back" onClick={() => navigate("home")}>
                ← Home
              </button>
              <h2 className="screen-title">Recent Performance</h2>
            </div>
            <div className="performance-card-full">
              {sessionHistory.length === 0 ? (
                <p className="performance-empty">Complete a session to see your stats</p>
              ) : (
                <div className="performance-content-full">
                  <div className="performance-stats">
                    {Object.entries(
                      sessionHistory.slice(0, 20).reduce((acc, h) => {
                        acc[h.topic] = (acc[h.topic] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([t, n]) => (
                      <div key={t} className="performance-row">
                        <strong>{escapeHtml(t)}</strong>
                        <span>{n} session{n > 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Weak */}
        {route === "weak" && !inSession && (
          <section className="screen screen-weak active">
            <div className="screen-header">
              <button type="button" className="btn-back" onClick={() => navigate("home")}>
                ← Home
              </button>
              <h2 className="screen-title">Saved Weak Areas</h2>
            </div>
            <div className="weak-card-full">
              {weakAreas.length === 0 ? (
                <p className="weak-empty">Flag questions during practice to build this list</p>
              ) : (
                <ul className="weak-list">
                  {weakAreas.map((w, i) => (
                    <li key={i}>
                      <span>
                        {escapeHtml(w.topic)}: {escapeHtml(w.question.slice(0, 50))}
                        {w.question.length > 50 ? "…" : ""}
                      </span>
                      <span className="weak-actions">
                        <button type="button" className="btn btn-primary btn-sm weak-practice" onClick={() => selectTopic(w.topic)}>
                          Practice
                        </button>
                        <button type="button" className="weak-remove" onClick={() => removeWeakArea(i)}>
                          ×
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* Settings */}
        {route === "settings" && !inSession && (
          <section className="screen screen-settings active">
            <div className="screen-header">
              <button type="button" className="btn-back" onClick={() => navigate("home")}>
                ← Home
              </button>
              <h2 className="screen-title">Settings</h2>
            </div>
            <div className="settings-section">
              <h3 className="settings-subtitle">Upcoming Exam</h3>
              <div className="countdown-card">
                {examDate ? (
                  <div className="countdown-display">
                    <p className="countdown-label">{formatCountdown(examDate).label}</p>
                    <p className="countdown-value">{formatCountdown(examDate).value}</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => (setExamDate(null), setExamDateInput(""))}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="countdown-set">
                    <label htmlFor="examDate">Exam date</label>
                    <input
                      id="examDate"
                      type="date"
                      value={examDateInput}
                      onChange={(e) => setExamDateInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => (examDateInput && setExamDate(examDateInput))}
                    >
                      Set
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="settings-section">
              <h3 className="settings-subtitle">Session Defaults</h3>
              <p className="settings-note">Think and answer times are configured on the Subjects screen.</p>
            </div>
            {user && (
              <div className="settings-section">
                <h3 className="settings-subtitle">Account</h3>
                <p className="settings-note">{user.email}</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    clearToken();
                    setUser(null);
                    setNeedsOnboarding(false);
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </section>
        )}

        {/* Session: Think */}
        {sessionRoute === "think" && currentQuestion && (
          <section className="screen screen-think screen-session active">
            <p className="phase-label">Think</p>
            <p className="question-text">{currentQuestion.question}</p>
            <div className="timer think-timer">
              <span className="timer-value">{formatTime(thinkRemaining)}</span>
            </div>
            <div className="session-actions">
              <button type="button" className="btn btn-primary" onClick={onStartAnswer}>
                Start answering
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={endSession}>
                End session
              </button>
            </div>
          </section>
        )}

        {/* Session: Answer */}
        {sessionRoute === "answer" && currentQuestion && (
          <section className="screen screen-answer screen-session active">
            <p className="phase-label">Answer</p>
            <p className="question-text">{currentQuestion.question}</p>
            <div className={`timer answer-timer ${answerRemaining <= 30 ? "warning" : ""}`}>
              <span className="timer-value">{formatTime(answerRemaining)}</span>
            </div>
            <div className="answer-notes">
              <label htmlFor="answerNotes">Your notes / outline (optional)</label>
              <textarea
                id="answerNotes"
                rows={4}
                placeholder="Jot key points as you speak…"
                value={answerNotes}
                onChange={(e) => setAnswerNotes(e.target.value)}
              />
            </div>
            <div className="session-actions">
              <button type="button" className="btn btn-secondary" onClick={onNextQuestion}>
                Next question
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={endSession}>
                End session
              </button>
            </div>
          </section>
        )}

        {/* Session: Feedback */}
        {sessionRoute === "feedback" && currentQuestion && (
          <section className="screen screen-feedback screen-session active">
            <p className="phase-label">Key points to include</p>
            <p className="question-text">{currentQuestion.question}</p>
            <ul className="key-points">
              {currentQuestion.keyPoints.map((p, i) => (
                <li key={i}>{escapeHtml(p)}</li>
              ))}
            </ul>
            <div className="feedback-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => addWeakArea(topic, currentQuestion.question)}
              >
                Flag as weak area
              </button>
              <button type="button" className="btn btn-primary" onClick={nextOrComplete}>
                Continue
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={endSession}>
                End session
              </button>
            </div>
          </section>
        )}

        {/* Session: Complete */}
        {sessionRoute === "complete" && (
          <section className="screen screen-complete screen-session active">
            <h2>Session complete</h2>
            <p className="summary">{sessionSummary}</p>
            <div className="complete-actions">
              <button type="button" className="btn btn-primary" onClick={backToHome}>
                Back to home
              </button>
              <button type="button" className="btn btn-secondary" onClick={practiceMore}>
                Practice another subject
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        {questions.length > 0 && inSession && sessionRoute !== "complete" && (
          <span>Question {currentIndex + 1} of {questions.length}</span>
        )}
      </footer>

      {/* Note modal */}
      <div className="modal" hidden={!noteModal.open}>
        <div className="modal-backdrop" onClick={closeNoteEditor} />
        <div className="modal-content">
          <div className="modal-header">
            <input
              type="text"
              className="modal-title-input"
              placeholder="Note title"
              value={noteModal.title}
              onChange={(e) => setNoteModal((m) => ({ ...m, title: e.target.value }))}
            />
            <button type="button" className="modal-close" onClick={closeNoteEditor}>×</button>
          </div>
          <textarea
            className="modal-body"
            rows={12}
            placeholder="Write your note…"
            value={noteModal.content}
            onChange={(e) => setNoteModal((m) => ({ ...m, content: e.target.value }))}
          />
          <div className="modal-footer">
            <label className="setting">
              <span>Subfolder</span>
              <input
                type="text"
                placeholder="e.g. Lecture notes"
                value={noteModal.subfolder}
                onChange={(e) => setNoteModal((m) => ({ ...m, subfolder: e.target.value }))}
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => editingNoteId && deleteFolderItem(editingNoteId)}>
                Delete
              </button>
              <button type="button" className="btn btn-primary" onClick={saveNote}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subfolder modal - rendered inside FolderScreen or here with state */}
      <SubfolderModal
        open={subfolderModalOpen}
        onClose={() => setSubfolderModalOpen(false)}
        newSubfolderName={newSubfolderName}
        setNewSubfolderName={setNewSubfolderName}
        folderSubject={folderSubject}
        addItem={addItem}
        onCreated={() => setFolderRefreshKey((k) => k + 1)}
      />

      {/* New folder modal */}
      <NewFolderModal
        open={newFolderModalOpen}
        onClose={() => setNewFolderModalOpen(false)}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        loadStorage={loadStorage}
        saveStorage={saveStorage}
        STORAGE_KEYS={STORAGE_KEYS}
        openFolder={openFolder}
      />

      {/* Library add files modal */}
      <LibraryAddFilesModal
        open={libraryAddFilesModalOpen}
        onClose={() => (setLibraryAddFilesModalOpen(false), setLibraryPendingFiles(null))}
        pendingFiles={libraryPendingFiles}
        librarySubjects={librarySubjects}
        libraryAddFilesFolder={libraryAddFilesFolder}
        setLibraryAddFilesFolder={setLibraryAddFilesFolder}
        onConfirm={async () => {
          if (!libraryAddFilesFolder?.trim() || !libraryPendingFiles?.length) return;
          for (const file of libraryPendingFiles) {
            if (file.size > 10 * 1024 * 1024) {
              window.alert(`"${file.name}" is too large (max 10 MB).`);
              continue;
            }
            const content = await readFileAsArrayBuffer(file);
            await addItem({
              subject: libraryAddFilesFolder.trim(),
              name: file.name,
              type: "file",
              content,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
            });
          }
          setLibraryPendingFiles(null);
          setLibraryAddFilesModalOpen(false);
          setRoute((r) => r);
        }}
      />

      {/* Library new note modal */}
      <LibraryNewNoteModal
        open={libraryNewNoteModalOpen}
        onClose={() => setLibraryNewNoteModalOpen(false)}
        libraryNewNote={libraryNewNote}
        setLibraryNewNote={setLibraryNewNote}
        librarySubjects={librarySubjects}
        onSave={async () => {
          const folder = libraryNewNote.folder?.trim();
          const title = libraryNewNote.title?.trim();
          if (!folder || !title) {
            window.alert("Please choose a folder and enter a title.");
            return;
          }
          await addItem({
            subject: folder,
            name: title,
            type: "note",
            content: libraryNewNote.content || "",
            subfolder: "",
          });
          setLibraryNewNoteModalOpen(false);
          setLibraryNewNote({ folder: "", title: "", content: "" });
          setRoute((r) => r);
        }}
      />
    </div>
  );
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(file);
  });
}

function LibraryScreen({
  librarySubjects,
  openFolder,
  setLibraryPendingFiles,
  setLibraryAddFilesModalOpen,
  setLibraryNewNoteModalOpen,
  setNewFolderModalOpen,
  navigate,
  getUniqueSubjects,
  getAllBySubject,
  loadStorage,
  STORAGE_KEYS,
  escapeHtml,
}) {
  const [folderRows, setFolderRows] = useState([]);

  useEffect(() => {
    if (librarySubjects.length === 0) {
      setFolderRows([]);
      return;
    }
    Promise.all(
      librarySubjects.map(async (subject) => {
        const items = await getAllBySubject(subject);
        const notes = items.filter((i) => i.type === "note").length;
        const files = items.filter((i) => i.type !== "note").length;
        return { subject, notes, files };
      })
    ).then(setFolderRows);
  }, [librarySubjects, getAllBySubject]);

  return (
    <section className="screen screen-library active">
      <div className="screen-header">
        <button type="button" className="btn-back" onClick={() => navigate("home")}>
          ← Home
        </button>
        <h2 className="screen-title">Library</h2>
      </div>
      <div className="library-actions">
        <label className="btn btn-primary btn-sm library-upload-label">
          Add files from computer
          <input
            type="file"
            multiple
            hidden
            onChange={(e) => {
              const files = e.target.files;
              if (!files?.length) return;
              if (librarySubjects.length === 0) {
                window.alert("Create a class first (use + New class), then add files.");
                e.target.value = "";
                return;
              }
              setLibraryPendingFiles(Array.from(files));
              setLibraryAddFilesModalOpen(true);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            if (librarySubjects.length === 0) {
              window.alert("Create a class first (use + New class), then add notes.");
              return;
            }
            setLibraryNewNoteModalOpen(true);
          }}
        >
          + New note
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setNewFolderModalOpen(true)}>
          + New class
        </button>
      </div>
      <div className="library-list">
        {folderRows.length === 0 ? (
          <p className="library-empty">No classes yet. Create a class to add notes and PDFs.</p>
        ) : (
          <ul className="library-folders">
            {folderRows.map((r) => (
              <li key={r.subject} className="library-folder-item">
                <div className="library-folder-info">
                  <span className="library-folder-name">{escapeHtml(r.subject)}</span>
                  <span className="library-folder-meta">
                    {r.notes} note{r.notes !== 1 ? "s" : ""}, {r.files} file{r.files !== 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => openFolder(r.subject, "library")}
                >
                  Open
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function FolderScreen({
  folderSubject,
  folderSubfolderFilter,
  setFolderSubfolderFilter,
  folderBackRoute,
  navigate,
  openNoteEditor,
  openFolder,
  selectTopic,
  getAllBySubject,
  getSubfolders,
  getItem,
  addItem,
  updateItem,
  deleteItem,
  setSubfolderModalOpen,
  setNewSubfolderName,
  escapeHtml,
  setRoute,
}) {
  const [items, setItems] = useState([]);
  const [subfolders, setSubfolders] = useState([]);

  useEffect(() => {
    if (!folderSubject) return;
    getSubfolders(folderSubject).then(setSubfolders);
    getAllBySubject(folderSubject).then((list) => setItems(list));
  }, [folderSubject, folderSubfolderFilter, getAllBySubject, getSubfolders]);

  const filtered = folderSubfolderFilter
    ? items.filter((i) => (i.subfolder || "") === folderSubfolderFilter)
    : items;
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
  );

  const openItem = async (id) => {
    const item = await getItem(id);
    if (!item) return;
    if (item.type === "note") {
      openNoteEditor(id);
    } else {
      const blob = item.content instanceof Blob
        ? item.content
        : new Blob([item.content], { type: item.mimeType || "application/octet-stream" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = item.name;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  const handleFileUpload = async (files) => {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        window.alert(`"${file.name}" is too large (max 10 MB).`);
        continue;
      }
      const content = await readFileAsArrayBuffer(file);
      await addItem({
        subject: folderSubject,
        name: file.name,
        type: "file",
        content,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      });
    }
    getAllBySubject(folderSubject).then(setItems);
  };

  return (
    <section className="screen screen-folder active">
      <div className="screen-header">
        <button type="button" className="btn-back" onClick={() => navigate(folderBackRoute)}>
          ← Back
        </button>
        <h2 className="screen-title">{folderSubject} — Notes &amp; files</h2>
      </div>
      <div className="folder-toolbar">
        <div className="folder-filter">
          <label htmlFor="folderSubfolder">Subfolder</label>
          <select
            id="folderSubfolder"
            value={folderSubfolderFilter}
            onChange={(e) => setFolderSubfolderFilter(e.target.value)}
          >
            <option value="">All</option>
            {subfolders.map((s) => (
              <option key={s} value={s}>{escapeHtml(s)}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => (setNewSubfolderName(""), setSubfolderModalOpen(true))}
        >
          + New subfolder
        </button>
      </div>
      <div className="folder-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => openNoteEditor(null)}>
          + Add note
        </button>
        <label className="btn btn-secondary btn-sm folder-upload">
          + Upload file
          <input
            type="file"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) handleFileUpload(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <div className="folder-list">
        {sorted.length === 0 ? (
          <p className="folder-empty">No notes or files yet. Add a note or upload a file.</p>
        ) : (
          <ul className="folder-items">
            {sorted.map((item) => (
              <li key={item.id} className="folder-item">
                <span className="folder-item-icon">{item.type === "note" ? "📝" : "📎"}</span>
                <div className="folder-item-info">
                  <span className="folder-item-name">{escapeHtml(item.name)}</span>
                  {item.subfolder && (
                    <span className="folder-item-sub">{escapeHtml(item.subfolder)}</span>
                  )}
                </div>
                <div className="folder-item-actions">
                  <button type="button" className="btn-icon" title="Edit" onClick={() => openNoteEditor(item.id)}>✎</button>
                  <button type="button" className="btn-icon" title="Open" onClick={() => openItem(item.id)}>→</button>
                  <button
                    type="button"
                    className="btn-icon btn-icon-danger"
                    title="Delete"
                    onClick={() =>
                      window.confirm("Delete this item?") && deleteItem(item.id).then(() => getAllBySubject(folderSubject).then(setItems))
                    }
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="folder-practice">
        <button type="button" className="btn btn-primary" onClick={() => selectTopic(folderSubject)}>
          Practice this subject
        </button>
      </div>
    </section>
  );
}

function SubfolderModal({ open, onClose, newSubfolderName, setNewSubfolderName, folderSubject, addItem, onCreated }) {
  const handleCreate = async () => {
    const name = newSubfolderName.trim();
    if (!name) return;
    await addItem({
      subject: folderSubject,
      name: "New note",
      type: "note",
      content: "",
      subfolder: name,
    });
    setNewSubfolderName("");
    onClose();
    onCreated?.();
  };
  return (
    <div className="modal modal-sm" hidden={!open}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">New subfolder</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <label>
            <span>Name</span>
            <input
              type="text"
              value={newSubfolderName}
              onChange={(e) => setNewSubfolderName(e.target.value)}
              placeholder="e.g. Lecture notes, Flashcards"
            />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={handleCreate}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function NewFolderModal({ open, onClose, newFolderName, setNewFolderName, loadStorage, saveStorage, STORAGE_KEYS, openFolder }) {
  const handleCreate = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const custom = loadStorage(STORAGE_KEYS.customSubjects, []) || [];
    if (!custom.includes(name)) {
      saveStorage(STORAGE_KEYS.customSubjects, [...custom, name]);
    }
    setNewFolderName("");
    onClose();
    openFolder(name, "library");
  };
  return (
    <div className="modal modal-sm" hidden={!open}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">New class</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <label>
            <span>Class name</span>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Cardiorespiratory, Pharmacology"
            />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={handleCreate}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function LibraryAddFilesModal({
  open,
  onClose,
  pendingFiles,
  librarySubjects,
  libraryAddFilesFolder,
  setLibraryAddFilesFolder,
  onConfirm,
}) {
  return (
    <div className="modal modal-sm" hidden={!open}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Add files to class</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="library-add-files-count">
            {pendingFiles?.length ?? 0} file{(pendingFiles?.length ?? 0) !== 1 ? "s" : ""} selected. Choose a class to add them to.
          </p>
          <label>
            <span>Class</span>
            <select
              value={libraryAddFilesFolder}
              onChange={(e) => setLibraryAddFilesFolder(e.target.value)}
            >
              <option value="">— Choose a class —</option>
              {librarySubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            Add here
          </button>
        </div>
      </div>
    </div>
  );
}

function LibraryNewNoteModal({
  open,
  onClose,
  libraryNewNote,
  setLibraryNewNote,
  librarySubjects,
  onSave,
}) {
  return (
    <div className="modal" hidden={!open}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">New note</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <label>
            <span>Class</span>
            <select
              value={libraryNewNote.folder}
              onChange={(e) => setLibraryNewNote((n) => ({ ...n, folder: e.target.value }))}
            >
              <option value="">— Choose a class —</option>
              {librarySubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Title</span>
            <input
              type="text"
              value={libraryNewNote.title}
              onChange={(e) => setLibraryNewNote((n) => ({ ...n, title: e.target.value }))}
              placeholder="Note title"
            />
          </label>
          <label>
            <span>Content</span>
            <textarea
              rows={8}
              value={libraryNewNote.content}
              onChange={(e) => setLibraryNewNote((n) => ({ ...n, content: e.target.value }))}
              placeholder="Write your note…"
            />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onSave}>
            Save note
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthScreen({ mode, setMode, error, setError, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const u = await login(email, password);
        onSuccess(u);
      } else {
        const u = await signup(email, password, name);
        onSuccess(u);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app screen-auth">
      <div className="auth-card">
        <h1 className="logo" style={{ marginBottom: "0.5rem" }}>Vox Scholar</h1>
        <p className="tagline" style={{ marginBottom: "1.5rem" }}>Practice like the real thing</p>
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => (setMode("login"), setError(""))}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === "signup" ? "auth-tab active" : "auth-tab"}
            onClick={() => (setMode("signup"), setError(""))}
          >
            Sign up
          </button>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <label className="auth-label">
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
          )}
          <label className="auth-label">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>
          <label className="auth-label">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : ""}
              required
              minLength={mode === "signup" ? 6 : undefined}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: "0.5rem" }}>
            {loading ? "…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

function OnboardingScreen({ user, onComplete, addItem, getUniqueSubjects, loadStorage, saveStorage, STORAGE_KEYS }) {
  const [name, setName] = useState(user?.name || "");
  const [classInput, setClassInput] = useState("");
  const [classes, setClasses] = useState([]);
  const [importClass, setImportClass] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadClasses = useCallback(() => {
    getUniqueSubjects().then((subjects) => {
      const custom = loadStorage(STORAGE_KEYS.customSubjects, []) || [];
      setClasses([...new Set([...subjects, ...custom])].sort());
    });
  }, [getUniqueSubjects, loadStorage, STORAGE_KEYS.customSubjects]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleCreateClass = () => {
    const trimmed = classInput.trim();
    if (!trimmed) return;
    const custom = loadStorage(STORAGE_KEYS.customSubjects, []) || [];
    if (!custom.includes(trimmed)) {
      saveStorage(STORAGE_KEYS.customSubjects, [...custom, trimmed]);
    }
    setClassInput("");
    loadClasses();
    setImportClass(trimmed);
  };

  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsArrayBuffer(file);
    });
  };

  const handleImportFiles = async () => {
    const targetClass = importClass || classes[0];
    if (!targetClass || !pendingFiles.length) return;
    setSaving(true);
    try {
      for (const file of pendingFiles) {
        if (file.size > 10 * 1024 * 1024) continue;
        const content = await readFileAsArrayBuffer(file);
        await addItem({
          subject: targetClass,
          name: file.name,
          type: "file",
          content,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
        });
      }
      setPendingFiles([]);
      loadClasses();
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      await putOnboarding({ name: name.trim() || undefined, onboardingComplete: true });
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app screen-onboarding">
      <div className="onboarding-card">
        <h1 className="logo" style={{ marginBottom: "0.25rem" }}>Get to know you</h1>
        <p className="tagline" style={{ marginBottom: "1.25rem" }}>Set up your library so you can practice smarter.</p>

        <section className="onboarding-section">
          <h3 className="settings-subtitle">Your name</h3>
          <input
            type="text"
            className="auth-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
          />
        </section>

        <section className="onboarding-section">
          <h3 className="settings-subtitle">Create a class</h3>
          <p className="settings-note">Classes hold your notes and files in the Library.</p>
          <div className="onboarding-row">
            <input
              type="text"
              className="auth-input"
              value={classInput}
              onChange={(e) => setClassInput(e.target.value)}
              placeholder="e.g. Cardiorespiratory, Pharmacology"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateClass())}
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateClass}>
              Create class
            </button>
          </div>
          {classes.length > 0 && (
            <p className="settings-note" style={{ marginTop: "0.5rem" }}>
              Your classes: {classes.join(", ")}
            </p>
          )}
        </section>

        <section className="onboarding-section">
          <h3 className="settings-subtitle">Import files</h3>
          <p className="settings-note">Add PDFs or other files to a class. You can add more later in the Library.</p>
          <div className="onboarding-row">
            <label className="btn btn-secondary btn-sm" style={{ margin: 0 }}>
              Choose files
              <input
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  const files = e.target.files;
                  if (files?.length) setPendingFiles((prev) => [...prev, ...Array.from(files)]);
                  e.target.value = "";
                }}
              />
            </label>
            {classes.length > 0 && (
              <select
                value={importClass}
                onChange={(e) => setImportClass(e.target.value)}
                className="auth-input"
                style={{ width: "auto", minWidth: "140px" }}
              >
                <option value="">— Choose class —</option>
                {classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
          {pendingFiles.length > 0 && (
            <p className="settings-note" style={{ marginTop: "0.5rem" }}>
              {pendingFiles.length} file(s) selected. {classes.length > 0 ? "Choose a class above and click Add files." : "Create a class first."}
            </p>
          )}
          {pendingFiles.length > 0 && classes.length > 0 && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleImportFiles} disabled={saving} style={{ marginTop: "0.5rem" }}>
              {saving ? "Adding…" : "Add files"}
            </button>
          )}
        </section>

        <div className="onboarding-actions">
          <button type="button" className="btn btn-primary" onClick={handleContinue} disabled={saving}>
            {saving ? "…" : "Continue to Vox Scholar"}
          </button>
        </div>
      </div>
    </div>
  );
}
