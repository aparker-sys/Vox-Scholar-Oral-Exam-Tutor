const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/VoiceTutor-1cuvo1Tq.js","assets/index-DnCVQQRO.js","assets/voice-D-4X00XL.js","assets/api-CXkl7B-R.js","assets/index-DQHligi8.css"])))=>i.map(i=>d[i]);
import { _ as __vitePreload, j as jsxRuntimeExports } from "./index-DnCVQQRO.js";
import { a as reactExports, u as useVoiceTutor, b as useVoiceOptions, c as useSpeechRecognition, d as useSessionAnswerRecognition, p as previewVoice } from "./voice-D-4X00XL.js";
import { a as fetchChat, i as initBackend, l as loadStorage, g as getUniqueSubjects, s as saveStorage, S as STORAGE_KEYS, b as getAllBySubject, c as getItem, d as fetchGenerateQuestions, e as clearLastSessionStorage, u as updateItem, h as addItem, j as deleteItem, k as getSubfolders } from "./api-CXkl7B-R.js";
const QUESTIONS_BY_TOPIC = {
  "Thesis defense": [
    {
      question: "What is the central contribution of your thesis, and how does it differ from prior work?",
      keyPoints: [
        "State the main claim or finding in one sentence",
        "Briefly contrast with 2–3 key prior approaches",
        "Explain what makes your contribution novel"
      ]
    },
    {
      question: "How would you defend the validity of your methodology?",
      keyPoints: [
        "Justify why this method was appropriate for the research question",
        "Discuss limitations and how you mitigated them",
        "Mention triangulation or validation if applicable"
      ]
    },
    {
      question: "What are the main limitations of your work?",
      keyPoints: [
        "Acknowledge 2–3 genuine limitations",
        "Explain the impact on conclusions",
        "Suggest future work that could address them"
      ]
    }
  ],
  "Clinical case": [
    {
      question: "A 45-year-old presents with acute chest pain. Walk through your differential and initial approach.",
      keyPoints: [
        "Rule out life-threatening causes first (ACS, PE, aortic dissection)",
        "Take focused history: onset, radiation, associated symptoms",
        "Order appropriate initial workup (ECG, troponin, CXR)"
      ]
    },
    {
      question: "A child presents with fever and rash. How do you approach the diagnosis?",
      keyPoints: [
        "Assess severity and need for urgent intervention",
        "Characterize the rash (macular, papular, distribution, timing)",
        "Consider infectious vs non-infectious causes"
      ]
    }
  ],
  "Interview prep": [
    {
      question: "Tell me about a time you faced a significant setback. How did you respond?",
      keyPoints: [
        "Use the STAR method (Situation, Task, Action, Result)",
        "Focus on what you learned, not blame",
        "End with a positive outcome or growth"
      ]
    },
    {
      question: "Why do you want this role, and why are you a strong fit?",
      keyPoints: [
        "Connect your values and goals to the organization",
        "Highlight 2–3 specific strengths with examples",
        "Show enthusiasm without overselling"
      ]
    }
  ],
  "Teaching demo": [
    {
      question: "Explain a complex concept (e.g., photosynthesis, supply and demand) as if to a beginner.",
      keyPoints: [
        "Start with the big picture, then narrow down",
        "Use analogies or everyday examples",
        "Check for understanding verbally"
      ]
    },
    {
      question: "How would you handle a disruptive or disengaged student in class?",
      keyPoints: [
        "Address the behavior privately when possible",
        "Use non-punitive redirection",
        "Consider underlying causes (boredom, confusion, personal issues)"
      ]
    }
  ],
  "Policy & ethics": [
    {
      question: "A colleague shares confidential information. How do you respond?",
      keyPoints: [
        "Clarify boundaries and expectations of confidentiality",
        "Escalate appropriately if policy or law is breached",
        "Document and protect the interests of affected parties"
      ]
    },
    {
      question: "You disagree with a supervisor's decision. How do you handle it?",
      keyPoints: [
        "Express your view respectfully and with evidence",
        "Listen to their reasoning",
        "Accept the final decision while maintaining professionalism"
      ]
    }
  ]
};
function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function escapeHtml(str) {
  if (str == null) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function formatCountdown(iso) {
  const exam = new Date(iso);
  const now = /* @__PURE__ */ new Date();
  exam.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((exam - now) / (1e3 * 60 * 60 * 24));
  if (diff < 0) return { label: "Exam date passed", value: `${Math.abs(diff)} days ago` };
  if (diff === 0) return { label: "Exam is today", value: "Good luck!" };
  if (diff === 1) return { label: "Exam tomorrow", value: "1 day" };
  return { label: "Days until exam", value: `${diff} days` };
}
function getQuickStats(loadStorage2, STORAGE_KEYS2) {
  const history = loadStorage2(STORAGE_KEYS2.sessionHistory, []) || [];
  const sessionsCompleted = history.length;
  const byTopic = {};
  history.forEach((h) => {
    byTopic[h.topic] = (byTopic[h.topic] || 0) + 1;
  });
  const mostPracticed = Object.keys(byTopic).length === 0 ? null : Object.entries(byTopic).sort((a, b) => b[1] - a[1])[0][0];
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
  return { sessionsCompleted, averageScore: null, currentStreak, mostPracticed };
}
let pdfjsLib = null;
const PDFJS_VERSION = "5.4.624";
async function getPdfLib() {
  if (pdfjsLib) return pdfjsLib;
  const mod = await __vitePreload(() => import("./pdf-c7rr3F5W.js"), true ? [] : void 0);
  pdfjsLib = mod.default || mod;
  if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`;
  }
  return pdfjsLib;
}
async function extractTextFromPdf(arrayBuffer) {
  if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer)) return "";
  const lib = await getPdfLib();
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const parts = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = (textContent.items || []).map((item) => item && typeof item.str === "string" ? item.str : "").join(" ");
    if (pageText.trim()) parts.push(pageText.trim());
  }
  return parts.join("\n\n");
}
function isPdfFile(name, mimeType) {
  if (mimeType === "application/pdf") return true;
  if (typeof name === "string" && name.toLowerCase().endsWith(".pdf")) return true;
  return false;
}
const VoiceTutor = reactExports.lazy(() => __vitePreload(() => import("./VoiceTutor-1cuvo1Tq.js"), true ? __vite__mapDeps([0,1,2,3,4]) : void 0));
const ROUTES = ["home", "subjects", "performance", "weak", "settings", "folder", "library"];
const SESSION_ROUTES = ["think", "answer", "feedback", "complete"];
function AppBody() {
  const [apiReady, setApiReady] = reactExports.useState(false);
  const [backendOk, setBackendOk] = reactExports.useState(true);
  const [route, setRoute] = reactExports.useState("home");
  const [sessionRoute, setSessionRoute] = reactExports.useState(null);
  const [thinkTime, setThinkTime] = reactExports.useState(30);
  const [answerTime, setAnswerTime] = reactExports.useState(120);
  const [topic, setTopic] = reactExports.useState(null);
  const [questions, setQuestions] = reactExports.useState([]);
  const [questionOrder, setQuestionOrder] = reactExports.useState([]);
  const [currentIndex, setCurrentIndex] = reactExports.useState(0);
  const [folderSubject, setFolderSubject] = reactExports.useState(null);
  const [folderSubfolderFilter, setFolderSubfolderFilter] = reactExports.useState("");
  const [folderBackRoute, setFolderBackRoute] = reactExports.useState("subjects");
  const [editingNoteId, setEditingNoteId] = reactExports.useState(null);
  const [librarySubjects, setLibrarySubjects] = reactExports.useState([]);
  const [libraryPendingFiles, setLibraryPendingFiles] = reactExports.useState(null);
  const [thinkRemaining, setThinkRemaining] = reactExports.useState(0);
  const [answerRemaining, setAnswerRemaining] = reactExports.useState(0);
  const [answerNotes, setAnswerNotes] = reactExports.useState("");
  const [answerTranscripts, setAnswerTranscripts] = reactExports.useState([]);
  const [currentAnswerTranscript, setCurrentAnswerTranscript] = reactExports.useState("");
  const [sessionSummary, setSessionSummary] = reactExports.useState("");
  const [focusTodayEdit, setFocusTodayEdit] = reactExports.useState(false);
  const [focusTodayInputVal, setFocusTodayInputVal] = reactExports.useState("");
  const [examDateInput, setExamDateInput] = reactExports.useState("");
  const [noteModal, setNoteModal] = reactExports.useState({ open: false, title: "", content: "", subfolder: "" });
  const [subfolderModalOpen, setSubfolderModalOpen] = reactExports.useState(false);
  const [newSubfolderName, setNewSubfolderName] = reactExports.useState("");
  const [newFolderModalOpen, setNewFolderModalOpen] = reactExports.useState(false);
  const [newFolderName, setNewFolderName] = reactExports.useState("");
  const [libraryAddFilesModalOpen, setLibraryAddFilesModalOpen] = reactExports.useState(false);
  const [libraryAddFilesFolder, setLibraryAddFilesFolder] = reactExports.useState("");
  const [libraryNewNoteModalOpen, setLibraryNewNoteModalOpen] = reactExports.useState(false);
  const [libraryNewNote, setLibraryNewNote] = reactExports.useState({ folder: "", title: "", content: "" });
  const [folderRefreshKey, setFolderRefreshKey] = reactExports.useState(0);
  const [subjectRenames, setSubjectRenames] = reactExports.useState({});
  const [renameSubjectKey, setRenameSubjectKey] = reactExports.useState(null);
  const [renameSubjectInput, setRenameSubjectInput] = reactExports.useState("");
  const [renameIsBuiltIn, setRenameIsBuiltIn] = reactExports.useState(true);
  const [charlotteInput, setCharlotteInput] = reactExports.useState("");
  const [charlotteHistory, setCharlotteHistory] = reactExports.useState([]);
  const [charlotteLoading, setCharlotteLoading] = reactExports.useState(false);
  const [charlotteError, setCharlotteError] = reactExports.useState("");
  const [questionsLoading, setQuestionsLoading] = reactExports.useState(false);
  const [questionsError, setQuestionsError] = reactExports.useState("");
  const thinkIntervalRef = reactExports.useRef(null);
  const answerIntervalRef = reactExports.useRef(null);
  const { speak, isSpeaking } = useVoiceTutor();
  const { voiceOptions } = useVoiceOptions();
  const sendToCharlotte = reactExports.useCallback(
    async (msg) => {
      const text = typeof msg === "string" ? msg.trim() : "";
      if (!text || charlotteLoading) return;
      setCharlotteLoading(true);
      setCharlotteError("");
      try {
        const reply = await fetchChat(text, charlotteHistory);
        if (reply) {
          setCharlotteHistory(
            (h) => [...h, { role: "user", content: text }, { role: "assistant", content: reply }].slice(-20)
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
    startListening: startVoiceInput
  } = useSpeechRecognition(sendToCharlotte, (err) => setCharlotteError(err || "Voice input failed."));
  const appendToAnswerNotes = reactExports.useCallback((transcript) => {
    setAnswerNotes((prev) => (prev ? prev + " " : "") + transcript);
  }, []);
  useSpeechRecognition(appendToAnswerNotes, () => {
  });
  const currentAnswerTranscriptRef = reactExports.useRef("");
  const appendAnswerChunk = reactExports.useCallback((chunk) => {
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
    stop: stopSessionAnswerListening
  } = useSessionAnswerRecognition(appendAnswerChunk, () => {
  });
  reactExports.useEffect(() => {
    currentAnswerTranscriptRef.current = currentAnswerTranscript;
  }, [currentAnswerTranscript]);
  reactExports.useEffect(() => {
    initBackend().then(({ backendOk: ok }) => {
      setBackendOk(ok ?? true);
      setApiReady(true);
    });
  }, []);
  reactExports.useEffect(() => {
    if (!apiReady) return;
    setSubjectRenames(loadStorage(STORAGE_KEYS.subjectRenames, {}) || {});
    const practiceSubjects = Object.keys(QUESTIONS_BY_TOPIC || {});
    getUniqueSubjects().then((dbSubjects) => {
      const custom = loadStorage(STORAGE_KEYS.customSubjects, []) || [];
      setLibrarySubjects([.../* @__PURE__ */ new Set([...practiceSubjects, ...dbSubjects, ...custom])].sort());
    });
  }, [apiReady, route]);
  const navigate = reactExports.useCallback((r) => {
    if (!ROUTES.includes(r)) return;
    setRoute(r);
  }, []);
  const saveLastSession = reactExports.useCallback(() => {
    if (!topic || !questions.length) return;
    saveStorage(STORAGE_KEYS.lastSession, {
      topic,
      currentIndex,
      questionOrder,
      timestamp: Date.now()
    });
  }, [topic, questions.length, currentIndex, questionOrder]);
  const addSessionToHistory = reactExports.useCallback((t, completed) => {
    const history = loadStorage(STORAGE_KEYS.sessionHistory, []) || [];
    const next = [{ topic: t, completed, date: (/* @__PURE__ */ new Date()).toISOString() }, ...history].slice(0, 20);
    saveStorage(STORAGE_KEYS.sessionHistory, next);
  }, []);
  const getFocusToday = reactExports.useCallback(() => {
    const raw = loadStorage(STORAGE_KEYS.focusToday, null);
    if (!raw || typeof raw !== "object") return "";
    return raw.text || "";
  }, []);
  const setFocusToday = reactExports.useCallback((text) => {
    const trimmed = (text || "").trim();
    saveStorage(STORAGE_KEYS.focusToday, {
      date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      text: trimmed
    });
  }, []);
  const getWeakAreas = reactExports.useCallback(
    () => loadStorage(STORAGE_KEYS.weakAreas, []) || [],
    []
  );
  const addWeakArea = reactExports.useCallback((t, question) => {
    const areas = getWeakAreas();
    if (areas.some((a) => a.topic === t && a.question === question)) return;
    saveStorage(STORAGE_KEYS.weakAreas, [{ topic: t, question }, ...areas].slice(0, 30));
  }, [getWeakAreas]);
  const removeWeakArea = reactExports.useCallback((index) => {
    const areas = getWeakAreas();
    areas.splice(index, 1);
    saveStorage(STORAGE_KEYS.weakAreas, areas);
  }, [getWeakAreas]);
  const getExamDate = reactExports.useCallback(
    () => loadStorage(STORAGE_KEYS.examDate, null),
    []
  );
  const setExamDate = reactExports.useCallback((iso) => {
    saveStorage(STORAGE_KEYS.examDate, iso || null);
  }, []);
  const stats = apiReady ? getQuickStats(loadStorage, STORAGE_KEYS) : { sessionsCompleted: 0, currentStreak: 0, mostPracticed: null };
  const lastSession = apiReady ? loadStorage(STORAGE_KEYS.lastSession, null) : null;
  const sessionHistory = apiReady ? loadStorage(STORAGE_KEYS.sessionHistory, []) || [] : [];
  const weakAreas = apiReady ? getWeakAreas() : [];
  const examDate = apiReady ? getExamDate() : null;
  const inSession = sessionRoute && SESSION_ROUTES.includes(sessionRoute);
  const progressPct = questions.length > 0 ? currentIndex / questions.length * 100 : 0;
  const openFolder = reactExports.useCallback((subject, backRoute = "subjects") => {
    setFolderSubject(subject);
    setFolderSubfolderFilter("");
    setFolderBackRoute(backRoute || "subjects");
    setRoute("folder");
  }, []);
  const lastSpokenQuestionRef = reactExports.useRef(null);
  const selectTopic = reactExports.useCallback(
    async (t) => {
      if (QUESTIONS_BY_TOPIC[t]) {
        const raw = [...QUESTIONS_BY_TOPIC[t]];
        const shuffled = shuffleArray(raw.map((q, i) => ({ ...q, _idx: i })));
        setTopic(t);
        setQuestions(shuffled);
        setQuestionOrder(shuffled.map((q) => q._idx));
        setCurrentIndex(0);
        setAnswerNotes("");
        setAnswerTranscripts([]);
        setCurrentAnswerTranscript("");
        setQuestionsError("");
        saveLastSession();
        setSessionRoute("think");
        lastSpokenQuestionRef.current = null;
        return;
      }
      setTopic(t);
      setQuestionsLoading(true);
      setQuestionsError("");
      try {
        const items = await getAllBySubject(t);
        let material = "";
        for (const item of items) {
          if (item.type === "note") {
            const full = await getItem(item.id);
            if (full && full.content) material += (material ? "\n\n" : "") + String(full.content).trim();
          } else if (item.type === "file" && isPdfFile(item.name, item.mimeType)) {
            const full = await getItem(item.id);
            if (full && full.content instanceof ArrayBuffer) {
              try {
                const text = await extractTextFromPdf(full.content);
                if (text.trim()) material += (material ? "\n\n" : "") + text.trim();
              } catch (e) {
                console.warn("PDF text extraction failed for", item.name, e);
              }
            }
          }
        }
        if (!material || material.length < 100) {
          setQuestionsError("Add notes or upload PDF readings to this folder so we can generate questions from your material. (Only text-based PDFs are read; scanned images are not supported.)");
          setQuestionsLoading(false);
          setTopic(null);
          return;
        }
        const { questions: generated } = await fetchGenerateQuestions(material);
        const raw = (generated || []).map((q, i) => ({ ...q, _idx: i }));
        const shuffled = shuffleArray(raw);
        setQuestions(shuffled);
        setQuestionOrder(shuffled.map((q) => q._idx));
        setCurrentIndex(0);
        setAnswerNotes("");
        setAnswerTranscripts([]);
        setCurrentAnswerTranscript("");
        saveLastSession();
        setSessionRoute("think");
        lastSpokenQuestionRef.current = null;
      } catch (err) {
        setQuestionsError(err.message || "Could not generate questions. Check that the server has OPENAI_API_KEY set.");
      } finally {
        setQuestionsLoading(false);
      }
    },
    [saveLastSession, getAllBySubject, getItem, fetchGenerateQuestions]
  );
  const currentQuestion = questions[currentIndex];
  reactExports.useEffect(() => {
    if (sessionRoute !== "think" || !currentQuestion || !questions.length) return;
    const key = `${currentIndex}-${currentQuestion.question}`;
    if (lastSpokenQuestionRef.current === key) return;
    lastSpokenQuestionRef.current = key;
    speak(currentQuestion.question);
  }, [sessionRoute, currentIndex, currentQuestion, questions.length, speak]);
  const onStartAnswer = reactExports.useCallback(() => {
    setCurrentAnswerTranscript("");
    setSessionRoute("answer");
    setAnswerRemaining(Math.max(30, answerTime));
    startSessionAnswerListening();
  }, [answerTime, startSessionAnswerListening]);
  const saveCurrentTranscriptAndLeaveAnswer = reactExports.useCallback(() => {
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
  reactExports.useEffect(() => {
    if (sessionRoute !== "answer" || !sessionAnswerRecognitionSupported || isSessionAnswerListening) return;
    startSessionAnswerListening();
  }, [sessionRoute, sessionAnswerRecognitionSupported, isSessionAnswerListening, startSessionAnswerListening]);
  reactExports.useEffect(() => {
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
    }, 1e3);
    return () => {
      if (answerIntervalRef.current) clearInterval(answerIntervalRef.current);
    };
  }, [sessionRoute, currentIndex, answerTime]);
  const onNextQuestion = reactExports.useCallback(() => {
    if (answerIntervalRef.current) {
      clearInterval(answerIntervalRef.current);
      answerIntervalRef.current = null;
    }
    if (sessionRoute === "answer") saveCurrentTranscriptAndLeaveAnswer();
    setSessionRoute("feedback");
  }, [sessionRoute, saveCurrentTranscriptAndLeaveAnswer]);
  const nextOrComplete = reactExports.useCallback(() => {
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
  const endSession = reactExports.useCallback(() => {
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
  const backToHome = reactExports.useCallback(() => {
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
  const practiceMore = reactExports.useCallback(() => {
    setSessionRoute(null);
    setTopic(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswerTranscripts([]);
    setCurrentAnswerTranscript("");
    setRoute("subjects");
  }, []);
  const openNoteEditor = reactExports.useCallback(
    async (id) => {
      setEditingNoteId(id);
      if (id) {
        const item = await getItem(id);
        setNoteModal({
          open: true,
          title: (item == null ? void 0 : item.name) || "",
          content: (item == null ? void 0 : item.content) ?? "",
          subfolder: (item == null ? void 0 : item.subfolder) || ""
        });
      } else {
        setNoteModal({
          open: true,
          title: "",
          content: "",
          subfolder: folderSubfolderFilter || ""
        });
      }
    },
    [folderSubfolderFilter]
  );
  const closeNoteEditor = reactExports.useCallback(() => {
    setNoteModal((m) => ({ ...m, open: false }));
    setEditingNoteId(null);
  }, []);
  const saveNote = reactExports.useCallback(async () => {
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
        subfolder
      });
    }
    closeNoteEditor();
    setFolderRefreshKey((k) => k + 1);
  }, [noteModal, editingNoteId, folderSubject, closeNoteEditor]);
  const deleteFolderItem = reactExports.useCallback(
    async (id) => {
      if (!window.confirm("Delete this item?")) return;
      await deleteItem(id);
      if (editingNoteId === id) closeNoteEditor();
      setRoute((r) => r);
    },
    [editingNoteId, closeNoteEditor]
  );
  if (!apiReady) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "app", style: { justifyContent: "center", alignItems: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Loading…" }) });
  }
  if (!backendOk) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "app screen-auth", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-card", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "logo", style: { marginBottom: "1rem" }, children: "Vox Scholar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "auth-message", children: "Server unavailable. Check your connection and try again." })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "header-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "logo", onClick: () => navigate("home"), children: "Vox Scholar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "tagline", children: "Practice like the real thing" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-settings", onClick: () => navigate("settings"), title: "Settings", children: "⚙" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `progress-bar ${inSession ? "" : "hidden"}`, "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-fill", style: { width: `${progressPct}%` } }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "main", children: [
      questionsLoading && topic && !sessionRoute && /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "screen screen-preparing active", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "preparing-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "preparing-text", children: "Reading your material and generating questions…" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "preparing-spinner", "aria-hidden": "true" })
      ] }) }),
      questionsError && !sessionRoute && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "questions-error-banner", role: "alert", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: questionsError }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => setQuestionsError(""), children: "Dismiss" })
      ] }),
      route === "home" && !inSession && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "screen screen-home active", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "home-cta", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: "btn-cta-primary",
            onClick: () => navigate("subjects"),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cta-label", children: "🎤 Start Mock Exam" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cta-sublabel", children: "15-minute timed oral simulation" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "home-tile voice-tutor-tile", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "tile-title", children: "Charlotte — your voice tutor" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile-body voice-tutor-tile-body", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              VoiceTutor,
              {
                isSpeaking,
                label: "Charlotte, voice tutor",
                idleMessage: "Tap below to hear Charlotte say hello",
                size: "medium"
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "voice-tutor-actions", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "btn btn-secondary btn-sm",
                onClick: () => speak(
                  "Hi, I'm Charlotte, your voice tutor. I'm so excited to help you learn and get ready for your oral exams. Whenever you're ready, start a mock exam or pick a subject to practice—I'm here to read questions and key points aloud. Let's do this!"
                ),
                disabled: isSpeaking,
                children: isSpeaking ? "Speaking…" : "Hear Charlotte’s welcome"
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "charlotte-chat", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "charlotte-chat-hint", children: "Ask Charlotte anything—type or tap the mic to talk; she'll reply and can read it aloud." }),
              voiceInputSupported && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "charlotte-voice-input", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "btn btn-secondary btn-sm charlotte-mic-btn",
                  onClick: startVoiceInput,
                  disabled: charlotteLoading || isSpeaking || isListening,
                  title: "Talk to Charlotte",
                  "aria-label": isListening ? "Listening…" : "Talk to Charlotte",
                  children: isListening ? "Listening…" : "🎤 Talk to Charlotte"
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "form",
                {
                  className: "charlotte-chat-form",
                  onSubmit: (e) => {
                    e.preventDefault();
                    sendToCharlotte(charlotteInput);
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "input",
                      {
                        type: "text",
                        className: "charlotte-chat-input",
                        placeholder: "e.g. How do I stay calm in the exam?",
                        value: charlotteInput,
                        onChange: (e) => setCharlotteInput(e.target.value),
                        disabled: charlotteLoading
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "btn btn-primary btn-sm", disabled: charlotteLoading || !charlotteInput.trim(), children: charlotteLoading ? "…" : "Ask Charlotte" })
                  ]
                }
              ),
              charlotteError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "charlotte-chat-error", children: charlotteError })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stats-bar", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-value", children: stats.sessionsCompleted }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-label", children: "Sessions completed" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-value", children: "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-label", children: "Average score" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-value", children: stats.currentStreak }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-label", children: "Current streak" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "stat-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-value stat-subject", children: stats.mostPracticed || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "stat-label", children: "Most practiced" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "home-two-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "home-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "home-tile home-continue", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "tile-title", children: "Continue Last Session" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "tile-body", children: lastSession && QUESTIONS_BY_TOPIC[lastSession.topic] ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "continue-content", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "continue-topic", children: subjectRenames[lastSession.topic] || lastSession.topic }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "continue-progress", children: [
                  "Question ",
                  lastSession.currentIndex + 1,
                  " of ",
                  lastSession.questionOrder.length
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    className: "btn btn-primary btn-sm",
                    onClick: () => {
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
                    },
                    children: "Continue"
                  }
                )
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "continue-empty", children: "No session in progress" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "home-tile home-start-exam", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "tile-title", children: "Start Exam" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile-body", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "start-exam-desc", children: "Pick a subject and run a timed practice session." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary btn-sm", onClick: () => navigate("subjects"), children: "Start exam" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "home-tile focus-today-panel", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "tile-title", children: "Focus Today" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "tile-body focus-today-body", children: !focusTodayEdit ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `focus-today-text ${!getFocusToday() ? "empty" : ""}`, children: getFocusToday() || "Set your focus for today" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    className: "btn btn-secondary btn-sm focus-today-btn",
                    onClick: () => {
                      setFocusTodayEdit(true);
                      setFocusTodayInputVal(getFocusToday());
                    },
                    children: "Edit focus"
                  }
                )
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "focus-today-edit", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "text",
                    className: "focus-today-input",
                    value: focusTodayInputVal,
                    onChange: (e) => setFocusTodayInputVal(e.target.value),
                    placeholder: "e.g. Cardiorespiratory system",
                    maxLength: 120
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    className: "btn btn-primary btn-sm",
                    onClick: () => {
                      setFocusToday(focusTodayInputVal);
                      setFocusTodayEdit(false);
                    },
                    children: "Save"
                  }
                )
              ] }) }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "section",
              {
                className: "home-tile home-library",
                role: "button",
                tabIndex: 0,
                onClick: () => navigate("library"),
                onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), navigate("library")),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "tile-title", children: "Library" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile-body", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "library-desc", children: "Add files from your computer, create notes, and organize by class." }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        className: "btn btn-secondary btn-sm",
                        onClick: (e) => (e.stopPropagation(), navigate("library")),
                        children: "Open library"
                      }
                    )
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "home-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "home-tile home-performance", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "tile-title", children: "Recent Performance" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile-body", children: [
                sessionHistory.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "performance-empty", children: "Complete a session to see stats" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "performance-preview", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "performance-stats", children: Object.entries(
                  sessionHistory.slice(0, 5).reduce((acc, h) => {
                    acc[h.topic] = (acc[h.topic] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([t, n]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "performance-row", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: escapeHtml(t) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: n })
                ] }, t)) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-secondary btn-sm tile-more", onClick: () => navigate("performance"), children: "View details" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "home-tile home-weak", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "tile-title", children: "Weak Areas" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "tile-body", children: [
                weakAreas.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "weak-empty", children: "Flag questions during practice" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "weak-preview", children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { children: weakAreas.slice(0, 3).map((w, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                  escapeHtml(subjectRenames[w.topic] || w.topic),
                  ": ",
                  escapeHtml(w.question.slice(0, 30)),
                  w.question.length > 30 ? "…" : ""
                ] }, i)) }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-secondary btn-sm tile-more", onClick: () => navigate("weak"), children: "View all" })
              ] })
            ] })
          ] })
        ] })
      ] }),
      route === "subjects" && !inSession && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "screen screen-subjects active", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "screen-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-back", onClick: () => navigate("home"), children: "← Home" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "screen-title", children: "Subjects" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "session-settings", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "setting", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Think time (sec)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                value: thinkTime,
                onChange: (e) => setThinkTime(Number(e.target.value) || 30),
                min: 5,
                max: 120,
                step: 5
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "setting", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Answer time (sec)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                value: answerTime,
                onChange: (e) => setAnswerTime(Number(e.target.value) || 120),
                min: 30,
                max: 600,
                step: 30
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "subject-grid", children: Object.keys(QUESTIONS_BY_TOPIC).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "subject-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "subject-name", children: escapeHtml(subjectRenames[t] || t) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "subject-card-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary btn-sm", onClick: () => selectTopic(t), children: "Practice" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => openFolder(t), children: "Class" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "btn btn-sm btn-rename",
                onClick: () => {
                  setRenameSubjectKey(t);
                  setRenameSubjectInput(subjectRenames[t] ?? t);
                  setRenameIsBuiltIn(true);
                },
                title: "Rename subject",
                children: "Rename"
              }
            )
          ] })
        ] }, t)) })
      ] }),
      route === "library" && !inSession && /* @__PURE__ */ jsxRuntimeExports.jsx(
        LibraryScreen,
        {
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
          onRenameSubject: (subject) => {
            setRenameSubjectKey(subject);
            setRenameSubjectInput(QUESTIONS_BY_TOPIC[subject] ? subjectRenames[subject] ?? subject : subject);
            setRenameIsBuiltIn(!!QUESTIONS_BY_TOPIC[subject]);
          }
        }
      ),
      route === "folder" && !inSession && folderSubject && /* @__PURE__ */ jsxRuntimeExports.jsx(
        FolderScreen,
        {
          folderSubject,
          subjectRenames,
          folderSubfolderFilter,
          setFolderSubfolderFilter,
          folderBackRoute,
          navigate,
          openNoteEditor,
          openFolder,
          selectTopic,
          questionsLoading,
          getAllBySubject,
          getSubfolders,
          getItem,
          addItem,
          updateItem,
          deleteItem,
          setSubfolderModalOpen,
          setNewSubfolderName,
          escapeHtml,
          setRoute
        },
        folderRefreshKey
      ),
      route === "performance" && !inSession && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "screen screen-performance active", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "screen-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-back", onClick: () => navigate("home"), children: "← Home" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "screen-title", children: "Recent Performance" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "performance-card-full", children: sessionHistory.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "performance-empty", children: "Complete a session to see your stats" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "performance-content-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "performance-stats", children: Object.entries(
          sessionHistory.slice(0, 20).reduce((acc, h) => {
            acc[h.topic] = (acc[h.topic] || 0) + 1;
            return acc;
          }, {})
        ).map(([t, n]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "performance-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: escapeHtml(subjectRenames[t] || t) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            n,
            " session",
            n > 1 ? "s" : ""
          ] })
        ] }, t)) }) }) })
      ] }),
      route === "weak" && !inSession && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "screen screen-weak active", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "screen-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-back", onClick: () => navigate("home"), children: "← Home" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "screen-title", children: "Saved Weak Areas" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "weak-card-full", children: weakAreas.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "weak-empty", children: "Flag questions during practice to build this list" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "weak-list", children: weakAreas.map((w, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            escapeHtml(subjectRenames[w.topic] || w.topic),
            ": ",
            escapeHtml(w.question.slice(0, 50)),
            w.question.length > 50 ? "…" : ""
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "weak-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary btn-sm weak-practice", onClick: () => selectTopic(w.topic), children: "Practice" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "weak-remove", onClick: () => removeWeakArea(i), children: "×" })
          ] })
        ] }, i)) }) })
      ] }),
      route === "settings" && !inSession && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "screen screen-settings active", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "screen-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-back", onClick: () => navigate("home"), children: "← Home" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "screen-title", children: "Settings" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "settings-subtitle", children: "Upcoming Exam" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "countdown-card", children: examDate ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "countdown-display", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "countdown-label", children: formatCountdown(examDate).label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "countdown-value", children: formatCountdown(examDate).value }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "btn btn-secondary btn-sm",
                onClick: () => (setExamDate(null), setExamDateInput("")),
                children: "Clear"
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "countdown-set", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "examDate", children: "Exam date" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                id: "examDate",
                type: "date",
                value: examDateInput,
                onChange: (e) => setExamDateInput(e.target.value)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: "btn btn-primary btn-sm",
                onClick: () => examDateInput && setExamDate(examDateInput),
                children: "Set"
              }
            )
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "settings-subtitle", children: "Charlotte’s voice" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "settings-note", children: "Choose a voice that matches how you’d like Charlotte to sound. Names are labeled by the voice’s sex." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "setting", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Voice" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: loadStorage(STORAGE_KEYS.charlotteVoice, "") ?? "",
                onChange: (e) => saveStorage(STORAGE_KEYS.charlotteVoice, e.target.value || null),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Default (recommended)" }),
                  voiceOptions.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: opt.id, children: opt.label }, opt.id))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "btn btn-secondary btn-sm settings-voice-try",
              onClick: () => previewVoice(loadStorage(STORAGE_KEYS.charlotteVoice, "") ?? "", voiceOptions),
              children: "Try this voice"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "settings-section", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "settings-subtitle", children: "Session Defaults" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "settings-note", children: "Think and answer times are configured on the Subjects screen." })
        ] })
      ] }),
      sessionRoute === "think" && currentQuestion && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "screen screen-think screen-session active", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "phase-label", children: "Charlotte asks" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "session-voice-tutor", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            VoiceTutor,
            {
              isSpeaking,
              label: "Charlotte",
              idleMessage: "Listen for the question",
              size: "small"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "btn btn-secondary btn-sm",
              onClick: () => speak(currentQuestion.question),
              disabled: isSpeaking,
              children: isSpeaking ? "Speaking…" : "Hear question again"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "question-text", children: currentQuestion.question }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "session-actions", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary", onClick: onStartAnswer, children: "Start answering" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: endSession, children: "End session" })
        ] })
      ] }),
      sessionRoute === "answer" && currentQuestion && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "screen screen-answer screen-session active", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "phase-label", children: "Answer" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "question-text", children: currentQuestion.question }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `timer answer-timer ${answerRemaining <= 30 ? "warning" : ""}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "timer-value", children: formatTime(answerRemaining) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "answer-listening-area", children: sessionAnswerRecognitionSupported ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `answer-listening-indicator ${isSessionAnswerListening ? "active" : ""}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "answer-listening-icon", "aria-hidden": true, children: "🎤" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "answer-listening-text", children: isSessionAnswerListening ? "Charlotte is listening… Your response will be shown after the session." : "Tap Start answering below to turn on the microphone." })
          ] }),
          !isSessionAnswerListening && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary answer-start-btn", onClick: startSessionAnswerListening, children: "Start answering" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "answer-listening-fallback", children: "Voice capture is not supported in this browser. Use a supported browser to have your answer recorded." }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "session-actions", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-secondary", onClick: onNextQuestion, children: "Next question" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: endSession, children: "End session" })
        ] })
      ] }),
      sessionRoute === "feedback" && currentQuestion && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "screen screen-feedback screen-session active", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "phase-label", children: "Key points to include" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "session-voice-tutor session-voice-tutor--compact", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceTutor, { isSpeaking, size: "small", idleMessage: "Hear key points" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "btn btn-secondary btn-sm",
              onClick: () => speak(
                "Key points to include: " + currentQuestion.keyPoints.map((p, i) => `${i + 1}. ${p}`).join(". ")
              ),
              disabled: isSpeaking,
              children: isSpeaking ? "Speaking…" : "Hear key points"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "question-text", children: currentQuestion.question }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "key-points", children: currentQuestion.keyPoints.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: escapeHtml(p) }, i)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "feedback-actions", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "btn btn-secondary btn-sm",
              onClick: () => addWeakArea(topic, currentQuestion.question),
              children: "Flag as weak area"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary", onClick: nextOrComplete, children: "Continue" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: endSession, children: "End session" })
        ] })
      ] }),
      sessionRoute === "complete" && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "screen screen-complete screen-session active", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "Session complete" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "session-voice-tutor session-voice-tutor--compact", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceTutor, { isSpeaking, size: "small", idleMessage: "Hear summary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "btn btn-secondary btn-sm",
              onClick: () => speak(sessionSummary),
              disabled: isSpeaking,
              children: isSpeaking ? "Speaking…" : "Hear summary"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "summary", children: sessionSummary }),
        questions.length > 0 && answerTranscripts.some(Boolean) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "complete-transcripts", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "What you said" }),
          questions.map((q, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "complete-transcript-block", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "complete-transcript-question", children: [
              i + 1,
              ". ",
              q.question
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "complete-transcript-answer", children: answerTranscripts[i] || "—" })
          ] }, i))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "complete-actions", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary", onClick: backToHome, children: "Back to home" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-secondary", onClick: practiceMore, children: "Practice another subject" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "footer", children: questions.length > 0 && inSession && sessionRoute !== "complete" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
      "Question ",
      currentIndex + 1,
      " of ",
      questions.length
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal", hidden: !noteModal.open, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-backdrop", onClick: closeNoteEditor }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              className: "modal-title-input",
              placeholder: "Note title",
              value: noteModal.title,
              onChange: (e) => setNoteModal((m) => ({ ...m, title: e.target.value }))
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "modal-close", onClick: closeNoteEditor, children: "×" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            className: "modal-body",
            rows: 12,
            placeholder: "Write your note…",
            value: noteModal.content,
            onChange: (e) => setNoteModal((m) => ({ ...m, content: e.target.value }))
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-footer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "setting", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Subfolder" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                placeholder: "e.g. Lecture notes",
                value: noteModal.subfolder,
                onChange: (e) => setNoteModal((m) => ({ ...m, subfolder: e.target.value }))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => editingNoteId && deleteFolderItem(editingNoteId), children: "Delete" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary", onClick: saveNote, children: "Save" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SubfolderModal,
      {
        open: subfolderModalOpen,
        onClose: () => setSubfolderModalOpen(false),
        newSubfolderName,
        setNewSubfolderName,
        folderSubject,
        addItem,
        onCreated: () => setFolderRefreshKey((k) => k + 1)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      NewFolderModal,
      {
        open: newFolderModalOpen,
        onClose: () => setNewFolderModalOpen(false),
        newFolderName,
        setNewFolderName,
        loadStorage,
        saveStorage,
        STORAGE_KEYS,
        openFolder
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      LibraryAddFilesModal,
      {
        open: libraryAddFilesModalOpen,
        onClose: () => (setLibraryAddFilesModalOpen(false), setLibraryPendingFiles(null)),
        pendingFiles: libraryPendingFiles,
        librarySubjects,
        libraryAddFilesFolder,
        setLibraryAddFilesFolder,
        onConfirm: async () => {
          if (!(libraryAddFilesFolder == null ? void 0 : libraryAddFilesFolder.trim()) || !(libraryPendingFiles == null ? void 0 : libraryPendingFiles.length)) return;
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
              size: file.size
            });
          }
          setLibraryPendingFiles(null);
          setLibraryAddFilesModalOpen(false);
          setRoute((r) => r);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      LibraryNewNoteModal,
      {
        open: libraryNewNoteModalOpen,
        onClose: () => setLibraryNewNoteModalOpen(false),
        libraryNewNote,
        setLibraryNewNote,
        librarySubjects,
        onSave: async () => {
          var _a, _b;
          const folder = (_a = libraryNewNote.folder) == null ? void 0 : _a.trim();
          const title = (_b = libraryNewNote.title) == null ? void 0 : _b.trim();
          if (!folder || !title) {
            window.alert("Please choose a folder and enter a title.");
            return;
          }
          await addItem({
            subject: folder,
            name: title,
            type: "note",
            content: libraryNewNote.content || "",
            subfolder: ""
          });
          setLibraryNewNoteModalOpen(false);
          setLibraryNewNote({ folder: "", title: "", content: "" });
          setRoute((r) => r);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      RenameSubjectModal,
      {
        open: renameSubjectKey != null,
        topicKey: renameSubjectKey,
        displayName: renameSubjectInput,
        setDisplayName: setRenameSubjectInput,
        isBuiltIn: renameIsBuiltIn,
        onSave: async () => {
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
          saveStorage(STORAGE_KEYS.customSubjects, custom.map((s) => s === key ? trimmed : s));
          const items = await getAllBySubject(key);
          for (const item of items) await updateItem(item.id, { subject: trimmed });
          setLibrarySubjects((prev) => prev.map((s) => s === key ? trimmed : s));
          setRenameSubjectKey(null);
        },
        onClose: () => setRenameSubjectKey(null),
        escapeHtml
      }
    )
  ] });
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
  getUniqueSubjects: getUniqueSubjects2,
  getAllBySubject: getAllBySubject2,
  loadStorage: loadStorage2,
  saveStorage: saveStorage2,
  STORAGE_KEYS: STORAGE_KEYS2,
  escapeHtml: escapeHtml2,
  QUESTIONS_BY_TOPIC: QUESTIONS_BY_TOPIC2,
  onRenameSubject
}) {
  const [folderRows, setFolderRows] = reactExports.useState([]);
  reactExports.useEffect(() => {
    if (librarySubjects.length === 0) {
      setFolderRows([]);
      return;
    }
    Promise.all(
      librarySubjects.map(async (subject) => {
        const items = await getAllBySubject2(subject);
        const notes = items.filter((i) => i.type === "note").length;
        const files = items.filter((i) => i.type !== "note").length;
        return { subject, notes, files };
      })
    ).then(setFolderRows);
  }, [librarySubjects, getAllBySubject2]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "screen screen-library active", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "screen-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-back", onClick: () => navigate("home"), children: "← Home" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "screen-title", children: "Library" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "library-actions", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "btn btn-primary btn-sm library-upload-label", children: [
        "Add files from computer",
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "file",
            multiple: true,
            hidden: true,
            onChange: (e) => {
              const files = e.target.files;
              if (!(files == null ? void 0 : files.length)) return;
              if (librarySubjects.length === 0) {
                window.alert("Create a class first (use + New class), then add files.");
                e.target.value = "";
                return;
              }
              setLibraryPendingFiles(Array.from(files));
              setLibraryAddFilesModalOpen(true);
              e.target.value = "";
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "btn btn-primary btn-sm",
          onClick: () => {
            if (librarySubjects.length === 0) {
              window.alert("Create a class first (use + New class), then add notes.");
              return;
            }
            setLibraryNewNoteModalOpen(true);
          },
          children: "+ New note"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => setNewFolderModalOpen(true), children: "+ New class" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "library-list", children: folderRows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "library-empty", children: "No classes yet. Create a class to add notes and PDFs." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "library-folders", children: folderRows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "library-folder-item", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "library-folder-info", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "library-folder-name", children: escapeHtml2(subjectRenames[r.subject] || r.subject) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "library-folder-meta", children: [
          r.notes,
          " note",
          r.notes !== 1 ? "s" : "",
          ", ",
          r.files,
          " file",
          r.files !== 1 ? "s" : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "library-folder-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "btn btn-sm btn-rename",
            onClick: () => onRenameSubject(r.subject),
            title: QUESTIONS_BY_TOPIC2[r.subject] ? "Rename display name" : "Rename class",
            children: "Rename"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "btn btn-primary btn-sm",
            onClick: () => openFolder(r.subject, "library"),
            children: "Open"
          }
        )
      ] })
    ] }, r.subject)) }) })
  ] });
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
  questionsLoading,
  getAllBySubject: getAllBySubject2,
  getSubfolders: getSubfolders2,
  getItem: getItem2,
  addItem: addItem2,
  updateItem: updateItem2,
  deleteItem: deleteItem2,
  setSubfolderModalOpen,
  setNewSubfolderName,
  escapeHtml: escapeHtml2,
  setRoute
}) {
  const [items, setItems] = reactExports.useState([]);
  const [subfolders, setSubfolders] = reactExports.useState([]);
  reactExports.useEffect(() => {
    if (!folderSubject) return;
    getSubfolders2(folderSubject).then(setSubfolders);
    getAllBySubject2(folderSubject).then((list) => setItems(list));
  }, [folderSubject, folderSubfolderFilter, getAllBySubject2, getSubfolders2]);
  const filtered = folderSubfolderFilter ? items.filter((i) => (i.subfolder || "") === folderSubfolderFilter) : items;
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
  );
  const openItem = async (id) => {
    const item = await getItem2(id);
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
  };
  const handleFileUpload = async (files) => {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        window.alert(`"${file.name}" is too large (max 10 MB).`);
        continue;
      }
      const content = await readFileAsArrayBuffer(file);
      await addItem2({
        subject: folderSubject,
        name: file.name,
        type: "file",
        content,
        mimeType: file.type || "application/octet-stream",
        size: file.size
      });
    }
    getAllBySubject2(folderSubject).then(setItems);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "screen screen-folder active", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "screen-header", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-back", onClick: () => navigate(folderBackRoute), children: "← Back" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "screen-title", children: [
        subjectRenames[folderSubject] || folderSubject,
        " — Notes & files"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "folder-toolbar", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "folder-filter", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "folderSubfolder", children: "Subfolder" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            id: "folderSubfolder",
            value: folderSubfolderFilter,
            onChange: (e) => setFolderSubfolderFilter(e.target.value),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "All" }),
              subfolders.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s, children: escapeHtml2(s) }, s))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: "btn btn-secondary btn-sm",
          onClick: () => (setNewSubfolderName(""), setSubfolderModalOpen(true)),
          children: "+ New subfolder"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "folder-actions", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary btn-sm", onClick: () => openNoteEditor(null), children: "+ Add note" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "btn btn-secondary btn-sm folder-upload", children: [
        "+ Upload file",
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "file",
            multiple: true,
            hidden: true,
            onChange: (e) => {
              var _a;
              if ((_a = e.target.files) == null ? void 0 : _a.length) handleFileUpload(Array.from(e.target.files));
              e.target.value = "";
            }
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "folder-list", children: sorted.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "folder-empty", children: "No notes or files yet. Add a note or upload a file." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "folder-items", children: sorted.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "folder-item", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "folder-item-icon", children: item.type === "note" ? "📝" : "📎" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "folder-item-info", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "folder-item-name", children: escapeHtml2(item.name) }),
        item.subfolder && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "folder-item-sub", children: escapeHtml2(item.subfolder) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "folder-item-actions", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-icon", title: "Edit", onClick: () => openNoteEditor(item.id), children: "✎" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn-icon", title: "Open", onClick: () => openItem(item.id), children: "→" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: "btn-icon btn-icon-danger",
            title: "Delete",
            onClick: () => window.confirm("Delete this item?") && deleteItem2(item.id).then(() => getAllBySubject2(folderSubject).then(setItems)),
            children: "×"
          }
        )
      ] })
    ] }, item.id)) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "folder-practice", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: "btn btn-primary",
        onClick: () => selectTopic(folderSubject),
        disabled: questionsLoading,
        children: questionsLoading ? "Generating questions…" : "Practice this subject"
      }
    ) })
  ] });
}
function SubfolderModal({ open, onClose, newSubfolderName, setNewSubfolderName, folderSubject, addItem: addItem2, onCreated }) {
  const handleCreate = async () => {
    const name = newSubfolderName.trim();
    if (!name) return;
    await addItem2({
      subject: folderSubject,
      name: "New note",
      type: "note",
      content: "",
      subfolder: name
    });
    setNewSubfolderName("");
    onClose();
    onCreated == null ? void 0 : onCreated();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal modal-sm", hidden: !open, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-backdrop", onClick: onClose }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-content", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "modal-title", children: "New subfolder" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "modal-close", onClick: onClose, children: "×" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-body", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: newSubfolderName,
            onChange: (e) => setNewSubfolderName(e.target.value),
            placeholder: "e.g. Lecture notes, Flashcards"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-footer", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary", onClick: handleCreate, children: "Create" }) })
    ] })
  ] });
}
function NewFolderModal({ open, onClose, newFolderName, setNewFolderName, loadStorage: loadStorage2, saveStorage: saveStorage2, STORAGE_KEYS: STORAGE_KEYS2, openFolder }) {
  const handleCreate = () => {
    const name = newFolderName.trim();
    if (!name) return;
    const custom = loadStorage2(STORAGE_KEYS2.customSubjects, []) || [];
    if (!custom.includes(name)) {
      saveStorage2(STORAGE_KEYS2.customSubjects, [...custom, name]);
    }
    setNewFolderName("");
    onClose();
    openFolder(name, "library");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal modal-sm", hidden: !open, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-backdrop", onClick: onClose }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-content", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "modal-title", children: "New class" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "modal-close", onClick: onClose, children: "×" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-body", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Class name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: newFolderName,
            onChange: (e) => setNewFolderName(e.target.value),
            placeholder: "e.g. Cardiorespiratory, Pharmacology"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-footer", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary", onClick: handleCreate, children: "Create" }) })
    ] })
  ] });
}
function RenameSubjectModal({ open, topicKey, displayName, setDisplayName, isBuiltIn, onSave, onClose, escapeHtml: escapeHtml2 }) {
  if (!open || !topicKey) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal modal-sm", hidden: !open, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-backdrop", onClick: onClose }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-content", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "modal-title", children: isBuiltIn ? "Rename subject" : "Rename class" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "modal-close", onClick: onClose, children: "×" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-body", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "modal-hint", children: isBuiltIn ? `Display name for "${escapeHtml2(topicKey)}"` : `New name for "${escapeHtml2(topicKey)}" (notes and files will move to the new name)` }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: displayName,
              onChange: (e) => setDisplayName(e.target.value),
              placeholder: topicKey
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-footer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-secondary", onClick: onClose, children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary", onClick: onSave, children: "Save" })
      ] })
    ] })
  ] });
}
function LibraryAddFilesModal({
  open,
  onClose,
  pendingFiles,
  librarySubjects,
  libraryAddFilesFolder,
  setLibraryAddFilesFolder,
  onConfirm
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal modal-sm", hidden: !open, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-backdrop", onClick: onClose }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-content", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "modal-title", children: "Add files to class" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "modal-close", onClick: onClose, children: "×" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-body", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "library-add-files-count", children: [
          (pendingFiles == null ? void 0 : pendingFiles.length) ?? 0,
          " file",
          ((pendingFiles == null ? void 0 : pendingFiles.length) ?? 0) !== 1 ? "s" : "",
          " selected. Choose a class to add them to."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Class" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: libraryAddFilesFolder,
              onChange: (e) => setLibraryAddFilesFolder(e.target.value),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "— Choose a class —" }),
                librarySubjects.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s, children: s }, s))
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-footer", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary", onClick: onConfirm, children: "Add here" }) })
    ] })
  ] });
}
function LibraryNewNoteModal({
  open,
  onClose,
  libraryNewNote,
  setLibraryNewNote,
  librarySubjects,
  onSave
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal", hidden: !open, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-backdrop", onClick: onClose }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-content", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "modal-title", children: "New note" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "modal-close", onClick: onClose, children: "×" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "modal-body", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Class" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: libraryNewNote.folder,
              onChange: (e) => setLibraryNewNote((n) => ({ ...n, folder: e.target.value })),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "— Choose a class —" }),
                librarySubjects.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s, children: s }, s))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Title" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: libraryNewNote.title,
              onChange: (e) => setLibraryNewNote((n) => ({ ...n, title: e.target.value })),
              placeholder: "Note title"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Content" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              rows: 8,
              value: libraryNewNote.content,
              onChange: (e) => setLibraryNewNote((n) => ({ ...n, content: e.target.value })),
              placeholder: "Write your note…"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "modal-footer", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-primary", onClick: onSave, children: "Save note" }) })
    ] })
  ] });
}
export {
  AppBody as default
};
