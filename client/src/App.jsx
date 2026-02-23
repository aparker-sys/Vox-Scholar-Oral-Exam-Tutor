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
  fetchChat,
  STORAGE_KEYS,
} from "./api/client";
import { QUESTIONS_BY_TOPIC } from "./data/questions.js";
import { formatTime, escapeHtml, shuffleArray, formatCountdown, getQuickStats } from "./utils";
import { VoiceTutor, useVoiceTutor, useVoiceOptions, useSpeechRecognition, useSessionAnswerRecognition, previewVoice } from "./components/VoiceTutor";

const ROUTES = ["home", "subjects", "performance", "weak", "settings", "folder", "library"];
const SESSION_ROUTES = ["think", "answer", "feedback", "complete"];

export default function App() {
  const [apiReady, setApiReady] = useState(false);
  const [backendOk, setBackendOk] = useState(true);
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
  const [answerTranscripts, setAnswerTranscripts] = useState([]);
  const [currentAnswerTranscript, setCurrentAnswerTranscript] = useState("");
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
  const [subjectRenames, setSubjectRenames] = useState({});
  const [renameSubjectKey, setRenameSubjectKey] = useState(null);
  const [renameSubjectInput, setRenameSubjectInput] = useState("");
  const [renameIsBuiltIn, setRenameIsBuiltIn] = useState(true);
  const [charlotteInput, setCharlotteInput] = useState("");
  const [charlotteHistory, setCharlotteHistory] = useState([]);
  const [charlotteLoading, setCharlotteLoading] = useState(false);
  const [charlotteError, setCharlotteError] = useState("");

  const thinkIntervalRef = useRef(null);
  const answerIntervalRef = useRef(null);
  const { speak, isSpeaking } = useVoiceTutor();
  const { voiceOptions } = useVoiceOptions();

  const sendToCharlotte = useCallback(
    async (msg) => {
      const text = typeof msg === "string" ? msg.trim() : "";
      if (!text || charlotteLoading) return;
      setCharlotteLoading(true);
      setCharlotteError("");
      try {
        const reply = await fetchChat(text, charlotteHistory);
        if (reply) {
          setCharlotteHistory((h) =>
            [...h, { role: "user", content: text }, { role: "assistant", content: reply }].slice(-20)
          );
          setCharlotteInput("");
          speak(reply);
        } else {
          setCharlotteError("Chat isn't configured. Add OPENAI_API_KEY on the server.");
        }
      } catch (err) {
        setCharlotteError(err.message || "Something went wrong.");
      } finally {
        setCharlotteLoading(false);
      }
    },
    [charlotteHistory, charlotteLoading, speak]
  );

  const {
    supported: voiceInputSupported,
    isListening,
    startListening: startVoiceInput,
  } = useSpeechRecognition(sendToCharlotte, (err) => setCharlotteError(err || "Voice input failed."));

  const appendToAnswerNotes = useCallback((transcript) => {
    setAnswerNotes((prev) => (prev ? prev + " " : "") + transcript);
  }, []);
  const {
    supported: dictateSupported,
    isListening: isDictating,
    startListening: startDictating,
  } = useSpeechRecognition(appendToAnswerNotes, () => {});

  const currentAnswerTranscriptRef = useRef("");
  const appendAnswerChunk = useCallback((chunk) => {
    setCurrentAnswerTranscript((prev) => {
      const next = prev ? prev + " " + chunk : chunk;
      currentAnswerTranscriptRef.current = next;
      return next;
    });
  }, []);
  const {
    supported: sessionAnswerRecognitionSupported,
    isListening: isSessionAnswerListening,
    start: startSessionAnswerListening,
    stop: stopSessionAnswerListening,
  } = useSessionAnswerRecognition(appendAnswerChunk, () => {});

  useEffect(() => {
    currentAnswerTranscriptRef.current = currentAnswerTranscript;
  }, [currentAnswerTranscript]);

  useEffect(() => {
    initBackend().then(({ backendOk: ok }) => {
      setBackendOk(ok ?? true);
      setApiReady(true);
    });
  }, []);

  useEffect(() => {
    if (!apiReady) return;
    setSubjectRenames(loadStorage(STORAGE_KEYS.subjectRenames, {}) || {});
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

  const lastSpokenQuestionRef = useRef(null);

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
      setAnswerTranscripts([]);
      setCurrentAnswerTranscript("");
      saveLastSession();
      setSessionRoute("think");
      lastSpokenQuestionRef.current = null;
    },
    [saveLastSession]
  );

  useEffect(() => {
    if (sessionRoute !== "think" || !currentQuestion || !questions.length) return;
    const key = `${currentIndex}-${currentQuestion.question}`;
    if (lastSpokenQuestionRef.current === key) return;
    lastSpokenQuestionRef.current = key;
    speak(currentQuestion.question);
  }, [sessionRoute, currentIndex, currentQuestion, questions.length, speak]);

  const onStartAnswer = useCallback(() => {
    setCurrentAnswerTranscript("");
    setSessionRoute("answer");
    setAnswerRemaining(Math.max(30, answerTime));
    startSessionAnswerListening();
  }, [answerTime, startSessionAnswerListening]);

  const saveCurrentTranscriptAndLeaveAnswer = useCallback(() => {
    stopSessionAnswerListening();
    const transcript = currentAnswerTranscriptRef.current;
    setAnswerTranscripts((prev) => {
      const next = [...prev];
      next[currentIndex] = transcript;
      return next;
    });
    setCurrentAnswerTranscript("");
    currentAnswerTranscriptRef.current = "";
  }, [currentIndex, stopSessionAnswerListening]);

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
    if (sessionRoute === "answer") saveCurrentTranscriptAndLeaveAnswer();
    setSessionRoute("feedback");
  }, [sessionRoute, saveCurrentTranscriptAndLeaveAnswer]);

  const nextOrComplete = useCallback(() => {
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    if (nextIndex >= questions.length) {
      clearLastSessionStorage();
      addSessionToHistory(topic, true);
      setSessionSummary(
        `You completed ${questions.length} question${questions.length === 1 ? "" : "s"} on "${subjectRenames[topic] || topic}". Great work.`
      );
      setSessionRoute("complete");
    } else {
      saveLastSession();
      lastSpokenQuestionRef.current = null;
      setSessionRoute("think");
    }
  }, [currentIndex, questions.length, topic, subjectRenames, saveLastSession, addSessionToHistory]);

  const endSession = useCallback(() => {
    if (thinkIntervalRef.current) clearInterval(thinkIntervalRef.current);
    if (answerIntervalRef.current) clearInterval(answerIntervalRef.current);
    thinkIntervalRef.current = null;
    answerIntervalRef.current = null;
    if (sessionRoute === "answer") saveCurrentTranscriptAndLeaveAnswer();
    clearLastSessionStorage();
    addSessionToHistory(topic || "Unknown", false);
    setSessionRoute(null);
    setTopic(null);
    setQuestions([]);
    setCurrentIndex(0);
    setRoute("home");
  }, [topic, sessionRoute, addSessionToHistory, saveCurrentTranscriptAndLeaveAnswer]);

  const backToHome = useCallback(() => {
    if (thinkIntervalRef.current) clearInterval(thinkIntervalRef.current);
    if (answerIntervalRef.current) clearInterval(answerIntervalRef.current);
    setSessionRoute(null);
    setTopic(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswerTranscripts([]);
    setCurrentAnswerTranscript("");
    setRoute("home");
  }, []);

  const practiceMore = useCallback(() => {
    setSessionRoute(null);
    setTopic(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswerTranscripts([]);
    setCurrentAnswerTranscript("");
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

  if (!apiReady) {
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
            <section className="home-tile voice-tutor-tile">
              <h2 className="tile-title">Charlotte — your voice tutor</h2>
              <div className="tile-body voice-tutor-tile-body">
                <VoiceTutor
                  isSpeaking={isSpeaking}
                  label="Charlotte, voice tutor"
                  idleMessage="Tap below to hear Charlotte say hello"
                  size="medium"
                />
                <div className="voice-tutor-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() =>
                      speak(
                        "Hi, I'm Charlotte, your voice tutor. I'm so excited to help you learn and get ready for your oral exams. Whenever you're ready, start a mock exam or pick a subject to practice—I'm here to read questions and key points aloud. Let's do this!"
                      )
                    }
                    disabled={isSpeaking}
                  >
                    {isSpeaking ? "Speaking…" : "Hear Charlotte’s welcome"}
                  </button>
                </div>
                <div className="charlotte-chat">
                  <p className="charlotte-chat-hint">Ask Charlotte anything—type or tap the mic to talk; she'll reply and can read it aloud.</p>
                  {voiceInputSupported && (
                    <div className="charlotte-voice-input">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm charlotte-mic-btn"
                        onClick={startVoiceInput}
                        disabled={charlotteLoading || isSpeaking || isListening}
                        title="Talk to Charlotte"
                        aria-label={isListening ? "Listening…" : "Talk to Charlotte"}
                      >
                        {isListening ? "Listening…" : "🎤 Talk to Charlotte"}
                      </button>
                    </div>
                  )}
                  <form
                    className="charlotte-chat-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendToCharlotte(charlotteInput);
                    }}
                  >
                    <input
                      type="text"
                      className="charlotte-chat-input"
                      placeholder="e.g. How do I stay calm in the exam?"
                      value={charlotteInput}
                      onChange={(e) => setCharlotteInput(e.target.value)}
                      disabled={charlotteLoading}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" disabled={charlotteLoading || !charlotteInput.trim()}>
                      {charlotteLoading ? "…" : "Ask Charlotte"}
                    </button>
                  </form>
                  {charlotteError && <p className="charlotte-chat-error">{charlotteError}</p>}
                </div>
              </div>
            </section>
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
                        <p className="continue-topic">{subjectRenames[lastSession.topic] || lastSession.topic}</p>
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
                            lastSpokenQuestionRef.current = null;
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
                              {escapeHtml(subjectRenames[w.topic] || w.topic)}: {escapeHtml(w.question.slice(0, 30))}
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
                  <span className="subject-name">{escapeHtml(subjectRenames[t] || t)}</span>
                  <div className="subject-card-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => selectTopic(t)}>
                      Practice
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => openFolder(t)}>
                      Class
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-rename"
                      onClick={() => {
                        setRenameSubjectKey(t);
                        setRenameSubjectInput(subjectRenames[t] ?? t);
                        setRenameIsBuiltIn(true);
                      }}
                      title="Rename subject"
                    >
                      Rename
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
            setLibrarySubjects={setLibrarySubjects}
            subjectRenames={subjectRenames}
            openFolder={openFolder}
            setLibraryPendingFiles={setLibraryPendingFiles}
            setLibraryAddFilesModalOpen={setLibraryAddFilesModalOpen}
            setLibraryNewNoteModalOpen={setLibraryNewNoteModalOpen}
            setNewFolderModalOpen={setNewFolderModalOpen}
            navigate={navigate}
            getUniqueSubjects={getUniqueSubjects}
            getAllBySubject={getAllBySubject}
            loadStorage={loadStorage}
            saveStorage={saveStorage}
            STORAGE_KEYS={STORAGE_KEYS}
            escapeHtml={escapeHtml}
            QUESTIONS_BY_TOPIC={QUESTIONS_BY_TOPIC}
            onRenameSubject={(subject) => {
              setRenameSubjectKey(subject);
              setRenameSubjectInput(QUESTIONS_BY_TOPIC[subject] ? (subjectRenames[subject] ?? subject) : subject);
              setRenameIsBuiltIn(!!QUESTIONS_BY_TOPIC[subject]);
            }}
          />
        )}

        {/* Folder */}
        {route === "folder" && !inSession && folderSubject && (
          <FolderScreen
            key={folderRefreshKey}
            folderSubject={folderSubject}
            subjectRenames={subjectRenames}
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
                        <strong>{escapeHtml(subjectRenames[t] || t)}</strong>
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
                        {escapeHtml(subjectRenames[w.topic] || w.topic)}: {escapeHtml(w.question.slice(0, 50))}
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
              <h3 className="settings-subtitle">Charlotte’s voice</h3>
              <p className="settings-note">Choose a voice that matches how you’d like Charlotte to sound. Names are labeled by the voice’s sex.</p>
              <label className="setting">
                <span>Voice</span>
                <select
                  value={loadStorage(STORAGE_KEYS.charlotteVoice, "") ?? ""}
                  onChange={(e) => saveStorage(STORAGE_KEYS.charlotteVoice, e.target.value || null)}
                >
                  <option value="">Default (recommended)</option>
                  {voiceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm settings-voice-try"
                onClick={() => previewVoice(loadStorage(STORAGE_KEYS.charlotteVoice, "") ?? "", voiceOptions)}
              >
                Try this voice
              </button>
            </div>
            <div className="settings-section">
              <h3 className="settings-subtitle">Session Defaults</h3>
              <p className="settings-note">Think and answer times are configured on the Subjects screen.</p>
            </div>
          </section>
        )}

        {/* Session: Charlotte asks question, then user clicks Start answering */}
        {sessionRoute === "think" && currentQuestion && (
          <section className="screen screen-think screen-session active">
            <p className="phase-label">Charlotte asks</p>
            <div className="session-voice-tutor">
              <VoiceTutor
                isSpeaking={isSpeaking}
                label="Charlotte"
                idleMessage="Listen for the question"
                size="small"
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => speak(currentQuestion.question)}
                disabled={isSpeaking}
              >
                {isSpeaking ? "Speaking…" : "Hear question again"}
              </button>
            </div>
            <p className="question-text">{currentQuestion.question}</p>
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

        {/* Session: Answer — Charlotte listens; transcript hidden until session complete */}
        {sessionRoute === "answer" && currentQuestion && (
          <section className="screen screen-answer screen-session active">
            <p className="phase-label">Answer</p>
            <p className="question-text">{currentQuestion.question}</p>
            <div className={`timer answer-timer ${answerRemaining <= 30 ? "warning" : ""}`}>
              <span className="timer-value">{formatTime(answerRemaining)}</span>
            </div>
            <div className="answer-listening-area">
              {sessionAnswerRecognitionSupported ? (
                <div className={`answer-listening-indicator ${isSessionAnswerListening ? "active" : ""}`}>
                  <span className="answer-listening-icon" aria-hidden>🎤</span>
                  <p className="answer-listening-text">
                    {isSessionAnswerListening
                      ? "Charlotte is listening… Your response will be shown after the session."
                      : "Listening will start when you press Start answering."}
                  </p>
                </div>
              ) : (
                <p className="answer-listening-fallback">Voice capture is not supported in this browser. Use a supported browser to have your answer recorded.</p>
              )}
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
            <div className="session-voice-tutor session-voice-tutor--compact">
              <VoiceTutor isSpeaking={isSpeaking} size="small" idleMessage="Hear key points" />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  speak(
                    "Key points to include: " +
                      currentQuestion.keyPoints.map((p, i) => `${i + 1}. ${p}`).join(". ")
                  )
                }
                disabled={isSpeaking}
              >
                {isSpeaking ? "Speaking…" : "Hear key points"}
              </button>
            </div>
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

        {/* Session: Complete — show summary and what you said for each question */}
        {sessionRoute === "complete" && (
          <section className="screen screen-complete screen-session active">
            <h2>Session complete</h2>
            <div className="session-voice-tutor session-voice-tutor--compact">
              <VoiceTutor isSpeaking={isSpeaking} size="small" idleMessage="Hear summary" />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => speak(sessionSummary)}
                disabled={isSpeaking}
              >
                {isSpeaking ? "Speaking…" : "Hear summary"}
              </button>
            </div>
            <p className="summary">{sessionSummary}</p>
            {questions.length > 0 && answerTranscripts.some(Boolean) && (
              <div className="complete-transcripts">
                <h3>What you said</h3>
                {questions.map((q, i) => (
                  <div key={i} className="complete-transcript-block">
                    <p className="complete-transcript-question">{i + 1}. {q.question}</p>
                    <p className="complete-transcript-answer">{answerTranscripts[i] || "—"}</p>
                  </div>
                ))}
              </div>
            )}
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

      {/* Rename subject/class modal (built-in = display name, custom = real rename) */}
      <RenameSubjectModal
        open={renameSubjectKey != null}
        topicKey={renameSubjectKey}
        displayName={renameSubjectInput}
        setDisplayName={setRenameSubjectInput}
        isBuiltIn={renameIsBuiltIn}
        onSave={async () => {
          const key = renameSubjectKey;
          const trimmed = (renameSubjectInput || "").trim();
          if (renameIsBuiltIn) {
            const next = { ...subjectRenames };
            if (trimmed && trimmed !== key) next[key] = trimmed;
            else delete next[key];
            setSubjectRenames(next);
            saveStorage(STORAGE_KEYS.subjectRenames, next);
            setRenameSubjectKey(null);
            return;
          }
          if (!trimmed) {
            window.alert("Please enter a name.");
            return;
          }
          if (trimmed === key) {
            setRenameSubjectKey(null);
            return;
          }
          const custom = loadStorage(STORAGE_KEYS.customSubjects, []) || [];
          if (!custom.includes(key)) {
            setRenameSubjectKey(null);
            return;
          }
          saveStorage(STORAGE_KEYS.customSubjects, custom.map((s) => (s === key ? trimmed : s)));
          const items = await getAllBySubject(key);
          for (const item of items) await updateItem(item.id, { subject: trimmed });
          setLibrarySubjects((prev) => prev.map((s) => (s === key ? trimmed : s)));
          setRenameSubjectKey(null);
        }}
        onClose={() => setRenameSubjectKey(null)}
        escapeHtml={escapeHtml}
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
  setLibrarySubjects,
  subjectRenames,
  openFolder,
  setLibraryPendingFiles,
  setLibraryAddFilesModalOpen,
  setLibraryNewNoteModalOpen,
  setNewFolderModalOpen,
  navigate,
  getUniqueSubjects,
  getAllBySubject,
  loadStorage,
  saveStorage,
  STORAGE_KEYS,
  escapeHtml,
  QUESTIONS_BY_TOPIC,
  onRenameSubject,
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
                  <span className="library-folder-name">{escapeHtml(subjectRenames[r.subject] || r.subject)}</span>
                  <span className="library-folder-meta">
                    {r.notes} note{r.notes !== 1 ? "s" : ""}, {r.files} file{r.files !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="library-folder-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-rename"
                    onClick={() => onRenameSubject(r.subject)}
                    title={QUESTIONS_BY_TOPIC[r.subject] ? "Rename display name" : "Rename class"}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => openFolder(r.subject, "library")}
                  >
                    Open
                  </button>
                </div>
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
  subjectRenames,
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
        <h2 className="screen-title">{subjectRenames[folderSubject] || folderSubject} — Notes &amp; files</h2>
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

function RenameSubjectModal({ open, topicKey, displayName, setDisplayName, isBuiltIn, onSave, onClose, escapeHtml }) {
  if (!open || !topicKey) return null;
  return (
    <div className="modal modal-sm" hidden={!open}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">{isBuiltIn ? "Rename subject" : "Rename class"}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="modal-hint">
            {isBuiltIn
              ? `Display name for "${escapeHtml(topicKey)}"`
              : `New name for "${escapeHtml(topicKey)}" (notes and files will move to the new name)`}
          </p>
          <label>
            <span>Name</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={topicKey}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onSave}>
            Save
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
