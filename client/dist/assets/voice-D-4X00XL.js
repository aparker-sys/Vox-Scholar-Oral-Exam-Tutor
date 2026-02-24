import { f as fetchTTSAudio, l as loadStorage, S as STORAGE_KEYS } from "./api-CXkl7B-R.js";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var react = { exports: {} };
var react_production_min = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var hasRequiredReact_production_min;
function requireReact_production_min() {
  if (hasRequiredReact_production_min) return react_production_min;
  hasRequiredReact_production_min = 1;
  var l = Symbol.for("react.element"), n = Symbol.for("react.portal"), p = Symbol.for("react.fragment"), q = Symbol.for("react.strict_mode"), r = Symbol.for("react.profiler"), t = Symbol.for("react.provider"), u = Symbol.for("react.context"), v = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), x = Symbol.for("react.memo"), y = Symbol.for("react.lazy"), z = Symbol.iterator;
  function A(a) {
    if (null === a || "object" !== typeof a) return null;
    a = z && a[z] || a["@@iterator"];
    return "function" === typeof a ? a : null;
  }
  var B = { isMounted: function() {
    return false;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, C = Object.assign, D = {};
  function E(a, b, e) {
    this.props = a;
    this.context = b;
    this.refs = D;
    this.updater = e || B;
  }
  E.prototype.isReactComponent = {};
  E.prototype.setState = function(a, b) {
    if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, a, b, "setState");
  };
  E.prototype.forceUpdate = function(a) {
    this.updater.enqueueForceUpdate(this, a, "forceUpdate");
  };
  function F() {
  }
  F.prototype = E.prototype;
  function G(a, b, e) {
    this.props = a;
    this.context = b;
    this.refs = D;
    this.updater = e || B;
  }
  var H = G.prototype = new F();
  H.constructor = G;
  C(H, E.prototype);
  H.isPureReactComponent = true;
  var I = Array.isArray, J = Object.prototype.hasOwnProperty, K = { current: null }, L = { key: true, ref: true, __self: true, __source: true };
  function M(a, b, e) {
    var d, c = {}, k = null, h = null;
    if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
    var g = arguments.length - 2;
    if (1 === g) c.children = e;
    else if (1 < g) {
      for (var f = Array(g), m = 0; m < g; m++) f[m] = arguments[m + 2];
      c.children = f;
    }
    if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
    return { $$typeof: l, type: a, key: k, ref: h, props: c, _owner: K.current };
  }
  function N(a, b) {
    return { $$typeof: l, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
  }
  function O(a) {
    return "object" === typeof a && null !== a && a.$$typeof === l;
  }
  function escape(a) {
    var b = { "=": "=0", ":": "=2" };
    return "$" + a.replace(/[=:]/g, function(a2) {
      return b[a2];
    });
  }
  var P = /\/+/g;
  function Q(a, b) {
    return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
  }
  function R(a, b, e, d, c) {
    var k = typeof a;
    if ("undefined" === k || "boolean" === k) a = null;
    var h = false;
    if (null === a) h = true;
    else switch (k) {
      case "string":
      case "number":
        h = true;
        break;
      case "object":
        switch (a.$$typeof) {
          case l:
          case n:
            h = true;
        }
    }
    if (h) return h = a, c = c(h), a = "" === d ? "." + Q(h, 0) : d, I(c) ? (e = "", null != a && (e = a.replace(P, "$&/") + "/"), R(c, b, e, "", function(a2) {
      return a2;
    })) : null != c && (O(c) && (c = N(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a)), b.push(c)), 1;
    h = 0;
    d = "" === d ? "." : d + ":";
    if (I(a)) for (var g = 0; g < a.length; g++) {
      k = a[g];
      var f = d + Q(k, g);
      h += R(k, b, e, f, c);
    }
    else if (f = A(a), "function" === typeof f) for (a = f.call(a), g = 0; !(k = a.next()).done; ) k = k.value, f = d + Q(k, g++), h += R(k, b, e, f, c);
    else if ("object" === k) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
    return h;
  }
  function S(a, b, e) {
    if (null == a) return a;
    var d = [], c = 0;
    R(a, d, "", "", function(a2) {
      return b.call(e, a2, c++);
    });
    return d;
  }
  function T(a) {
    if (-1 === a._status) {
      var b = a._result;
      b = b();
      b.then(function(b2) {
        if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
      }, function(b2) {
        if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
      });
      -1 === a._status && (a._status = 0, a._result = b);
    }
    if (1 === a._status) return a._result.default;
    throw a._result;
  }
  var U = { current: null }, V = { transition: null }, W = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: V, ReactCurrentOwner: K };
  function X() {
    throw Error("act(...) is not supported in production builds of React.");
  }
  react_production_min.Children = { map: S, forEach: function(a, b, e) {
    S(a, function() {
      b.apply(this, arguments);
    }, e);
  }, count: function(a) {
    var b = 0;
    S(a, function() {
      b++;
    });
    return b;
  }, toArray: function(a) {
    return S(a, function(a2) {
      return a2;
    }) || [];
  }, only: function(a) {
    if (!O(a)) throw Error("React.Children.only expected to receive a single React element child.");
    return a;
  } };
  react_production_min.Component = E;
  react_production_min.Fragment = p;
  react_production_min.Profiler = r;
  react_production_min.PureComponent = G;
  react_production_min.StrictMode = q;
  react_production_min.Suspense = w;
  react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
  react_production_min.act = X;
  react_production_min.cloneElement = function(a, b, e) {
    if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
    var d = C({}, a.props), c = a.key, k = a.ref, h = a._owner;
    if (null != b) {
      void 0 !== b.ref && (k = b.ref, h = K.current);
      void 0 !== b.key && (c = "" + b.key);
      if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
      for (f in b) J.call(b, f) && !L.hasOwnProperty(f) && (d[f] = void 0 === b[f] && void 0 !== g ? g[f] : b[f]);
    }
    var f = arguments.length - 2;
    if (1 === f) d.children = e;
    else if (1 < f) {
      g = Array(f);
      for (var m = 0; m < f; m++) g[m] = arguments[m + 2];
      d.children = g;
    }
    return { $$typeof: l, type: a.type, key: c, ref: k, props: d, _owner: h };
  };
  react_production_min.createContext = function(a) {
    a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
    a.Provider = { $$typeof: t, _context: a };
    return a.Consumer = a;
  };
  react_production_min.createElement = M;
  react_production_min.createFactory = function(a) {
    var b = M.bind(null, a);
    b.type = a;
    return b;
  };
  react_production_min.createRef = function() {
    return { current: null };
  };
  react_production_min.forwardRef = function(a) {
    return { $$typeof: v, render: a };
  };
  react_production_min.isValidElement = O;
  react_production_min.lazy = function(a) {
    return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T };
  };
  react_production_min.memo = function(a, b) {
    return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
  };
  react_production_min.startTransition = function(a) {
    var b = V.transition;
    V.transition = {};
    try {
      a();
    } finally {
      V.transition = b;
    }
  };
  react_production_min.unstable_act = X;
  react_production_min.useCallback = function(a, b) {
    return U.current.useCallback(a, b);
  };
  react_production_min.useContext = function(a) {
    return U.current.useContext(a);
  };
  react_production_min.useDebugValue = function() {
  };
  react_production_min.useDeferredValue = function(a) {
    return U.current.useDeferredValue(a);
  };
  react_production_min.useEffect = function(a, b) {
    return U.current.useEffect(a, b);
  };
  react_production_min.useId = function() {
    return U.current.useId();
  };
  react_production_min.useImperativeHandle = function(a, b, e) {
    return U.current.useImperativeHandle(a, b, e);
  };
  react_production_min.useInsertionEffect = function(a, b) {
    return U.current.useInsertionEffect(a, b);
  };
  react_production_min.useLayoutEffect = function(a, b) {
    return U.current.useLayoutEffect(a, b);
  };
  react_production_min.useMemo = function(a, b) {
    return U.current.useMemo(a, b);
  };
  react_production_min.useReducer = function(a, b, e) {
    return U.current.useReducer(a, b, e);
  };
  react_production_min.useRef = function(a) {
    return U.current.useRef(a);
  };
  react_production_min.useState = function(a) {
    return U.current.useState(a);
  };
  react_production_min.useSyncExternalStore = function(a, b, e) {
    return U.current.useSyncExternalStore(a, b, e);
  };
  react_production_min.useTransition = function() {
    return U.current.useTransition();
  };
  react_production_min.version = "18.3.1";
  return react_production_min;
}
var hasRequiredReact;
function requireReact() {
  if (hasRequiredReact) return react.exports;
  hasRequiredReact = 1;
  {
    react.exports = requireReact_production_min();
  }
  return react.exports;
}
var reactExports = requireReact();
const React = /* @__PURE__ */ getDefaultExportFromCjs(reactExports);
var cachedPreferredVoice = null;
var FEMALE_NAME_HINTS = [
  "samantha",
  "karen",
  "victoria",
  "moira",
  "tessa",
  "fiona",
  "alice",
  "luciana",
  "linda",
  "susan",
  "laura",
  "zira",
  "catherine",
  "claire",
  "emily",
  "female",
  "woman",
  "google uk english female",
  "microsoft zira",
  "google us english"
];
var MALE_NAME_HINTS = [
  "alex",
  "daniel",
  "ralph",
  "bruce",
  "fred",
  "tom",
  "david",
  "mark",
  "paul",
  "male",
  "man",
  "google uk english male",
  "microsoft david"
];
function inferVoiceGender(voice) {
  const name = (voice.name || "").toLowerCase();
  const uri = (voice.voiceURI || "").toLowerCase();
  const combined = name + " " + uri;
  if (FEMALE_NAME_HINTS.some((h) => combined.includes(h))) return "Female";
  if (MALE_NAME_HINTS.some((h) => combined.includes(h))) return "Male";
  return "Other";
}
function getVoicesWithGender() {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  const lang = "en";
  const enVoices = voices.filter((v) => v.lang.startsWith(lang));
  const pool = enVoices.length ? enVoices : voices;
  const withGender = pool.map((v) => ({
    id: v.voiceURI || v.name,
    label: `${inferVoiceGender(v)} — ${v.name}`,
    voice: v,
    gender: inferVoiceGender(v)
  }));
  const order = { Female: 0, Male: 1, Other: 2 };
  withGender.sort((a, b) => order[a.gender] - order[b.gender] || a.label.localeCompare(b.label));
  return withGender;
}
function getPreferredVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const savedId = loadStorage(STORAGE_KEYS.charlotteVoice, null);
  if (savedId) {
    const found = voices.find((v) => (v.voiceURI || v.name) === savedId);
    if (found) return found;
  }
  if (cachedPreferredVoice) return cachedPreferredVoice;
  const preferred = [
    "Samantha",
    "Karen",
    "Victoria",
    "Google US English",
    "Microsoft Zira",
    "natural",
    "premium",
    "enhanced"
  ];
  const byLang = voices.filter((v) => v.lang.startsWith("en"));
  const pool = byLang.length ? byLang : voices;
  for (const keyword of preferred) {
    const found = pool.find(
      (v) => v.name.includes(keyword) || v.voiceURI && v.voiceURI.toLowerCase().includes(keyword)
    );
    if (found) {
      cachedPreferredVoice = found;
      return found;
    }
  }
  cachedPreferredVoice = pool[0] || voices[0];
  return cachedPreferredVoice;
}
var voiceListInited = false;
function initVoiceList() {
  if (typeof window === "undefined" || !window.speechSynthesis || voiceListInited) return;
  voiceListInited = true;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedPreferredVoice = null;
    getPreferredVoice();
  };
}
var PITCH_VARY = [0.98, 1, 1.02, 1.01];
var RATE_VARY = [0.88, 0.91, 0.89, 0.92];
function applyNaturalSpeech(u, chunkIndex = 0) {
  const i = chunkIndex % PITCH_VARY.length;
  u.rate = RATE_VARY[i];
  u.pitch = PITCH_VARY[i];
  u.volume = 1;
  const voice = getPreferredVoice();
  if (voice) u.voice = voice;
}
function chunkForSpeaking(text) {
  const t = text.trim();
  if (!t) return [];
  const parts = t.split(new RegExp("(?<=[.!?])\\s+")).filter(Boolean);
  if (parts.length <= 1) return [t];
  return parts;
}
function speakWithVariation(text, { onStart, onEnd }) {
  if (typeof window === "undefined" || !window.speechSynthesis || !(text == null ? void 0 : text.trim())) return;
  window.speechSynthesis.cancel();
  const chunks = chunkForSpeaking(text);
  if (chunks.length === 0) return;
  let index = 0;
  function speakNext() {
    if (index >= chunks.length) {
      onEnd == null ? void 0 : onEnd();
      return;
    }
    const u = new SpeechSynthesisUtterance(chunks[index]);
    applyNaturalSpeech(u, index);
    if (index === 0) u.onstart = onStart;
    u.onend = () => {
      index++;
      speakNext();
    };
    u.onerror = () => {
      index++;
      speakNext();
    };
    window.speechSynthesis.speak(u);
  }
  speakNext();
}
function previewVoice(voiceId, voiceOptions) {
  var _a;
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  let voice = null;
  if (voiceId && Array.isArray(voiceOptions)) {
    const opt = voiceOptions.find((o) => o.id === voiceId);
    if (opt == null ? void 0 : opt.voice) voice = opt.voice;
  }
  if (!voice) voice = getPreferredVoice();
  const name = ((_a = voice == null ? void 0 : voice.name) == null ? void 0 : _a.trim()) || "Charlotte";
  const phrase = `Hi, I'm ${name}. This is how I'll sound when I help you practice for your oral exams.`;
  const u = new SpeechSynthesisUtterance(phrase);
  u.rate = 0.92;
  u.pitch = 1.02;
  u.volume = 1;
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}
function useVoiceOptions() {
  const [voiceOptions, setVoiceOptions] = reactExports.useState([]);
  reactExports.useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    function update() {
      setVoiceOptions(getVoicesWithGender());
    }
    update();
    window.speechSynthesis.onvoiceschanged = update;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  return { voiceOptions };
}
function useVoiceTutor() {
  const [isSpeaking, setIsSpeaking] = reactExports.useState(false);
  const audioRef = reactExports.useRef(null);
  const ttsUrlRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    return () => {
      if (ttsUrlRef.current) URL.revokeObjectURL(ttsUrlRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);
  const speak = reactExports.useCallback(async (text) => {
    const trimmed = text == null ? void 0 : text.trim();
    if (!trimmed) return;
    const hasFallback = typeof window !== "undefined" && window.speechSynthesis;
    const stopTTSPlayback = () => {
      if (ttsUrlRef.current) {
        URL.revokeObjectURL(ttsUrlRef.current);
        ttsUrlRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
    try {
      const blob = await fetchTTSAudio(trimmed);
      if (blob) {
        stopTTSPlayback();
        const url = URL.createObjectURL(blob);
        ttsUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          stopTTSPlayback();
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          stopTTSPlayback();
        };
        await audio.play();
        return;
      }
    } catch (_) {
    }
    if (!hasFallback) return;
    const chunks = chunkForSpeaking(trimmed);
    const useVariation = chunks.length > 1;
    if (useVariation) {
      speakWithVariation(trimmed, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false)
      });
    } else {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(trimmed);
      applyNaturalSpeech(u, 0);
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(u);
    }
  }, []);
  return { speak, isSpeaking };
}
function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
function useSpeechRecognition(onResult, onError) {
  const [isListening, setIsListening] = reactExports.useState(false);
  const recognitionRef = reactExports.useRef(null);
  const onResultRef = reactExports.useRef(onResult);
  const onErrorRef = reactExports.useRef(onError);
  onResultRef.current = onResult;
  onErrorRef.current = onError;
  reactExports.useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      var _a, _b, _c;
      const result = event.results[event.resultIndex];
      const transcript = (result == null ? void 0 : result.isFinal) ? (_b = (_a = result[0]) == null ? void 0 : _a.transcript) == null ? void 0 : _b.trim() : "";
      if (transcript) (_c = onResultRef.current) == null ? void 0 : _c.call(onResultRef, transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      var _a;
      setIsListening(false);
      if (event.error !== "aborted") (_a = onErrorRef.current) == null ? void 0 : _a.call(onErrorRef, event.error);
    };
    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch (_) {
      }
      recognitionRef.current = null;
    };
  }, []);
  const startListening = reactExports.useCallback(() => {
    var _a;
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      (_a = onErrorRef.current) == null ? void 0 : _a.call(onErrorRef, e.message || "Could not start listening");
    }
  }, [isListening]);
  const stopListening = reactExports.useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    try {
      recognitionRef.current.stop();
    } catch (_) {
    }
    setIsListening(false);
  }, [isListening]);
  return {
    supported: isSpeechRecognitionSupported(),
    isListening,
    startListening,
    stopListening
  };
}
function useSessionAnswerRecognition(onChunk, onError) {
  const [isListening, setIsListening] = reactExports.useState(false);
  const recognitionRef = reactExports.useRef(null);
  const onChunkRef = reactExports.useRef(onChunk);
  const onErrorRef = reactExports.useRef(onError);
  onChunkRef.current = onChunk;
  onErrorRef.current = onError;
  reactExports.useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      var _a, _b;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal && ((_a = result[0]) == null ? void 0 : _a.transcript)) {
          const transcript = result[0].transcript.trim();
          if (transcript) (_b = onChunkRef.current) == null ? void 0 : _b.call(onChunkRef, transcript);
        }
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      var _a;
      setIsListening(false);
      if (event.error !== "aborted") (_a = onErrorRef.current) == null ? void 0 : _a.call(onErrorRef, event.error);
    };
    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.abort();
      } catch (_) {
      }
      recognitionRef.current = null;
    };
  }, []);
  const start = reactExports.useCallback(() => {
    var _a;
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      (_a = onErrorRef.current) == null ? void 0 : _a.call(onErrorRef, e.message || "Could not start listening");
    }
  }, [isListening]);
  const stop = reactExports.useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (_) {
    }
    setIsListening(false);
  }, []);
  return {
    supported: isSpeechRecognitionSupported(),
    isListening,
    start,
    stop
  };
}
export {
  React as R,
  reactExports as a,
  useVoiceOptions as b,
  useSpeechRecognition as c,
  useSessionAnswerRecognition as d,
  chunkForSpeaking as e,
  applyNaturalSpeech as f,
  getDefaultExportFromCjs as g,
  initVoiceList as i,
  previewVoice as p,
  requireReact as r,
  speakWithVariation as s,
  useVoiceTutor as u
};
