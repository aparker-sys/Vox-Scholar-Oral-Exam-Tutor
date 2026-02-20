export function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function escapeHtml(str) {
  if (str == null) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function formatCountdown(iso) {
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

export function getQuickStats(loadStorage, STORAGE_KEYS) {
  const history = loadStorage(STORAGE_KEYS.sessionHistory, []) || [];
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
  return { sessionsCompleted, averageScore: null, currentStreak, mostPracticed };
}
