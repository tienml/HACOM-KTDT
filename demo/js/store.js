/**
 * Lưu trữ cục bộ cho Hacom AI Invest.
 *
 * Chỉ giữ hai phần dữ liệu thuần tư vấn:
 *   - survey    : câu trả lời khảo sát nhanh (7 trường điều kiện)
 *   - history   : lịch sử các lần hỏi / chọn loại dự án (giới hạn 20 dòng)
 *   - beginner  : bật/tắt chế độ giải thích người mới
 *
 * Không còn tạo dự án, không upload, không checklist — đúng hướng pivot sang
 * "gợi ý quy trình đầu tư".
 *
 * Hỗ trợ file:// (localStorage bị khóa): trạng thái chỉ tồn tại trong bộ nhớ
 * của tab; isPersistent() = false để UI biết mà cảnh báo nếu cần.
 */

window.HacomStore = (() => {
  const STORAGE_KEY = 'hacom-ktdt-demo-v2';
  const MAX_HISTORY = 20;

  function defaults() {
    return {
      survey: {},
      history: [],
      beginner: false,
    };
  }

  let state = defaults();
  let persistent = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...defaults(), ...JSON.parse(raw) };
  } catch (err) {
    persistent = false;
    // file:// hoặc trình duyệt chặn localStorage — chạy in-memory.
  }

  const listeners = new Set();
  function emit() {
    listeners.forEach((fn) => {
      try { fn(state); } catch {}
    });
  }
  function save() {
    if (!persistent) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    emit();
  }

  // ---- Khảo sát nhanh ---------------------------------------------------

  function getSurvey() { return { ...state.survey }; }

  function setSurveyField(field, value) {
    state.survey = { ...state.survey, [field]: value };
    save();
  }

  function resetSurvey() {
    state.survey = {};
    save();
  }

  // ---- Lịch sử tư vấn ----------------------------------------------------

  function getHistory() { return [...state.history]; }

  function addHistory(entry) {
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      at: new Date().toISOString(),
      query: String(entry.query || '').slice(0, 500),
      typeId: entry.typeId,
      typeLabel: entry.typeLabel,
      counts: entry.counts || null,
    };
    state.history = [item, ...state.history].slice(0, MAX_HISTORY);
    save();
  }

  function clearHistory() {
    state.history = [];
    save();
  }

  // ---- Chế độ người mới --------------------------------------------------

  function getBeginner() { return !!state.beginner; }
  function setBeginner(on) {
    state.beginner = !!on;
    save();
  }

  // ---- Reset toàn bộ -----------------------------------------------------

  function resetAll() {
    state = defaults();
    save();
  }

  // ---- API ---------------------------------------------------------------

  return {
    isPersistent: () => persistent,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    getSurvey,
    setSurveyField,
    resetSurvey,
    getHistory,
    addHistory,
    clearHistory,
    getBeginner,
    setBeginner,
    resetAll,
  };
})();
