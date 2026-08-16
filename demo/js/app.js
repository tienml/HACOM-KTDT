/**
 * Giao diện Hacom AI Invest — trợ lý gợi ý quy trình đầu tư.
 *
 * Các màn hình:
 *   assistant  - Hỏi / chọn loại dự án, xem bảng kết quả, chi tiết, mục chưa xác định
 *   process    - Duyệt toàn bộ cây quy trình với trạng thái (từ khảo sát + lần hỏi gần nhất)
 *   survey     - Trả lời khảo sát nhanh (7 trường điều kiện) để giải đáp "Chưa xác định"
 *   chat       - AI Assistant: trò chuyện nhiều lượt qua Gemini; sidebar ngữ cảnh/thống kê
 *                tự cập nhật từ tóm tắt kết quả mới nhất của đoạn chat
 *
 * Dữ liệu thuần client-side; không upload, không tạo dự án, không checklist.
 */

(function () {
'use strict';

const D = window.HacomData;
const S = window.HacomStore;
const { APPLY } = D;

/* ============================================================
   Tiện ích chung
   ============================================================ */

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const normText = D.normText;

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  flow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4"/></svg>',
  clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  question: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  printer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-3 13.33V17h6v-1.67A7 7 0 0 0 12 2z"/></svg>',
  robot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="10" rx="2"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M12 9V6"/><circle cx="12" cy="5" r="1"/></svg>',
  checklist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 11l2 2 4-4"/><path d="M9 17h6"/><path d="M9 7h6"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/></svg>',
  hierarchy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="5" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="8" y="16" width="8" height="5" rx="1"/><path d="M6.5 8v3a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V8"/><path d="M12 12v4"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 12h20"/></svg>',
  trendingUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  checkSquare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  helpCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
  xCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M9 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"/></svg>',
  fileText: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  factory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22h20"/><path d="M6 22V10l6-4 6 4v12"/><path d="M10 14h4v8h-4z"/><path d="M10 10h4"/></svg>',
  bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21v-8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8"/><path d="M12 3L2 8h20L12 3z"/><path d="M9 21v-6"/><path d="M15 21v-6"/></svg>',
  message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  checks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 13l4 4L13.5 7"/><path d="M10 13l4 4L22 7"/></svg>',
  plusSquare: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
};

const STAGE_ICONS = [
  // S01 Quy hoạch
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
  // S02 Chủ trương / nhà đầu tư
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l4-6"/><path d="M12 2v10"/></svg>',
  // S03 Đất đai
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>',
  // S04 Môi trường
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4-4 8-7 8-12a8 8 0 1 0-16 0c0 5 4 8 8 12z"/><path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>',
  // S05 Nghiên cứu khả thi
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/><rect x="4" y="2" width="16" height="20" rx="2"/></svg>',
  // S06 Giấy phép xây dựng
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
  // S07 Thi công
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22h20"/><path d="M6 22V12l6-9 6 9v10"/><path d="M10 22v-6h4v6"/></svg>',
  // S08 Nghiệm thu
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 7"/><rect x="2" y="2" width="20" height="20" rx="4"/></svg>',
];

const NAV_ITEMS = [
  { id: 'assistant', label: 'Trang chủ', icon: ICONS.home },
  { id: 'ai-assistant', label: 'AI Assistant', icon: ICONS.robot },
  { id: 'survey', label: 'Khảo sát & Mục tiêu', icon: ICONS.checklist },
  { id: 'analysis', label: 'Phân tích AI', icon: ICONS.target },
  { id: 'suggest-portfolio', label: 'Gợi ý danh mục', icon: ICONS.hierarchy },
  { id: 'process', label: 'Quy trình đầu tư', icon: ICONS.flow },
];

// Map view → thực tế hiển thị (một số màn chưa triển khai trong bản demo)
const VIEW_REAL = {
  'assistant': 'assistant',
  'ai-assistant': 'chat',
  'survey': 'survey',
  'process': 'process',
  'suggest-portfolio': 'portfolio',
};

/* ============================================================
   Trạng thái UI
   ============================================================ */

/* Lưu trữ riêng cho các đoạn chat của AI Assistant (tách khỏi HacomStore để không đụng gì khác).
   Mỗi "đoạn chat" là một cuộc hội thoại độc lập; sidebar Ngữ cảnh hiện tại + Thống kê trạng thái
   chỉ có số liệu khi Gemini đính kèm dòng [TOMTAT]...[/TOMTAT] vào câu trả lời mới nhất của đoạn đó. */
const CONVOS_KEY = 'hacom-ktdt-convos-v1';
const MAX_CONVOS = 20;
const MAX_CHAT_MSG = 60;

const WELCOME_TEXT = 'Xin chào! Tôi là trợ lý AI của Hacom.\nBạn có thể hỏi tôi về quy trình đầu tư theo loại dự án.\nVí dụ: "Quy trình đầu tư nhà ở xã hội là gì?"';

/** { list: [{id,title,createdAt,updatedAt,messages:[{role,text,status?,detail?,at}],summary:null|{typeId,apply,unknown,na,total,stage?,at}}], active: id|null } */
function loadConvos() {
  try {
    const raw = localStorage.getItem(CONVOS_KEY);
    if (!raw) return { list: [], active: null };
    const obj = JSON.parse(raw);
    const list = Array.isArray(obj && obj.list) ? obj.list.filter((c) => c && c.id && Array.isArray(c.messages)) : [];
    return { list, active: obj && obj.active || null };
  } catch (e) { return { list: [], active: null }; }
}
function saveConvos() {
  try { localStorage.setItem(CONVOS_KEY, JSON.stringify({ list: ui.convos.slice(0, MAX_CONVOS), active: ui.activeConvoId })); } catch (e) { /* bỏ qua */ }
}
function activeConvo() { return ui.convos.find((c) => c.id === ui.activeConvoId) || null; }
function newConvoId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

/** Tạo một đoạn chat mới (chỉ có tin chào), đặt làm đoạn đang mở và lưu lại. */
function createConvo() {
  const nowIso = new Date().toISOString();
  const convo = {
    id: newConvoId(),
    title: 'Đoạn chat mới',
    createdAt: nowIso,
    updatedAt: nowIso,
    messages: [{ role: 'ai', text: WELCOME_TEXT, at: nowIso }],
    summary: null,
  };
  ui.convos.unshift(convo);
  if (ui.convos.length > MAX_CONVOS) ui.convos = ui.convos.slice(0, MAX_CONVOS);
  ui.activeConvoId = convo.id;
  saveConvos();
  return convo;
}

/** Đảm bảo luôn có một đoạn chat đang mở (gọi khi vào màn chat mà chưa có). */
function ensureActiveConvo() {
  if (activeConvo()) return activeConvo();
  if (ui.convos.length) { ui.activeConvoId = ui.convos[0].id; saveConvos(); return ui.convos[0]; }
  return createConvo();
}

/** Rút gọn chuỗi dài thành tiêu đề hiển thị trong lịch sử hội thoại. */
function convoTitleFrom(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > 48 ? t.slice(0, 47) + '…' : (t || 'Đoạn chat mới');
}

const _convosInit = loadConvos();
const ui = {
  view: 'assistant',
  activeNav: 'assistant', // mục nav đang được tô sáng
  soon: null,             // tên màn hình "đang phát triển" đang hiển thị
  query: '',
  result: null,        // kết quả suggest hiện tại
  filter: 'all',       // all | apply | unknown | na
  search: '',
  beginner: S.getBeginner(),
  detailStageId: null,
  whyOpen: new Set(),  // node.id đang mở why-box trong màn detail/process
  treeOpen: new Set(['S01']),
  treeSearch: '',
  modalSummary: false,
  // Gợi ý danh mục đầu tư (so sánh các loại hình + AI xếp hạng)
  portfolio: null,        // { status: 'idle'|'loading'|'ok'|'fallback', ranks: [{id,rank,reason}], reason? }
  // AI Assistant: nhiều đoạn chat; sidebar Ngữ cảnh + Thống kê phụ thuộc tóm tắt mới nhất của Gemini.
  convos: _convosInit.list,            // [{id,title,createdAt,updatedAt,messages:[...],summary}]
  activeConvoId: _convosInit.active,   // id đoạn chat đang mở
  historyAll: false,                   // lịch sử hội thoại: hiện tất cả hay chỉ 5 mới nhất
};

const elMain = document.getElementById('main');
const elNav = document.getElementById('side-nav');
const elToast = document.getElementById('toast-wrap');

/* ============================================================
   Toast
   ============================================================ */

function toast(message, gold) {
  const div = document.createElement('div');
  div.className = 'toast' + (gold ? ' gold' : '');
  div.textContent = message;
  elToast.appendChild(div);
  setTimeout(() => div.remove(), 3200);
}

/* ============================================================
   Render nav sidebar
   ============================================================ */

function renderNav() {
  elNav.innerHTML = NAV_ITEMS.map((item) => `
    <button class="nav-item ${ui.activeNav === item.id ? 'active' : ''}" data-action="nav" data-view="${item.id}">
      ${item.icon}<span>${esc(item.label)}</span>
    </button>
  `).join('');
}

/* ============================================================
   Pill trạng thái + chip loại dự án
   ============================================================ */

function pill(status, withIcon) {
  if (status === APPLY.YES) return `<span class="pill pill-apply">${withIcon ? ICONS.check : ''}Áp dụng</span>`;
  if (status === APPLY.UNKNOWN) return `<span class="pill pill-unknown">${withIcon ? ICONS.question : ''}Chưa xác định</span>`;
  return `<span class="pill pill-na">${withIcon ? ICONS.x : ''}Không áp dụng</span>`;
}

const TYPE_ICONS = {
  noxa: ICONS.building,
  nthuongmai: ICONS.chart,
  khudothi: ICONS.fileText,
  khucongnghiep: ICONS.factory,
  hatang: ICONS.bank,
  chung: ICONS.helpCircle,
};

function typeChip(type, small) {
  const icon = TYPE_ICONS[type.id] || ICONS.helpCircle;
  return `<span class="chip-type tone-${type.tone}${small ? ' small' : ''}">
    ${icon}
    ${esc(type.label)}
  </span>`;
}

function stageToneClass(idx) { return `tone-ic-${(idx % 8) + 1}`; }

/* ============================================================
   Màn Trợ lý AI (assistant)
   ============================================================ */

function ask(query, typeId) {
  const type = typeId ? D.typeById(typeId) : D.identifyType(query);
  const profile = S.getSurvey();
  const result = D.suggest(type, profile);
  ui.result = result;
  ui.query = query || '';
  ui.filter = 'all';
  ui.search = '';
  ui.detailStageId = null;
  ui.modalSummary = false;
  ui.aiAnswer = { status: 'loading' };
  // Bảng quy trình giờ do LLM đề xuất: hiện trạng thái đang phân tích, fallback về quy tắc khi lỗi
  ui.proposal = { status: 'loading', first: true };
  render();
  requestAIAnalysis();
  requestProposal();
}

/* Chuyển đổi giữa dạng lưu trữ thuần JSON và đối tượng runtime của kết quả tư vấn.
   Snapshot giữ lại toàn bộ trạng thái đã phân tích (map trạng thái từng node + các giai đoạn
   kèm mô tả/ghi chú AI) để nút "Xem lại" dựng lại đúng màn hình cũ mà không phải gọi lại Gemini. */
function plainStages(stages) {
  return stages.map((st) => ({
    nodeId: st.node.id,
    status: st.status,
    desc: st.desc,
    duration: st.duration,
    beginner: st.beginner || '',
    note: st.note || '',
    aiProposed: !!st.aiProposed,
  }));
}

function reviveStages(list) {
  return (list || [])
    .map((s) => Object.assign({}, s, { node: D.NODE_BY_ID.get(s.nodeId) }))
    .filter((s) => s.node);
}

function makeSnapshot(result) {
  const map = {};
  result.map.forEach((v, k) => { map[k] = v; });
  return { map, stages: plainStages(result.stages), counts: result.counts, aiAnswer: null, proposal: null };
}

function statusLabel(status) {
  if (status === APPLY.YES) return 'Áp dụng';
  if (status === APPLY.UNKNOWN) return 'Chưa xác định';
  return 'Không áp dụng';
}

function summaryText(result, beginner) {
  if (!result) return '';
  const type = D.typeById(result.typeId);
  const lines = [];
  lines.push(`Gợi ý quy trình đầu tư: ${type.label}`);
  lines.push(beginner && type.beginnerIntro ? type.beginnerIntro : type.intro);
  lines.push('');
  result.stages.forEach((st, i) => {
    lines.push(`${i + 1}. ${st.node.name} — ${statusLabel(st.status)} (${st.duration})`);
    if (beginner && st.beginner) lines.push(`   Giải thích: ${st.beginner}`);
  });
  lines.push('');
  lines.push(`Thống kê: Áp dụng ${result.counts.apply}, Chưa xác định ${result.counts.unknown}, Không áp dụng ${result.counts.na} (tổng ${result.counts.total}).`);
  lines.push('Lưu ý: trạng thái dựa trên thông tin bạn cung cấp; thiếu thông tin sẽ hiển thị "Chưa xác định".');
  return lines.join('\n');
}

async function copySummary() {
  const text = summaryText(ui.result, ui.beginner);
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast('Đã sao chép tóm tắt vào clipboard', true);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast('Đã sao chép tóm tắt (fallback)', true);
  }
}

/* ============================================================
   Trợ lý AI nâng cao (LLM qua /api/ask — Gemini miễn phí)
   - Server gọi model từ biến môi trường GEMINI_API_KEY. Thiếu khóa -> 503, UI hiện note cấu hình.
   - Phân tích bằng ngôn ngữ tự nhiên dựa trên ngữ cảnh đã tính sẵn; bảng quy trình do /api/propose đề xuất.
   ============================================================ */

function buildAIContext(result) {
  const type = D.typeById(result.typeId);
  const lines = [`Loại dự án: ${type.label}`, type.intro, ''];
  result.stages.forEach((st, i) => {
    lines.push(`${i + 1}. ${st.node.name} [${statusLabel(st.status)}] (${st.duration}): ${st.desc}`);
  });
  lines.push('');
  lines.push(`Thống kê: áp dụng ${result.counts.apply}, chưa xác định ${result.counts.unknown}, không áp dụng ${result.counts.na} (tổng ${result.counts.total}).`);
  return lines.join('\n');
}

function formatAIText(text) {
  return esc(text)
    .replace(/^[•\-*]\s*/gm, '• ')
    .replace(/\n/g, '<br>');
}

function aiAnswerHTML() {
  const a = ui.aiAnswer;
  if (!a) return '';
  if (a.status === 'loading') {
    return `<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> Trợ lý AI đang phân tích câu hỏi...</div>`;
  }
  if (a.status === 'nokey') {
    return `<div class="ai-note">Trợ lý AI nâng cao chưa bật: máy chủ thiếu khóa <code>GEMINI_API_KEY</code> (thêm trong Railway → Variables). Bảng kết quả theo quy tắc bên dưới vẫn đầy đủ.</div>`;
  }
  if (a.status === 'rate') {
    return `<div class="ai-note">Trợ lý AI nâng cao đang quá tải (gói miễn phí giới hạn lượt gọi). Thử lại sau ít phút — kết quả quy tắc bên dưới vẫn chính xác.</div>`;
  }
  if (a.status === 'error') {
    const detail = a.detail ? ` — chi tiết: ${esc(a.detail)}` : '';
    return `<div class="ai-note">Trợ lý AI nâng cao tạm thời không khả dụng${detail}. Kết quả quy tắc bên dưới vẫn đầy đủ.</div>`;
  }
  return `<div class="ai-text">${formatAIText(a.text)}</div>
    <div class="ai-foot">Trợ lý AI (Gemini) — nội dung mang tính tham khảo, đối chiếu bảng chi tiết bên dưới.</div>`;
}

let aiSeq = 0;
async function requestAIAnalysis() {
  const seq = ++aiSeq;
  const result = ui.result;
  if (!result) return;
  const question = ui.query || `Quy trình đầu tư ${D.typeById(result.typeId).label}`;
  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context: buildAIContext(result) }),
    });
    if (seq !== aiSeq) return;
    if (res.status === 503) ui.aiAnswer = { status: 'nokey' };
    else if (res.status === 429) ui.aiAnswer = { status: 'rate' };
    else if (!res.ok) {
      let detail = '';
      try { const d = await res.json(); detail = d && d.detail ? String(d.detail) : ''; } catch (e) { /* bỏ qua */ }
      if (seq !== aiSeq) return;
      ui.aiAnswer = { status: 'error', detail };
    }
    else {
      const data = await res.json();
      if (seq !== aiSeq) return;
      ui.aiAnswer = data && data.answer ? { status: 'ok', text: data.answer } : { status: 'error' };
    }
  } catch (e) {
    if (seq !== aiSeq) return;
    ui.aiAnswer = { status: 'error' };
  }
  // Patch trực tiếp vào card để không làm mất focus khi người dùng đang thao tác ở màn khác
  const body = document.querySelector('.ai-answer-body');
  if (body) body.innerHTML = aiAnswerHTML();
}

/* ============================================================
   Đề xuất bảng quy trình bằng LLM (/api/propose)
   - Bảng hiển thị là kết quả Gemini trả về (status + mô tả + ghi chú cho từng giai đoạn).
   - Engine quy tắc vẫn chạy để dựng ngữ cảnh và làm phương án dự phòng khi AI lỗi.
   - Quy tắc ba mức được giữ: thiếu dữ liệu -> "unknown", chỉ "na" khi ngữ cảnh ghi rõ.
   ============================================================ */

function buildProposalContext(result) {
  const type = D.typeById(result.typeId);
  const profile = S.getSurvey();
  const lines = [`Loại dự án: ${type.label}`, type.intro, ''];
  const answered = D.PROFILE_FIELDS.filter((f) => profile[f.id] && profile[f.id] !== 'chua_xac_dinh');
  lines.push('KHẢO SÁT NGƯỜI DÙNG:');
  if (answered.length) {
    answered.forEach((f) => {
      const opts = f.options || D.YESNO_OPTIONS;
      const label = (opts.find((o) => o.value === profile[f.id]) || {}).label || profile[f.id];
      lines.push(`- ${f.label}: ${label}`);
    });
  } else {
    lines.push('- (chưa trả lời câu nào)');
  }
  lines.push('');
  lines.push('CẤU TRÚC QUY TRÌNH (id, tên giai đoạn, thời lượng tham khảo, trạng thái tham khảo từ engine quy tắc, các nhóm bước chính):');
  result.stages.forEach((st, i) => {
    lines.push(`${i + 1}. id=${st.node.id} | ${st.node.name} | ${st.duration} | tham khảo: ${statusLabel(st.status)}`);
    st.node.children.forEach((g) => {
      const gi = result.map.get(g.id);
      lines.push(`   - ${g.name} [${statusLabel(gi ? gi.status : st.status)}]`);
    });
  });
  lines.push('');
  lines.push('Trả về JSON đúng định dạng đã yêu cầu, đủ 8 giai đoạn theo thứ tự id S01..S08.');
  return lines.join('\n');
}

function normStatus(raw) {
  const s = String(raw == null ? '' : raw).toLowerCase().trim();
  if (!s) return null;
  if (s.includes('khong') || s.includes('không') || /\bna\b/.test(s)) return APPLY.NO;
  if (s.includes('unknown') || s.includes('chưa') || s.includes('chua')) return APPLY.UNKNOWN;
  if (s.includes('apply') || s.includes('yes') || s.includes('áp dụng') || s.includes('ap dung')) return APPLY.YES;
  return null;
}

function parseProposal(text, result) {
  let t = String(text == null ? '' : text).trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  let obj = null;
  try { obj = JSON.parse(t); } catch (e) {
    const s = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (s >= 0 && end > s) {
      try { obj = JSON.parse(t.slice(s, end + 1)); } catch (e2) { /* bỏ qua */ }
    }
  }
  const arr = obj && Array.isArray(obj.stages) ? obj.stages : null;
  if (!arr) return null;
  const byId = new Map();
  arr.forEach((it) => { if (it && typeof it.id === 'string') byId.set(it.id.toUpperCase(), it); });
  let valid = 0;
  const merged = result.stages.map((st) => {
    const ai = byId.get(String(st.node.id).toUpperCase());
    const ns = ai ? normStatus(ai.status) : null;
    if (ns != null) valid++;
    const desc = ai && typeof ai.desc === 'string' && ai.desc.trim() ? ai.desc.trim() : st.desc;
    const note = ai && typeof ai.note === 'string' ? ai.note.trim() : '';
    return Object.assign({}, st, {
      status: ns != null ? ns : st.status,
      desc,
      note,
      aiProposed: ns != null,
    });
  });
  // Nếu AI trả thiếu/không khớp quá nửa số giai đoạn thì coi như hỏng, fallback toàn bộ
  if (valid < Math.ceil(result.stages.length / 2)) return null;
  return merged;
}

let propSeq = 0;
async function requestProposal() {
  const seq = ++propSeq;
  const result = ui.result;
  if (!result) return;
  let next;
  try {
    const res = await fetch('/api/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: buildProposalContext(result) }),
    });
    if (seq !== propSeq) return;
    if (res.status === 503) next = { status: 'fallback', reason: 'nokey' };
    else if (res.status === 429) next = { status: 'fallback', reason: 'rate' };
    else if (!res.ok) {
      let detail = '';
      try { const d = await res.json(); detail = d && d.detail ? String(d.detail) : ''; } catch (e) { /* bỏ qua */ }
      if (seq !== propSeq) return;
      next = { status: 'fallback', reason: 'error', detail };
    } else {
      const data = await res.json();
      if (seq !== propSeq) return;
      const merged = parseProposal(data && data.answer, result);
      next = merged ? { status: 'ok', stages: merged } : { status: 'fallback', reason: 'parse' };
    }
  } catch (e) {
    if (seq !== propSeq) return;
    next = { status: 'fallback', reason: 'error' };
  }
  ui.proposal = next;
  render();
}

/* ============================================================
   Gợi ý danh mục đầu tư (/api/portfolio)
   - So sánh các loại hình bằng số liệu THỰC từ engine quy tắc Hacom
     (số bước áp dụng/chưa xác định/không áp dụng + trạng thái từng giai đoạn).
   - Gemini xếp hạng ưu tiên dựa trên số liệu đó + khảo sát nhà đầu tư.
   - Khi AI lỗi/định dạng sai -> fallback theo engine quy tắc: ít bước "chưa xác
     định" hơn = thủ tục rõ ràng hơn -> ưu tiên. Mọi con số đều là dữ liệu thật,
     không bịa.
   ============================================================ */

function portfolioComparisons() {
  const profile = S.getSurvey();
  return D.PROJECT_TYPES.filter((t) => t.id !== 'chung').map((type) => ({ type, result: D.suggest(type, profile) }));
}

function buildPortfolioContext(comparisons) {
  const profile = S.getSurvey();
  const lines = ['DỮ LIỆU QUY TRÌNH THỰC CỦA TỪNG LOẠI HÌNH (tính từ engine quy tắc Hacom, không phải suy đoán):'];
  comparisons.forEach(({ type, result }) => {
    lines.push('');
    lines.push(`LOẠI HÌNH: ${type.label} (id=${type.id}) — ${type.intro}`);
    lines.push(`Tổng số bước: áp dụng ${result.counts.apply}, chưa xác định ${result.counts.unknown}, không áp dụng ${result.counts.na} (tổng ${result.counts.total}).`);
    result.stages.forEach((st, i) => {
      lines.push(`${i + 1}. ${st.node.name} | ${st.duration} | ${statusLabel(st.status)}`);
    });
  });
  lines.push('');
  const answered = D.PROFILE_FIELDS.filter((f) => profile[f.id] && profile[f.id] !== 'chua_xac_dinh');
  lines.push('KHẢO SÁT NHÀ ĐẦU TƯ:');
  if (answered.length) {
    answered.forEach((f) => {
      const opts = f.options || D.YESNO_OPTIONS;
      const label = (opts.find((o) => o.value === profile[f.id]) || {}).label || profile[f.id];
      lines.push(`- ${f.label}: ${label}`);
    });
  } else {
    lines.push('- (chưa trả lời câu nào — hãy điền khảo sát để gợi ý sát hơn)');
  }
  lines.push('');
  lines.push('Trả về JSON đúng định dạng đã yêu cầu, đủ 5 loại hình theo id.');
  return lines.join('\n');
}

function fallbackRanks(comparisons) {
  // Quy tắc: ít bước "chưa xác định" hơn = thủ tục rõ ràng hơn -> ưu tiên;
  // bằng nhau thì nhiều bước áp dụng hơn trước. Lý do sinh ra từ chính số liệu.
  const sorted = [...comparisons].sort((a, b) =>
    (a.result.counts.unknown - b.result.counts.unknown) || (b.result.counts.apply - a.result.counts.apply));
  return sorted.map((c, i) => ({
    id: c.type.id,
    rank: i + 1,
    reason: `Engine quy tắc: ${c.result.counts.unknown} bước chưa xác định, ${c.result.counts.apply} bước áp dụng — xếp theo mức độ rõ ràng của thủ tục.`,
  }));
}

function parsePortfolio(text, comparisons) {
  let t = String(text == null ? '' : text).trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  let obj = null;
  try { obj = JSON.parse(t); } catch (e) {
    const s = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (s >= 0 && end > s) {
      try { obj = JSON.parse(t.slice(s, end + 1)); } catch (e2) { /* bỏ qua */ }
    }
  }
  const arr = obj && Array.isArray(obj.ranks) ? obj.ranks : null;
  if (!arr) return null;
  const ids = comparisons.map((c) => c.type.id);
  const seen = new Set();
  const ranks = [];
  arr.forEach((it) => {
    if (!it || typeof it.id !== 'string') return;
    const id = it.id.toLowerCase();
    const rank = Number(it.rank);
    if (!ids.includes(id) || seen.has(id)) return;
    if (!Number.isInteger(rank) || rank < 1 || rank > ids.length) return;
    seen.add(id);
    ranks.push({ id, rank, reason: typeof it.reason === 'string' ? it.reason.trim() : '' });
  });
  if (ranks.length !== ids.length) return null;
  const rankSet = new Set(ranks.map((r) => r.rank));
  if (rankSet.size !== ids.length) return null;
  return ranks.sort((a, b) => a.rank - b.rank);
}

let portSeq = 0;
async function requestPortfolio() {
  const seq = ++portSeq;
  const comparisons = portfolioComparisons();
  ui.portfolio = { status: 'loading', comparisons };
  render();
  let next;
  try {
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: buildPortfolioContext(comparisons) }),
    });
    if (seq !== portSeq) return;
    if (res.status === 503) next = { status: 'fallback', reason: 'nokey' };
    else if (res.status === 429) next = { status: 'fallback', reason: 'rate' };
    else if (!res.ok) {
      let detail = '';
      try { const d = await res.json(); detail = d && d.detail ? String(d.detail) : ''; } catch (e) { /* bỏ qua */ }
      if (seq !== portSeq) return;
      next = { status: 'fallback', reason: 'error', detail };
    } else {
      const data = await res.json();
      if (seq !== portSeq) return;
      const ranks = parsePortfolio(data && data.answer, comparisons);
      next = ranks ? { status: 'ok', ranks } : { status: 'fallback', reason: 'parse' };
    }
  } catch (e) {
    if (seq !== portSeq) return;
    next = { status: 'fallback', reason: 'error' };
  }
  // AI lỗi/định dạng sai -> vẫn có kết quả nhờ xếp hạng theo engine quy tắc
  if (next.status === 'fallback') next.ranks = fallbackRanks(comparisons);
  ui.portfolio = Object.assign({ comparisons }, next);
  render();
}

function portfolioSourceHTML(p) {
  if (!p) return '';
  if (p.status === 'loading') {
    return `<div class="table-source src-loading">${ICONS.robot}<span>Trợ lý AI đang so sánh các loại hình và xếp hạng danh mục...</span></div>`;
  }
  if (p.status === 'ok') {
    return `<div class="table-source src-ai">${ICONS.robot}<span>Thứ tự ưu tiên do trợ lý AI (Gemini) đề xuất dựa trên dữ liệu quy trình thực và khảo sát của bạn.</span></div>`;
  }
  let reason;
  if (p.reason === 'nokey') reason = 'máy chủ thiếu khóa GEMINI_API_KEY';
  else if (p.reason === 'rate') reason = 'gói miễn phí đang quá tải (429)';
  else if (p.reason === 'parse') reason = 'kết quả AI trả về không đúng định dạng';
  else reason = 'lỗi kết nối' + (p.detail ? ` — ${esc(p.detail)}` : '');
  return `<div class="table-source src-rule">${ICONS.info}<span>Trợ lý AI chưa khả dụng (${reason}) — thứ tự bên dưới xếp theo engine quy tắc.</span></div>`;
}

function renderPortfolio() {
  let p = ui.portfolio;
  if (!p) {
    ui.portfolio = { status: 'loading' };
    requestPortfolio();
    p = ui.portfolio;
  }
  const comparisons = p.comparisons || portfolioComparisons();
  const ranks = p.ranks || [];
  const rankById = new Map(ranks.map((r) => [r.id, r]));

  // Sắp xếp bảng theo thứ tự AI đề xuất (nếu có), giữ nguyên thứ tự gốc khi chưa có
  const ordered = ranks.length
    ? [...comparisons].sort((a, b) => (rankById.get(a.type.id)?.rank ?? 99) - (rankById.get(b.type.id)?.rank ?? 99))
    : comparisons;

  const rows = ordered.map(({ type, result }) => {
    const rk = rankById.get(type.id);
    const rankCell = rk
      ? `<span class="pf-rank pf-rank-${Math.min(rk.rank, 3)}">${rk.rank}</span>`
      : '<span class="pf-rank pf-rank-x">—</span>';
    const dots = result.stages.map((st) => {
      const cls = st.status === APPLY.YES ? 'pdot-ok' : st.status === APPLY.UNKNOWN ? 'pdot-warn' : 'pdot-na';
      return `<span class="pdot ${cls}" title="${esc(st.node.name)} — ${statusLabel(st.status)} (${st.duration})"></span>`;
    }).join('');
    const reason = rk?.reason ? `<div class="pf-reason">${esc(rk.reason)}</div>` : '';
    return `
      <tr class="pf-row">
        <td class="pf-rank-cell">${rankCell}</td>
        <td>
          <div class="pf-type">${typeChip(type, true)}</div>
          <div class="pf-intro">${esc(type.intro)}</div>
          ${reason}
        </td>
        <td class="pf-num pf-num-ok">${result.counts.apply}</td>
        <td class="pf-num pf-num-warn">${result.counts.unknown}</td>
        <td class="pf-num pf-num-na">${result.counts.na}</td>
        <td><div class="pf-dots">${dots}</div></td>
      </tr>
    `;
  }).join('');

  const aiList = ranks.length ? `
    <ol class="pf-ai-list">
      ${ranks.map((r) => {
        const t = D.typeById(r.id);
        return `<li><span class="pf-ai-rank">${r.rank}</span><span class="chip-type tone-${t.tone} small">${esc(t.label)}</span><span class="pf-ai-reason">${esc(r.reason)}</span></li>`;
      }).join('')}
    </ol>
  ` : '';

  const loadingCard = p.status === 'loading' ? `
    <div class="card table-card">
      <div class="table-loading">
        <div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> Trợ lý AI đang so sánh các loại hình dự án...</div>
        <div class="ai-note" style="margin-top:10px">Bảng so sánh sẽ hiện ngay khi Gemini phản hồi; nếu AI lỗi, thứ tự theo engine quy tắc sẽ thay thế.</div>
      </div>
    </div>
  ` : `
    <div class="card table-card">
      ${portfolioSourceHTML(p)}
      <div class="table-wrap">
        <table class="proc-table pf-table">
          <thead>
            <tr>
              <th class="pf-th-rank">Ưu tiên</th>
              <th>Loại hình dự án</th>
              <th>Áp dụng</th>
              <th>Chưa xác định</th>
              <th>Không áp dụng</th>
              <th>8 giai đoạn</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="table-foot">
        <span class="pf-legend">
          <span class="pdot pdot-ok"></span> Áp dụng
          <span class="pdot pdot-warn"></span> Chưa xác định
          <span class="pdot pdot-na"></span> Không áp dụng
        </span>
      </div>
    </div>
  `;

  const aiCard = p.status === 'loading' ? '' : `
    <div class="card ai-answer">
      <div class="ai-answer-head">${ICONS.robot} Thứ tự ưu tiên đề xuất</div>
      <div class="ai-answer-body">${aiList}</div>
      <div class="ai-foot">Trợ lý AI (Gemini) — nội dung mang tính tham khảo, đối chiếu bảng số liệu thực bên dưới.</div>
    </div>
  `;

  return `
    <div class="page-head page-head-row">
      <div>
        <h1>Gợi ý danh mục đầu tư</h1>
        <p class="page-sub">So sánh các loại hình dự án bằng dữ liệu quy trình thực, rồi để AI gợi ý thứ tự ưu tiên cho bạn.</p>
      </div>
      <button class="btn btn-primary btn-sm" data-action="run-portfolio">${ICONS.robot} Phân tích lại</button>
    </div>
    <div class="content-grid">
      <div class="content-main">
        ${aiCard}
        ${loadingCard}
      </div>
      <aside class="content-side">
        <div class="note-card note-blue">
          <div class="note-title">${ICONS.info} Dữ liệu thật</div>
          <div>Các con số trong bảng được tính trực tiếp từ engine quy tắc Hacom cho từng loại hình — không phải suy đoán. Cột "8 giai đoạn" hiển thị trạng thái từng bước.</div>
        </div>
        <div class="note-card note-yellow">
          <div class="note-title">${ICONS.lightbulb} Làm gợi ý sát hơn</div>
          <div>Trả lời khảo sát nhanh rồi nhấn "Phân tích lại" để AI cân nhắc điều kiện cụ thể của bạn (hình thức đầu tư, giải phóng mặt bằng, PCCC...).</div>
          <button class="btn btn-outline btn-sm" style="margin-top:10px" data-action="nav-survey">Đi tới Khảo sát</button>
        </div>
      </aside>
    </div>
  `;
}

function displayResult(result) {
  if (ui.proposal && ui.proposal.status === 'ok') {
    return Object.assign({}, result, { stages: ui.proposal.stages });
  }
  return result;
}

function tableSourceHTML() {
  const p = ui.proposal;
  if (!p) return '';
  if (p.status === 'loading') {
    return `<div class="table-source src-loading">${ICONS.robot}<span>Trợ lý AI đang phân tích và đề xuất quy trình...</span></div>`;
  }
  if (p.status === 'ok') {
    return `<div class="table-source src-ai">${ICONS.robot}<span>Bảng quy trình do trợ lý AI (Gemini) đề xuất dựa trên dữ liệu Hacom và khảo sát của bạn.</span></div>`;
  }
  let reason;
  if (p.reason === 'nokey') reason = 'máy chủ thiếu khóa GEMINI_API_KEY';
  else if (p.reason === 'rate') reason = 'gói miễn phí đang quá tải (429)';
  else if (p.reason === 'parse') reason = 'kết quả AI trả về không đúng định dạng';
  else reason = 'lỗi kết nối' + (p.detail ? ` — ${esc(p.detail)}` : '');
  return `<div class="table-source src-rule">${ICONS.info}<span>Trợ lý AI chưa khả dụng (${reason}) — hiển thị bảng theo engine quy tắc.</span></div>`;
}

function renderAssistant() {
  const result = ui.result;
  const type = result ? D.typeById(result.typeId) : null;
  const hasResult = !!result;
  const disp = hasResult ? displayResult(result) : null;
  const aiLoadingFirst = hasResult && ui.proposal && ui.proposal.status === 'loading' && ui.proposal.first;

  const statCards = hasResult ? `
    <div class="stat-grid">
      <div class="stat-card st-apply">
        <div class="stat-text"><span class="stat-label">Áp dụng</span><span class="stat-num">${disp.counts.apply}</span></div>
        <div class="stat-ic">${ICONS.checkSquare}</div>
      </div>
      <div class="stat-card st-unknown">
        <div class="stat-text"><span class="stat-label">Chưa xác định</span><span class="stat-num">${disp.counts.unknown}</span></div>
        <div class="stat-ic">${ICONS.helpCircle}</div>
      </div>
      <div class="stat-card st-na">
        <div class="stat-text"><span class="stat-label">Không áp dụng</span><span class="stat-num">${disp.counts.na}</span></div>
        <div class="stat-ic">${ICONS.xCircle}</div>
      </div>
      <div class="stat-card st-total">
        <div class="stat-text"><span class="stat-label">Tổng số mục</span><span class="stat-num">${disp.counts.total}</span></div>
        <div class="stat-ic">${ICONS.list}</div>
      </div>
    </div>
  ` : '';

  const resultCard = hasResult ? `
    <div class="card result-card">
      <div class="result-head">
        <h3>Kết quả gợi ý cho bạn</h3>
        ${typeChip(type, true)}
      </div>
      <p class="result-intro">${esc(ui.beginner && type.beginnerIntro ? type.beginnerIntro : type.intro)}</p>
      <div class="result-source">Nguồn: Cấu trúc quy trình đầu tư Hacom${ui.proposal && ui.proposal.status === 'ok' ? ' + phân tích trợ lý AI (Gemini)' : ''}</div>
      ${statCards}
    </div>
  ` : '';

  let tableCard;
  if (!hasResult) {
    tableCard = `
      <div class="empty">
        ${ICONS.lightbulb}
        <div class="empty-title">Hãy đặt câu hỏi hoặc chọn một loại dự án bên trên.</div>
        <div>AI sẽ phân tích và đề xuất quy trình phù hợp nhất.</div>
      </div>
    `;
  } else if (aiLoadingFirst) {
    tableCard = `
      <div class="card table-card">
        <div class="table-loading">
          <div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> Trợ lý AI đang phân tích và đề xuất quy trình đầu tư...</div>
          <div class="ai-note" style="margin-top:10px">Bảng sẽ hiện ngay khi Gemini phản hồi; nếu AI lỗi, bảng theo engine quy tắc sẽ thay thế.</div>
        </div>
      </div>
    `;
  } else {
    tableCard = renderTable(disp);
  }

  const aiCard = hasResult ? `
    <div class="card ai-answer">
      <div class="ai-answer-head">${ICONS.robot} Phân tích của trợ lý AI</div>
      <div class="ai-answer-body">${aiAnswerHTML()}</div>
    </div>
  ` : '';

  return `
    <div class="page-head page-head-row">
      <div>
        <h1>AI Assistant</h1>
        <p class="page-sub">Hỏi AI về quy trình đầu tư và nhận gợi ý chi tiết, chính xác</p>
      </div>
      <label class="switch-row" title="Giải thích dễ hiểu cho người mới bắt đầu">
        <input type="checkbox" data-action="toggle-beginner" ${ui.beginner ? 'checked' : ''}>
        <span class="switch-track"></span>
        <span class="switch-label">Chế độ người mới</span>
      </label>
    </div>
    <div class="content-grid">
      <div class="content-main">
        <div class="ask-card card">
          <div class="ask-input-row">
            <input class="ask-input" id="ask-input" placeholder="Bạn muốn tìm hiểu quy trình đầu tư loại dự án nào?" value="${esc(ui.query)}" data-action="ask-enter">
            <button class="btn btn-primary" data-action="ask-send">${ICONS.send} Gửi câu hỏi</button>
          </div>
          <div class="ask-example">Ví dụ: Quy trình đầu tư nhà ở xã hội là gì?</div>
        </div>
        <div class="quick-row">
          <div class="quick-label">Hoặc chọn nhanh loại dự án:</div>
          <div class="quick-chips">
            ${D.PROJECT_TYPES.slice(0, -1).map((t) => `
              <button class="chip-type tone-${t.tone}" data-action="ask-type" data-type="${t.id}">
                ${TYPE_ICONS[t.id] || ICONS.helpCircle}
                ${esc(t.label)}
              </button>
            `).join('')}
            <button class="chip-type tone-gray" data-action="ask-type" data-type="chung">
              ${ICONS.helpCircle}
              Chưa rõ loại dự án
            </button>
          </div>
        </div>
        ${resultCard}
        ${aiCard}
        ${tableCard}
      </div>
      <aside class="content-side">
        ${hasResult ? renderSideSummary(disp) : `
          <div class="note-card note-blue">
            <div class="note-title">${ICONS.info} Lưu ý</div>
            <div>Trạng thái dựa trên thông tin bạn cung cấp. Thiếu thông tin sẽ hiển thị "Chưa xác định". Bạn có thể trả lời khảo sát để làm rõ.</div>
          </div>
          <div class="note-card note-yellow">
            <div class="note-title">${ICONS.lightbulb} Gợi ý thêm</div>
            <div>Bạn có thể hỏi chi tiết về từng bước bằng cách nhấn "Xem chi tiết".</div>
          </div>
        `}
      </aside>
    </div>
    ${ui.modalSummary && hasResult ? renderModal(summaryText(result, ui.beginner)) : ''}
  `;
}

/* ============================================================
   Màn AI Assistant (ai-assistant) — chatbot tổng quát qua Gemini.
   - Với câu hỏi quy trình đầu tư: DỰA CHẶT ngữ cảnh tính sẵn, không bịa thủ tục.
   - Với câu hỏi xã giao/tổng quát: trả lời tự nhiên như chatbot thực.
   - Không đụng trạng thái của màn Trang chủ; tin nhắn lưu riêng ở localStorage.
   - Streaming SSE để giảm cảm giác chậm khi phản hồi dài.
   ============================================================ */

const CHAT_SUGGESTIONS = [
  'Quy trình đầu tư nhà ở thương mại là gì?',
  'Giai đoạn chuẩn bị đầu tư gồm những bước nào?',
  'Hồ sơ cần chuẩn bị ở bước thẩm định dự án?',
  'Thời gian thực hiện toàn bộ quy trình là bao lâu?',
  'Nhà đầu tư mới nên bắt đầu từ đâu để hạn chế rủi ro pháp lý?',
  'Các bước thường bị "chưa xác định" nhất là gì và vì sao?',
];

/** Ngữ cảnh cho một câu hỏi chat: nhận diện loại dự án từ câu hỏi, tính gợi ý quy trình cục bộ
 *  (không ghi vào ui.result), rồi dựng văn bản giống buildAIContext + khảo sát. */
function buildChatContext(question) {
  const profile = S.getSurvey();
  const type = D.identifyType(question || '');
  const result = D.suggest(type, profile);
  const lines = [`Loại dự án (nhận diện từ câu hỏi): ${type.label}`, type.intro, ''];
  result.stages.forEach((st, i) => {
    lines.push(`${i + 1}. ${st.node.name} [${statusLabel(st.status)}] (${st.duration}): ${st.desc}`);
  });
  lines.push('');
  lines.push(`Thống kê: áp dụng ${result.counts.apply}, chưa xác định ${result.counts.unknown}, không áp dụng ${result.counts.na} (tổng ${result.counts.total}).`);
  const answered = D.PROFILE_FIELDS.filter((f) => profile[f.id] && profile[f.id] !== 'chua_xac_dinh');
  if (answered.length) {
    lines.push('', 'KHẢO SÁT NHÀ ĐẦU TƯ:');
    answered.forEach((f) => {
      const opts = f.options || D.YESNO_OPTIONS;
      const label = (opts.find((o) => o.value === profile[f.id]) || {}).label || profile[f.id];
      lines.push(`- ${f.label}: ${label}`);
    });
  }
  return lines.join('\n');
}

/** Đọc loại dự án đang hiển thị ở sidebar chat. Ưu tiên convo.summary.typeId; nếu chưa có thì đoán từ tin nhắn người dùng gần nhất trong đoạn chat đang mở. */
function currentChatType() {
  const convo = activeConvo();
  if (convo && convo.summary && convo.summary.typeId) return D.typeById(convo.summary.typeId);
  if (convo && Array.isArray(convo.messages)) {
    for (let i = convo.messages.length - 1; i >= 0; i--) {
      if (convo.messages[i].role === 'user' && convo.messages[i].text) return D.identifyType(convo.messages[i].text);
    }
  }
  return D.typeById('chung');
}

function fmtChatTime(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }
  catch (e) { return ''; }
}

function donutSVG(counts) {
  const total = (counts.apply + counts.unknown + counts.na) || 1;
  const segs = [
    { val: counts.apply, color: 'var(--ok)' },
    { val: counts.unknown, color: 'var(--warn)' },
    { val: counts.na, color: 'var(--na)' },
  ];
  const R = 34, C = 2 * Math.PI * R;
  let acc = 0;
  let circles = '';
  segs.forEach((s) => {
    const frac = s.val / total;
    const dash = frac * C;
    const off = -acc * C;
    circles += `<circle cx="50" cy="50" r="${R}" fill="none" stroke="${s.color}" stroke-width="12" stroke-dasharray="${dash} ${C - dash}" stroke-dashoffset="${off}" />`;
    acc += frac;
  });
  return `<svg class="chat-donut" viewBox="0 0 100 100" width="100" height="100"><g transform="rotate(-90 50 50)">${circles}</g></svg>`;
}

/** Card kết quả: ưu tiên số liệu Gemini đã đính kèm [TOMTAT] (msg.counts) để khớp với Thống kê sidebar;
 *  nếu chưa có thì fallback về rule engine theo loại dự án. */
function chatResultCardHTML(typeId, counts) {
  const c = (counts && typeof counts.apply === 'number')
    ? { apply: counts.apply, unknown: counts.unknown, na: counts.na, total: counts.total || (counts.apply + counts.unknown + counts.na) }
    : D.suggest(D.typeById(typeId), S.getSurvey()).counts;
  return `
    <div class="chat-result-card" data-type="${esc(typeId)}">
      <div class="chat-result-title">Tóm tắt kết quả</div>
      <div class="chat-result-stats">
        <div class="cr-stat cr-stat-ok"><span class="cr-num cr-ok">${c.apply}</span><span class="cr-label">Áp dụng</span></div>
        <div class="cr-stat cr-stat-unknown"><span class="cr-num cr-unknown">${c.unknown}</span><span class="cr-label">Chưa xác định</span></div>
        <div class="cr-stat"><span class="cr-num">${c.na}</span><span class="cr-label">Không áp dụng</span></div>
        <div class="cr-stat"><span class="cr-num">${c.total}</span><span class="cr-label">Tổng số mục</span></div>
      </div>
      <div class="chat-result-actions">
        <button class="btn btn-outline-primary btn-sm" data-action="chat-open-process" data-type="${esc(typeId)}">Xem chi tiết quy trình ${ICONS.arrowRight}</button>
        <button class="btn btn-outline btn-sm" data-action="chat-summary-modal" data-type="${esc(typeId)}">${ICONS.file} Tóm tắt quy trình</button>
      </div>
    </div>
  `;
}

/** Card kết quả khi câu trả lời tập trung vào một giai đoạn cụ thể (theo [TOMTAT].stage). */
function chatStageCardHTML(typeId, stageId) {
  const type = D.typeById(typeId);
  const stage = D.STAGES.find((s) => s.id === stageId);
  if (!stage) return '';
  return `
    <div class="chat-stage-card" data-type="${esc(typeId)}" data-stage="${esc(stageId)}">
      <div class="chat-stage-title">Giai đoạn ${stage.stageIndex}: ${esc(stage.name)}</div>
      <div class="chat-stage-desc">Giai đoạn này gồm ${stage.children.length} bước chính.</div>
      <div class="chat-result-actions">
        <button class="btn btn-outline-primary btn-sm" data-action="chat-open-stage" data-type="${esc(typeId)}" data-stage="${esc(stageId)}">Xem chi tiết giai đoạn ${stage.stageIndex} ${ICONS.arrowRight}</button>
      </div>
    </div>
  `;
}

function chatBubbleHTML(msg) {
  const isUser = msg.role === 'user';
  const avatar = isUser
    ? `<div class="chat-avatar chat-avatar-user">${ICONS.user}</div>`
    : `<div class="chat-avatar chat-avatar-ai">${ICONS.robot}</div>`;
  const time = msg.at ? `<span class="chat-time">${fmtChatTime(msg.at)}</span>` : '';
  const read = isUser ? `<span class="chat-read">${ICONS.checks}</span>` : '';
  const foot = (time || read) ? `<div class="chat-foot ${isUser ? 'foot-user' : ''}">${time}${read}</div>` : '';

  if (isUser) {
    return `
      <div class="chat-msg user">
        <div class="chat-col">
          <div class="chat-bubble chat-bubble-user">${esc(msg.text)}</div>
          ${foot}
        </div>
        ${avatar}
      </div>`;
  }
  // AI variants
  if (msg.status === 'loading') {
    return `
      <div class="chat-msg ai">
        ${avatar}
        <div class="chat-col">
          <div class="chat-bubble chat-bubble-ai ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span></div>
        </div>
      </div>`;
  }
  if (msg.status === 'nokey') {
    return `
      <div class="chat-msg ai">
        ${avatar}
        <div class="chat-col">
          <div class="chat-bubble chat-bubble-ai ai-note">Trợ lý AI chưa bật: máy chủ thiếu <code>GEMINI_API_KEY</code>. Bạn vẫn có thể xem kết quả theo engine quy tắc ở màn Trang chủ.</div>
          ${foot}
        </div>
      </div>`;
  }
  if (msg.status === 'rate') {
    return `
      <div class="chat-msg ai">
        ${avatar}
        <div class="chat-col">
          <div class="chat-bubble chat-bubble-ai ai-note">Trợ lý AI đang quá tải (gói miễn phí giới hạn lượt gọi). Thử lại sau ít phút.</div>
          ${foot}
        </div>
      </div>`;
  }
  if (msg.status === 'error') {
    const detail = msg.detail ? ` — chi tiết: ${esc(msg.detail)}` : '';
    return `
      <div class="chat-msg ai">
        ${avatar}
        <div class="chat-col">
          <div class="chat-bubble chat-bubble-ai ai-note">Trợ lý AI tạm thời không phản hồi${detail}. Hãy thử lại.</div>
          ${foot}
        </div>
      </div>`;
  }
  // ok
  let resultCard = '';
  if (msg.stage) {
    resultCard = chatStageCardHTML(msg.typeId || 'chung', msg.stage);
  } else if (msg.typeId && msg.typeId !== 'chung') {
    // Ưu tiên số liệu gắn liền tin nhắn này; nếu là tin cũ chưa lưu counts thì mượn summary của đoạn chat
    // khi cùng loại dự án để card khớp với Thống kê sidebar.
    const convo = activeConvo();
    const s = convo && convo.summary;
    const counts = msg.counts || (s && s.typeId === msg.typeId ? s : null);
    resultCard = chatResultCardHTML(msg.typeId, counts);
  }
  return `
    <div class="chat-msg ai">
      ${avatar}
      <div class="chat-col">
        <div class="chat-bubble chat-bubble-ai">
          <div class="ai-text">${formatAIText(msg.text)}</div>
          ${resultCard}
        </div>
        ${foot}
      </div>
    </div>`;
}

/** Nhãn thời gian cho mục lịch sử hội thoại: hôm nay -> giờ, hôm qua, hoặc ngày dd/mm/yyyy. */
function fmtConvoTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const today = new Date();
    const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(d, today)) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (sameDay(d, yesterday)) return 'Hôm qua';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  } catch (e) { return ''; }
}

/** Nhóm các đoạn chat theo ngày (hôm nay / hôm qua / ngày cụ thể), sắp xếp mới nhất trước. */
function groupConvosByDay(list) {
  const sorted = list.slice().sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const dayKey = (iso) => {
    const d = new Date(iso || 0);
    const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (same(d, today)) return 'today';
    if (same(d, yesterday)) return 'yesterday';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const labelOf = (key) => {
    if (key === 'today') return 'Hôm nay';
    if (key === 'yesterday') return 'Hôm qua';
    const parts = key.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };
  const groups = [];
  let lastKey = null;
  sorted.forEach((c) => {
    const key = dayKey(c.updatedAt);
    if (key !== lastKey) { groups.push({ type: 'header', label: labelOf(key) }); lastKey = key; }
    groups.push({ type: 'item', convo: c });
  });
  return groups;
}

/** Danh sách lịch sử hội thoại trong sidebar phải: tiêu đề nhóm + mục có icon/tiêu đề/thời gian. */
function renderConvoList() {
  const list = ui.convos || [];
  if (!list.length) return `<div class="convo-empty">Chưa có đoạn chat nào.</div>`;
  const groups = groupConvosByDay(list);
  const shownGroups = ui.historyAll ? groups : groups.slice(0, 5 + groups.filter((g) => g.type === 'header').length > 5 ? groups : groups.slice(0, Math.max(5, 6)));
  // Khi thu gọn: lấy tối đa 5 mục item đầu tiên (kèm các header đi kèm chúng)
  let rendered;
  if (ui.historyAll) {
    rendered = groups;
  } else {
    rendered = [];
    let itemCount = 0;
    for (const g of groups) {
      if (g.type === 'item') { if (itemCount >= 5) break; itemCount++; }
      rendered.push(g);
    }
  }
  return rendered.map((g) => {
    if (g.type === 'header') return `<div class="convo-group-label">${esc(g.label)}</div>`;
    const c = g.convo;
    const active = c.id === ui.activeConvoId ? ' active' : '';
    const title = esc(c.title || 'Đoạn chat mới');
    const time = fmtConvoTime(c.updatedAt);
    return `<button class="convo-item${active}" data-action="convo-open" data-id="${esc(c.id)}"><span class="convo-icon">${ICONS.chat}</span><span class="convo-title">${title}</span><span class="convo-time">${time}</span></button>`;
  }).join('');
}

function renderChatSide() {
  const convo = activeConvo();
  const summary = convo && convo.summary;
  // Nếu Gemini đã đính kèm [TOMTAT] thì dùng số liệu từ đó (đã phản ánh đúng ngữ cảnh câu hỏi);
  // ngược lại fallback về rule engine với loại dự án đoán được.
  const type = currentChatType();
  let counts;
  if (summary && typeof summary.apply === 'number' && typeof summary.unknown === 'number' && typeof summary.na === 'number') {
    counts = { apply: summary.apply, unknown: summary.unknown, na: summary.na, total: summary.total || (summary.apply + summary.unknown + summary.na) };
  } else {
    const result = D.suggest(type, S.getSurvey());
    counts = result.counts;
  }
  const total = counts.total || 1;
  const pctApply = Math.round(counts.apply / total * 1000) / 10;
  const pctUnknown = Math.round(counts.unknown / total * 1000) / 10;
  const pctNa = Math.round(counts.na / total * 1000) / 10;
  const updated = summary && summary.at
    ? new Date(summary.at).toLocaleDateString('vi-VN')
    : new Date().toLocaleDateString('vi-VN');
  const sourceNote = summary ? 'Nguồn: AI tóm tắt từ đoạn chat' : 'Nguồn: Cấu trúc quy trình đầu tư Hacom';
  const allLink = (ui.convos || []).length > 5
    ? `<button class="convo-view-all" data-action="chat-toggle-history">${ui.historyAll ? 'Thu gọn' : 'Xem tất cả'} ${ICONS.arrowRight || ICONS.chevronRight}</button>`
    : '';
  return `
    <div class="card chat-side-card">
      <div class="chat-side-head-row">
        <div class="chat-side-title">Lịch sử hội thoại</div>
        ${allLink}
      </div>
      <div class="convo-list">
        ${renderConvoList()}
      </div>
    </div>
    <div class="card chat-side-card">
      <div class="chat-side-title">Ngữ cảnh hiện tại</div>
      <div class="chat-side-row"><span class="chat-side-key">Loại dự án:</span>${typeChip(type, true)}</div>
      <div class="chat-side-meta">${sourceNote}</div>
      <div class="chat-side-meta">Cập nhật: ${updated}</div>
    </div>
    <div class="card chat-side-card">
      <div class="chat-side-title">Thống kê trạng thái</div>
      <div class="chat-donut-row">
        ${donutSVG(counts)}
        <div class="chat-legend">
          <div class="chat-legend-row"><span class="lg-dot lg-apply"></span>Áp dụng (${counts.apply})<span class="lg-pct">${pctApply}%</span></div>
          <div class="chat-legend-row"><span class="lg-dot lg-unknown"></span>Chưa xác định (${counts.unknown})<span class="lg-pct">${pctUnknown}%</span></div>
          <div class="chat-legend-row"><span class="lg-dot lg-na"></span>Không áp dụng (${counts.na})<span class="lg-pct">${pctNa}%</span></div>
        </div>
      </div>
      <div class="chat-side-meta">Tổng số mục: ${counts.total}</div>
    </div>
    <div class="card chat-side-card chat-note-card">
      <div class="chat-side-title">${ICONS.lightbulb} Lưu ý</div>
      <div class="chat-note-text">Thiếu thông tin sẽ hiển thị trạng thái "Chưa xác định". AI không tự suy diễn thành "Không áp dụng".</div>
    </div>
  `;
}

function renderChat() {
  const convo = ensureActiveConvo();
  const messages = (convo && convo.messages) || [];
  const empty = messages.length <= 1; // chỉ còn tin chào
  const bubbles = messages.map(chatBubbleHTML).join('');
  const chips = CHAT_SUGGESTIONS.map((q) => `<button class="chat-chip" data-action="chat-chip" data-q="${esc(q)}">${esc(q)}</button>`).join('');
  return `
    <div class="page-head">
      <h1>AI Assistant</h1>
      <p class="page-sub">Hỏi AI về quy trình đầu tư, nhận gợi ý chi tiết và chính xác</p>
    </div>
    <div class="content-grid">
      <div class="content-main">
        <div class="card chat-card">
          <div class="chat-head">
            <button class="btn btn-outline-primary btn-sm" data-action="convo-new">${ICONS.plusSquare} Đoạn chat mới</button>
            <button class="chat-clear-icon" data-action="chat-clear" ${empty ? 'disabled' : ''} title="Xóa đoạn chat này" aria-label="Xóa đoạn chat này">${ICONS.trash}</button>
          </div>
          <div class="chat-box" id="chat-box">
            ${bubbles}
          </div>
          <div class="chat-composer">
            <div class="chat-chips-wrap">
              <div class="chat-chips-label">Gợi ý câu hỏi khác:</div>
              <div class="chat-chips-row">${chips}</div>
            </div>
            <div class="chat-composer-row">
              <input class="chat-input" id="chat-input" placeholder="Nhập câu hỏi của bạn..." autocomplete="off" data-action="chat-input">
              <button class="chat-send-btn" data-action="chat-send" aria-label="Gửi">${ICONS.send}</button>
            </div>
            <div class="chat-disclaimer">AI có thể mắc sai sót. Hãy tham khảo thêm trước khi quyết định.</div>
          </div>
        </div>
      </div>
      <aside class="content-side">
        ${renderChatSide()}
      </aside>
    </div>
    ${ui.modalSummary && ui.result ? renderModal(summaryText(ui.result, ui.beginner)) : ''}
  `;
}

function chatScrollBottom() {
  const box = document.getElementById('chat-box');
  if (box) box.scrollTop = box.scrollHeight;
}

function renderChatSideInto() {
  const aside = elMain.querySelector('.content-side');
  if (aside) aside.innerHTML = renderChatSide();
}

async function streamChatText(res, loadingBubble) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const obj = JSON.parse(payload);
        const part = obj.candidates && obj.candidates[0] && obj.candidates[0].content
          && obj.candidates[0].content.parts && obj.candidates[0].content.parts[0];
        const t = part && typeof part.text === 'string' ? part.text : '';
        if (t) {
          full += t;
          if (loadingBubble) {
            loadingBubble.classList.remove('ai-loading');
            // Ẩn dòng [TOMTAT]...[/TOMTAT] khỏi bản xem trước đang stream để tránh nháy trên màn hình
            const visible = full.replace(/\[TOMTAT\][\s\S]*$/, '');
            loadingBubble.innerHTML = `<div class="ai-text">${formatAIText(visible)}</div>`;
            chatScrollBottom();
          }
        }
      } catch (e) { /* dòng không phải JSON -> bỏ qua */ }
    }
  }
  return full;
}

/** Gemini đính kèm đúng một dòng máy đọc ở cuối mỗi câu trả lời: [TOMTAT]{json}[/TOMTAT].
    Hàm này tách dòng đó ra khỏi văn bản hiển thị và trả về summary (hoặc null nếu không có/không hợp lệ). */
function parseTomtat(full) {
  const raw = String(full || '');
  const m = raw.match(/\[TOMTAT\]\s*(\{[\s\S]*?\})\s*\[\/TOMTAT\]/);
  if (!m) return { text: raw, summary: null };
  let summary = null;
  try {
    const o = JSON.parse(m[1]);
    // Chỉ chấp nhận type id hợp lệ theo D.typeById; ngoài ra coi là "chung"
    const guessed = D.typeById(o && o.type);
    const typeId = (guessed && guessed.id === o.type) ? o.type : 'chung';
    const num = (v) => (typeof v === 'number' && isFinite(v) && v >= 0) ? Math.round(v) : 0;
    const stageRaw = typeof o.stage === 'string' ? o.stage.trim() : '';
    const stageValid = D.STAGES.some((s) => s.id === stageRaw);
    summary = {
      typeId,
      apply: num(o.apply),
      unknown: num(o.unknown),
      na: num(o.na),
      total: num(o.total),
      stage: stageValid ? stageRaw : '',
      at: new Date().toISOString(),
    };
  } catch (e) { summary = null; }
  const text = raw.replace(m[0], '').replace(/\s+$/, '');
  return { text, summary };
}

let chatSeq = 0;
async function sendChat(text) {
  const q = String(text || '').trim();
  if (!q) return;
  const seq = ++chatSeq;
  const convo = ensureActiveConvo();
  const convoId = convo.id;
  const nowIso = new Date().toISOString();
  convo.messages.push({ role: 'user', text: q, at: nowIso });
  if (convo.messages.length > MAX_CHAT_MSG) convo.messages = convo.messages.slice(-MAX_CHAT_MSG);
  if (!convo.title || convo.title === 'Đoạn chat mới') convo.title = convoTitleFrom(q);
  convo.updatedAt = nowIso;
  saveConvos();
  renderChatSideInto();
  const box = document.getElementById('chat-box');
  if (box) {
    box.insertAdjacentHTML('beforeend', chatBubbleHTML({ role: 'user', text: q, at: nowIso }));
    box.insertAdjacentHTML('beforeend', chatBubbleHTML({ role: 'ai', status: 'loading' }));
    chatScrollBottom();
  }
  const loadingBubble = box ? box.querySelector('.chat-msg.ai:last-child .chat-bubble') : null;
  let next;
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, context: buildChatContext(q) }),
    });
    if (seq !== chatSeq) return;
    if (res.status === 503) next = { role: 'ai', status: 'nokey', text: '' };
    else if (res.status === 429) next = { role: 'ai', status: 'rate', text: '' };
    else if (!res.ok) {
      let detail = '';
      try { const d = await res.json(); detail = d && d.detail ? String(d.detail) : ''; } catch (e) {}
      if (seq !== chatSeq) return;
      next = { role: 'ai', status: 'error', text: '', detail };
    } else {
      const streamed = await streamChatText(res, loadingBubble);
      if (seq !== chatSeq) return;
      next = streamed ? { role: 'ai', status: 'ok', text: streamed } : { role: 'ai', status: 'error', text: '' };
    }
  } catch (e) {
    if (seq !== chatSeq) return;
    next = { role: 'ai', status: 'error', text: '' };
  }
  // Tìm lại đoạn chat gốc (người dùng có thể đã chuyển sang đoạn khác trong lúc chờ)
  const target = ui.convos.find((c) => c.id === convoId);
  if (!target) return;
  next.at = new Date().toISOString();
  if (next.status === 'ok') {
    const parsed = parseTomtat(next.text);
    next.text = parsed.text;
    if (parsed.summary) {
      target.summary = parsed.summary;
      next.typeId = parsed.summary.typeId;
      next.stage = parsed.summary.stage || '';
      if (typeof parsed.summary.apply === 'number') {
        next.counts = {
          apply: parsed.summary.apply,
          unknown: parsed.summary.unknown,
          na: parsed.summary.na,
          total: parsed.summary.total || (parsed.summary.apply + parsed.summary.unknown + parsed.summary.na),
        };
      }
    } else {
      next.typeId = D.identifyType(q).id;
    }
  } else {
    next.typeId = D.identifyType(q).id;
  }
  target.messages.push(next);
  if (target.messages.length > MAX_CHAT_MSG) target.messages = target.messages.slice(-MAX_CHAT_MSG);
  target.updatedAt = next.at;
  saveConvos();
  if (loadingBubble && loadingBubble.closest('.chat-msg')) {
    loadingBubble.closest('.chat-msg').outerHTML = chatBubbleHTML(next);
    chatScrollBottom();
    renderChatSideInto();
  } else if (ui.view === 'chat') {
    render();
  }
  renderChatSideInto();
}

function clearConvo() {
  const convo = activeConvo();
  if (!convo) return;
  chatSeq++;
  convo.messages = [{ role: 'ai', text: WELCOME_TEXT, at: new Date().toISOString() }];
  convo.summary = null;
  convo.updatedAt = new Date().toISOString();
  convo.title = 'Đoạn chat mới';
  saveConvos();
  render();
  toast('Đã xóa đoạn chat này.');
}

function renderTable(result) {
  const stages = filterStages(result.stages, ui.filter, ui.search);
  const rows = stages.length ? stages.map((st, i) => {
    const idx = D.STAGES.findIndex((s) => s.id === st.node.id);
    const tone = stageToneClass(idx);
    const beginnerInline = ui.beginner && st.beginner ? `<div class="beginner-inline">${esc(st.beginner)}</div>` : '';
    const aiNote = st.note ? `<div class="stage-ai-note">${ICONS.lightbulb} ${esc(st.note)}</div>` : '';
    return `
      <tr class="stage-row">
        <td>
          <div class="stage-cell">
            <div class="stage-ic ${tone}">${STAGE_ICONS[idx] || ''}</div>
            <div>
              <div class="stage-title">${idx + 1}. ${esc(st.node.name)}</div>
              ${beginnerInline}
            </div>
          </div>
        </td>
        <td class="stage-desc-cell">${esc(st.desc)}${aiNote}</td>
        <td>${pill(st.status, false)}</td>
        <td><button class="detail-link" data-action="open-detail" data-stage="${st.node.id}">Xem chi tiết &rsaquo;</button></td>
      </tr>
    `;
  }).join('') : `<tr><td colspan="4" class="empty">Không có giai đoạn phù hợp với bộ lọc hiện tại.</td></tr>`;

  const countAll = result.stages.length;
  const countApply = result.stages.filter((s) => s.status === APPLY.YES).length;
  const countUnknown = result.stages.filter((s) => s.status === APPLY.UNKNOWN).length;
  const countNa = result.stages.filter((s) => s.status === APPLY.NO).length;

  return `
    <div class="card table-card">
      ${tableSourceHTML()}
      <div class="toolbar">
        <div class="filter-chips">
          <button class="filter-chip ${ui.filter === 'all' ? 'active' : ''}" data-action="filter" data-value="all">Tất cả (${countAll})</button>
          <button class="filter-chip ${ui.filter === 'apply' ? 'active' : ''}" data-action="filter" data-value="apply"><span class="dot dot-ok"></span>Áp dụng (${countApply})</button>
          <button class="filter-chip ${ui.filter === 'unknown' ? 'active' : ''}" data-action="filter" data-value="unknown"><span class="dot dot-warn"></span>Chưa xác định (${countUnknown})</button>
          <button class="filter-chip ${ui.filter === 'na' ? 'active' : ''}" data-action="filter" data-value="na"><span class="dot dot-na"></span>Không áp dụng (${countNa})</button>
        </div>
        <div class="search-box">
          <input placeholder="Tìm kiếm trong quy trình..." value="${esc(ui.search)}" data-action="search-table">
          ${ICONS.search}
        </div>
      </div>
      <div class="table-wrap">
        <table class="proc-table">
          <thead>
            <tr>
              <th>Giai đoạn / Bước chính</th>
              <th>Mô tả ngắn</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="table-foot">
        <button class="btn btn-outline-warn btn-sm" data-action="view-unknown">Xem các mục chưa xác định (${result.counts.unknown})</button>
        <div class="table-foot-actions">
          <button class="btn btn-outline btn-sm" data-action="summary-modal">${ICONS.file} Tóm tắt quy trình</button>
          <button class="btn btn-outline btn-sm" data-action="copy-summary">${ICONS.copy} Copy tóm tắt</button>
          <button class="btn btn-outline btn-sm" data-action="print">${ICONS.printer} In</button>
        </div>
      </div>
    </div>
  `;
}

function filterStages(stages, filter, search) {
  let out = stages;
  if (filter === 'apply') out = out.filter((s) => s.status === APPLY.YES);
  else if (filter === 'unknown') out = out.filter((s) => s.status === APPLY.UNKNOWN);
  else if (filter === 'na') out = out.filter((s) => s.status === APPLY.NO);
  if (!search.trim()) return out;
  const q = normText(search);
  return out.filter((st) => {
    if (normText(st.node.name).includes(q)) return true;
    if (normText(st.desc || '').includes(q)) return true;
    // tìm trong con cháu
    let hit = false;
    const walk = (node) => {
      if (hit) return;
      if (normText(node.name).includes(q)) { hit = true; return; }
      node.children.forEach(walk);
    };
    st.node.children.forEach(walk);
    return hit;
  });
}

function renderSideSummary(result) {
  const items = result.stages.map((st, i) => {
    const cls = `tl-t${i + 1} ${st.status === APPLY.NO ? 'tl-na' : ''}`;
    const beginner = ui.beginner && st.beginner ? `<div class="tl-beginner">${esc(st.beginner)}</div>` : '';
    return `
      <div class="tl-item ${cls}">
        <div class="tl-num">${i + 1}</div>
        <div class="tl-body">
          <div class="tl-name">${esc(st.node.name)}</div>
          ${beginner}
        </div>
        <div class="tl-dur">${esc(st.duration)}</div>
      </div>
    `;
  }).join('');
  return `
    <div class="card side-summary">
      <h4>${ICONS.clipboard} Tóm tắt quy trình</h4>
      <p class="side-summary-intro">Tổng quan các giai đoạn theo loại dự án đã chọn.</p>
      <div class="timeline">${items}</div>
    </div>
    <div class="note-card note-blue">
      <div class="note-title">${ICONS.info} Lưu ý</div>
      <div>Trạng thái dựa trên thông tin bạn cung cấp. Thiếu thông tin sẽ hiển thị "Chưa xác định".</div>
    </div>
    <div class="note-card note-yellow">
      <div class="note-title">${ICONS.lightbulb} Gợi ý thêm</div>
      <div>Bạn có thể hỏi chi tiết về từng bước bằng cách nhấn "Xem chi tiết".</div>
    </div>
  `;
}

function renderModal(text) {
  return `
    <div class="modal-backdrop" data-action="close-modal-bg">
      <div class="modal" data-action="noop">
        <h3>Tóm tắt quy trình</h3>
        <pre>${esc(text)}</pre>
        <div class="modal-actions">
          <button class="btn btn-outline" data-action="close-modal">Đóng</button>
          <button class="btn btn-outline-primary" data-action="copy-summary">${ICONS.copy} Sao chép</button>
          <button class="btn btn-primary" data-action="print">${ICONS.printer} In</button>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   Màn chi tiết giai đoạn
   ============================================================ */

function renderDetail() {
  if (!ui.result || !ui.detailStageId) {
    ui.view = 'assistant';
    render();
    return '';
  }
  const result = ui.result;
  const stageNode = D.NODE_BY_ID.get(ui.detailStageId);
  if (!stageNode) {
    ui.view = 'assistant';
    render();
    return '';
  }
  const stageIdx = D.STAGES.findIndex((s) => s.id === ui.detailStageId);
  const meta = D.STAGE_META[ui.detailStageId] || {};
  const tone = stageToneClass(stageIdx);
  const stageStatus = result.stages.find((s) => s.node.id === ui.detailStageId)?.status || APPLY.YES;

  const docs = collectDocs(stageNode);
  const docListHtml = docs.length ? `
    <div class="card doc-card">
      <h4>${ICONS.folder} Tài liệu / Hồ sơ cần chuẩn bị</h4>
      <div class="doc-list">
        ${docs.map((d) => `
          <div class="doc-item">
            ${d.kind === 'output' ? ICONS.file : ICONS.folder}
            <span>${esc(d.name)}</span>
            <span class="kind-tag">${esc(D.KIND_LABEL[d.kind] || d.kind)}</span>
            <span class="doc-path">${esc(pathOf(d))}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `
    <div class="crumb">
      <button data-action="back-assistant">AI Assistant</button>
      <span> / Giai đoạn ${stageIdx + 1}: ${esc(stageNode.name)}</span>
    </div>
    <div class="content-grid">
      <div class="content-main">
        <div class="card detail-head">
          <div class="detail-head-row">
            <div class="stage-ic ${tone}">${STAGE_ICONS[stageIdx] || ''}</div>
            <div class="detail-head-text">
              <h2>${stageIdx + 1}. ${esc(stageNode.name)}</h2>
              <p>${esc(meta.desc || '')}</p>
              <div class="detail-head-meta">
                ${pill(stageStatus, false)}
                <span class="dur-chip">${esc(meta.duration || '')}</span>
              </div>
            </div>
          </div>
          ${ui.beginner && meta.beginner ? `<div class="beginner-note">${esc(meta.beginner)}</div>` : ''}
        </div>
        <div class="card">
          <h4>Các bước thuộc giai đoạn này</h4>
          <div class="item-list">
            ${renderChildren(stageNode.children, result.map, 0)}
          </div>
        </div>
        ${docListHtml}
      </div>
      <aside class="content-side">
        <div class="note-card note-blue">
          <div class="note-title">${ICONS.info} Lưu ý</div>
          <div>Nhấn "Vì sao?" để biết lý do trạng thái của từng bước. Thông tin thiếu có thể bổ sung ở mục Khảo sát nhanh.</div>
        </div>
        <div class="note-card note-yellow">
          <div class="note-title">${ICONS.lightbulb} Gợi ý thêm</div>
          <div>Hồ sơ liệt kê ở dưới mang tính tham khảo theo cấu trúc chuẩn; thực tế có thể khác tùy địa phương và quy mô dự án.</div>
        </div>
      </aside>
    </div>
  `;
}

function renderChildren(children, map, depth) {
  if (!children.length) return '';
  return children.map((child) => {
    const info = map.get(child.id) || { status: APPLY.YES, why: '' };
    const isOpen = ui.whyOpen.has(child.id);
    const isNa = info.status === APPLY.NO;
    const kindLabel = D.KIND_LABEL[child.kind] || child.kind;
    const gate = child.gate ? `<span class="item-gate">GATE</span>` : '';
    const whyBox = isOpen ? `<div class="why-box">${esc(info.why)}</div>` : '';
    const sub = renderChildren(child.children, map, depth + 1);
    return `
      <div class="item-row depth-${Math.min(depth, 3)} ${isNa ? 'na-row' : ''}">
        <span class="item-name">${esc(child.name)}</span>
        <span class="kind-tag">${esc(kindLabel)}</span>
        ${gate}
        <div class="item-actions">
          ${pill(info.status, false)}
          <button class="why-btn" data-action="toggle-why" data-node="${child.id}">Vì sao?</button>
        </div>
        ${whyBox}
      </div>
      ${sub}
    `;
  }).join('');
}

function collectDocs(stageNode) {
  const docs = [];
  const walk = (node) => {
    if (node.kind === 'docset' || node.kind === 'output' || node.kind === 'consult' || D.acceptsUpload(node)) {
      docs.push(node);
    }
    node.children.forEach(walk);
  };
  stageNode.children.forEach(walk);
  return docs;
}

function pathOf(node) {
  const parts = [];
  let cur = node;
  while (cur) {
    parts.unshift(cur.name);
    cur = cur.parent ? D.NODE_BY_ID.get(cur.parent) : null;
  }
  return parts.join(' / ');
}

/* ============================================================
   Màn xem mục chưa xác định
   ============================================================ */

function renderUnknownView() {
  if (!ui.result) {
    ui.view = 'assistant';
    render();
    return '';
  }
  const groups = [];
  D.STAGES.forEach((stage) => {
    const items = [];
    const walk = (node) => {
      const info = ui.result.map.get(node.id);
      if (info && info.status === APPLY.UNKNOWN && node.kind !== 'stage') {
        items.push({ node, info });
      }
      node.children.forEach(walk);
    };
    stage.children.forEach(walk);
    if (items.length) groups.push({ stage, items });
  });

  const body = groups.length ? groups.map((g) => `
    <div class="unknown-group-title">${esc(g.stage.name)}</div>
    ${g.items.map(({ node, info }) => `
      <div class="item-row">
        <span class="item-name">${esc(node.name)}</span>
        <span class="kind-tag">${esc(D.KIND_LABEL[node.kind] || node.kind)}</span>
        <div class="item-actions">
          ${pill(APPLY.UNKNOWN, false)}
          <button class="why-btn" data-action="toggle-why" data-node="${node.id}">Vì sao?</button>
        </div>
        ${ui.whyOpen.has(node.id) ? `<div class="why-box">${esc(info.why)}</div>` : ''}
      </div>
    `).join('')}
  `).join('') : `<div class="empty"><div class="empty-title">Không còn mục nào chưa xác định.</div><div>Tuyệt vời! Hãy tiếp tục sang các bước tiếp theo.</div></div>`;

  return `
    <div class="crumb">
      <button data-action="back-assistant">AI Assistant</button>
      <span> / Các mục chưa xác định (${groups.reduce((s, g) => s + g.items.length, 0)})</span>
    </div>
    <div class="content-grid">
      <div class="content-main">
        <div class="card">
          <h3>Các mục đang để "Chưa xác định"</h3>
          <p class="page-sub">Trả lời khảo sát nhanh để giải đáp các mục này.</p>
          <div class="unknown-list">${body}</div>
        </div>
      </div>
      <aside class="content-side">
        <div class="note-card note-yellow">
          <div class="note-title">${ICONS.lightbulb} Gợi ý</div>
          <div>Vào mục "Khảo sát nhanh" để trả lời 7 câu hỏi điều kiện — hệ thống sẽ tự cập nhật lại trạng thái.</div>
        </div>
        <button class="btn btn-primary btn-block" data-action="nav" data-view="survey">Đi tới Khảo sát nhanh</button>
      </aside>
    </div>
  `;
}

/* ============================================================
   Màn Quy trình đầu tư (duyệt cây)
   ============================================================ */

function renderProcess() {
  // Nếu chưa có result thì dùng loại chung + profile hiện tại
  const result = ui.result || D.suggest(D.typeById('chung'), S.getSurvey());
  const q = normText(ui.treeSearch);
  // Khi nhập từ khóa mới: tự mở các giai đoạn/nhóm có bước khớp để người dùng thấy kết quả ngay.
  // Chỉ ghi nhận khi từ khóa thay đổi (so với lần render trước) — nhờ vậy sau khi đã tự mở,
  // người dùng vẫn có thể đóng từng mục bằng cách bấm vào thanh tiêu đề.
  if (q && q !== ui._lastTreeSearch) {
    D.ALL_NODES.forEach((n) => { if (n.children.length && normText(n.name).includes(q)) ui.treeOpen.add(n.id); });
    D.STAGES.forEach((s) => ui.treeOpen.add(s.id));
  }
  ui._lastTreeSearch = q;
  const nodes = D.STAGES.flatMap((stage) => {
    const list = [];
    const walk = (node) => {
      if (!q || normText(node.name).includes(q)) list.push(node);
      node.children.forEach(walk);
    };
    stage.children.forEach(walk);
    return list;
  });

  const body = renderProcessBody(result, q);

  const emptySearch = q && !nodes.length
    ? `<div class="empty"><div class="empty-title">Không tìm thấy bước nào khớp với "${esc(ui.treeSearch)}".</div><div>Thử từ khóa khác hoặc xóa ô tìm kiếm.</div></div>`
    : '';

  return `
    <div class="page-head">
      <h1>Quy trình đầu tư</h1>
      <p class="page-sub">Duyệt toàn bộ cây quy trình kèm trạng thái (từ khảo sát + lần hỏi gần nhất).</p>
    </div>
    <div class="proc-tools">
      <div class="search-box">
        <input placeholder="Tìm bước, tài liệu..." value="${esc(ui.treeSearch)}" data-action="search-tree">
        ${ICONS.search}
      </div>
      <button class="btn btn-outline btn-sm" data-action="tree-expand-all">Mở tất cả</button>
      <button class="btn btn-outline btn-sm" data-action="tree-collapse-all">Thu gọn tất cả</button>
    </div>
    ${emptySearch || `<div class="tree">${body}</div>`}
  `;
}

function renderTreeChildren(children, map, q) {
  if (!children.length) return '';
  return children.map((child) => {
    // Khi đang tìm: chỉ hiện nhánh có bước khớp (bỏ qua nhánh không liên quan)
    if (q) {
      const selfMatch = normText(child.name).includes(q);
      const childMatch = child.children.some(function hasMatch(n) {
        return normText(n.name).includes(q) || n.children.some(hasMatch);
      });
      if (!selfMatch && !childMatch) return '';
    }
    const info = map.get(child.id) || { status: APPLY.YES, why: '' };
    const isOpen = ui.treeOpen.has(child.id);
    const isLeaf = !child.children.length;
    const caret = isLeaf ? '<span class="caret" style="visibility:hidden"></span>' :
      `<button class="caret ${isOpen ? 'open' : ''}" data-action="toggle-tree" data-id="${child.id}">${ICONS.chevronRight}</button>`;
    const gate = child.gate ? `<span class="item-gate">GATE</span>` : '';
    const note = child.note ? `<div class="tnote">${esc(child.note)}</div>` : '';
    const subs = isOpen ? `<div class="tree-children">${renderTreeChildren(child.children, map, q)}</div>` : '';
    const hit = q && normText(child.name).includes(q) ? ' tree-hit' : '';
    return `
      <div class="tree-node ${info.status === APPLY.NO ? 'na-node' : ''}${hit}">
        ${caret}
        <span class="tname">${esc(child.name)}</span>
        <span class="kind-tag">${esc(D.KIND_LABEL[child.kind] || child.kind)}</span>
        ${gate}
        <div class="item-actions">
          ${pill(info.status, false)}
          <button class="why-btn" data-action="toggle-why" data-node="${child.id}">Vì sao?</button>
        </div>
        ${ui.whyOpen.has(child.id) ? `<div class="why-box" style="padding-left:30px">${esc(info.why)}</div>` : ''}
        ${note}
      </div>
      ${subs}
    `;
  }).join('');
}

/* ============================================================
   Màn Khảo sát nhanh
   ============================================================ */

const SURVEY_FIELDS = ['hinh_thuc_ndt', 'co_gpmb', 'co_cuong_che', 'thuoc_dtm', 'thuoc_gpmt', 'phai_xin_gpxd', 'thuoc_pccc'];

function renderSurvey() {
  const profile = S.getSurvey();
  const answeredCount = SURVEY_FIELDS.filter((id) => profile[id] && profile[id] !== 'chua_xac_dinh').length;
  const fields = SURVEY_FIELDS.map((fieldId) => {
    const field = D.PROFILE_FIELDS.find((f) => f.id === fieldId);
    if (!field) return '';
    const options = field.options || D.YESNO_OPTIONS;
    const current = profile[fieldId] || 'chua_xac_dinh';
    const segs = options.map((opt) => {
      let activeCls = '';
      if (current === opt.value) {
        if (opt.value === 'yes' || opt.value === 'co') activeCls = 'active-yes';
        else if (opt.value === 'no' || opt.value === 'khong') activeCls = 'active-no';
        else activeCls = 'active-unknown';
      }
      return `<button class="seg ${activeCls}" data-action="set-survey" data-field="${fieldId}" data-value="${opt.value}">${esc(opt.label)}</button>`;
    }).join('');
    return `
      <div class="survey-row">
        <div class="survey-q">
          <div class="q-label">${esc(field.label)}</div>
          ${field.hint ? `<div class="q-hint">${esc(field.hint)}</div>` : ''}
        </div>
        <div class="segmented">${segs}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="page-head">
      <h1>Khảo sát nhanh</h1>
      <p class="page-sub">Trả lời 7 câu hỏi điều kiện để hệ thống giải đáp các mục "Chưa xác định".</p>
    </div>
    <div class="content-grid">
      <div class="content-main">
        <div class="card">
          <div class="survey-list">${fields}</div>
          <div class="survey-foot">
            <span class="survey-count">Đã trả lời ${answeredCount}/${SURVEY_FIELDS.length} câu.</span>
            <div style="display:flex;gap:8px">
              <button class="btn btn-outline btn-sm" data-action="reset-survey">Xóa câu trả lời</button>
              <button class="btn btn-primary btn-sm" data-action="recompute-after-survey">Cập nhật kết quả</button>
            </div>
          </div>
        </div>
      </div>
      <aside class="content-side">
        <div class="note-card note-blue">
          <div class="note-title">${ICONS.info} Lưu ý</div>
          <div>Câu trả lời chỉ lưu trên trình duyệt của bạn, không gửi đi đâu. Khi thay đổi, nhấn "Cập nhật kết quả" để làm mới bảng gợi ý.</div>
        </div>
      </aside>
    </div>
  `;
}

/* ============================================================
   Màn Lịch sử tư vấn
   ============================================================ */

function renderHistory() {
  const list = S.getHistory();
  const body = list.length ? list.map((item) => {
    const time = item.at ? new Date(item.at).toLocaleString('vi-VN') : '';
    const counts = item.counts ? `Áp dụng ${item.counts.apply} · Chưa xác định ${item.counts.unknown} · Không áp dụng ${item.counts.na}` : '';
    return `
      <div class="history-item">
        <div class="hq">${esc(item.query || item.typeLabel || '(không tiêu đề)')}</div>
        <div class="hmeta">
          <span class="chip-type tone-${D.typeById(item.typeId).tone} small">${esc(item.typeLabel || 'Chung')}</span>
          <span>${esc(time)}</span>
          ${counts ? `<span>${esc(counts)}</span>` : ''}
          <button class="btn btn-outline btn-sm" data-action="reopen-history" data-id="${item.id}" data-type="${item.typeId}" data-query="${esc(item.query || '')}">Xem lại</button>
        </div>
      </div>
    `;
  }).join('') : `<div class="empty"><div class="empty-title">Chưa có lịch sử tư vấn.</div><div>Hãy hỏi AI hoặc chọn loại dự án để bắt đầu.</div></div>`;

  return `
    <div class="page-head page-head-row">
      <div>
        <h1>Lịch sử tư vấn</h1>
        <p class="page-sub">Các lần hỏi / chọn loại dự án gần đây.</p>
      </div>
      <button class="btn btn-outline btn-sm" data-action="clear-history">Xóa lịch sử</button>
    </div>
    <div class="history-list">${body}</div>
  `;
}

/** Dựng lại màn AI từ snapshot đã lưu — tức thì, không gọi lại Gemini, không ghi thêm lịch sử. */
function reopenHistory(item) {
  const snap = item.snapshot || {};
  ui.result = {
    typeId: item.typeId,
    map: new Map(Object.entries(snap.map || {})),
    stages: reviveStages(snap.stages),
    counts: snap.counts || { apply: 0, unknown: 0, na: 0, total: 0 },
  };
  ui.query = item.query || '';
  ui.filter = 'all';
  ui.search = '';
  ui.detailStageId = null;
  ui.modalSummary = false;
  ui.aiAnswer = snap.aiAnswer || { status: 'error' };
  const p = snap.proposal;
  ui.proposal = p
    ? (p.status === 'ok' ? { status: 'ok', stages: reviveStages(p.stages) } : p)
    : { status: 'fallback', reason: 'error' };
  ui.activeNav = 'assistant';
  ui.view = 'assistant';
  ui.soon = null;
  render();
}

/* ============================================================
   Màn placeholder cho các chức năng chưa triển khai trong demo
   ============================================================ */

function renderSoon() {
  const label = ui.soon || 'Chức năng này';
  return `
    <div class="page-head">
      <h1>${esc(label)}</h1>
      <p class="page-sub">Chức năng đang phát triển — bản demo tập trung vào gợi ý quy trình đầu tư.</p>
    </div>
    <div class="empty" style="margin-top:24px">
      ${ICONS.lightbulb}
      <div class="empty-title">Đang hoàn thiện</div>
      <div>Hãy quay lại sau hoặc chuyển sang mục "Trang chủ" để trải nghiệm AI gợi ý quy trình đầu tư.</div>
      <div style="margin-top:16px">
        <button class="btn btn-primary" data-action="nav" data-view="assistant">Về Trang chủ</button>
      </div>
    </div>
  `;
}

/* ============================================================
   Router render
   ============================================================ */

function render() {
  renderNav();
  if (ui.soon) {
    elMain.innerHTML = renderSoon();
  } else if (ui.detailStageId && ui.view === 'assistant') {
    elMain.innerHTML = renderDetail();
  } else if (ui.view === 'unknown') {
    elMain.innerHTML = renderUnknownView();
  } else if (ui.view === 'assistant') {
    elMain.innerHTML = renderAssistant();
  } else if (ui.view === 'chat') {
    elMain.innerHTML = renderChat();
    chatScrollBottom();
  } else if (ui.view === 'process') {
    elMain.innerHTML = renderProcess();
  } else if (ui.view === 'survey') {
    elMain.innerHTML = renderSurvey();
  } else if (ui.view === 'portfolio') {
    elMain.innerHTML = renderPortfolio();
  } else if (ui.view === 'history') {
    elMain.innerHTML = renderHistory();
  }
  bindLocalHandlers();
}

/* ============================================================
   Event delegation + binding input
   ============================================================ */

document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'nav') {
    const targetView = target.dataset.view;
    ui.activeNav = targetView;
    const real = VIEW_REAL[targetView];
    if (real) {
      ui.view = real;
      ui.soon = null;
      ui.detailStageId = null;
      if (ui.view !== 'assistant') ui.modalSummary = false;
    } else {
      // Màn hình chưa triển khai — hiển thị placeholder nhưng vẫn giữ trạng thái cũ của assistant
      const label = NAV_ITEMS.find((n) => n.id === targetView)?.label || 'Chức năng này';
      ui.soon = label;
      ui.detailStageId = null;
      ui.modalSummary = false;
    }
    render();
    return;
  }
  if (action === 'ask-send') {
    const inp = document.getElementById('ask-input');
    const q = (inp?.value || '').trim();
    if (!q) { toast('Hãy nhập câu hỏi trước khi gửi.'); return; }
    ask(q, null);
    return;
  }
  if (action === 'ask-type') {
    ask('', target.dataset.type);
    return;
  }
  if (action === 'filter') {
    ui.filter = target.dataset.value;
    render();
    return;
  }
  if (action === 'open-detail') {
    ui.detailStageId = target.dataset.stage;
    ui.whyOpen.clear();
    render();
    return;
  }
  if (action === 'back-assistant') {
    ui.detailStageId = null;
    ui.view = 'assistant';
    ui.activeNav = 'assistant';
    ui.soon = null;
    render();
    return;
  }
  if (action === 'toggle-why') {
    const id = target.dataset.node;
    if (ui.whyOpen.has(id)) ui.whyOpen.delete(id); else ui.whyOpen.add(id);
    render();
    return;
  }
  if (action === 'toggle-beginner') {
    ui.beginner = target.checked;
    S.setBeginner(ui.beginner);
    render();
    return;
  }
  if (action === 'view-unknown') {
    ui.view = 'unknown';
    ui.activeNav = 'assistant';
    ui.soon = null;
    ui.whyOpen.clear();
    render();
    return;
  }
  if (action === 'summary-modal') {
    ui.modalSummary = true;
    render();
    return;
  }
  if (action === 'close-modal' || action === 'close-modal-bg') {
    // Chỉ đóng khi click đúng nền tối (backdrop), không đóng khi click vào nội dung modal
    if (action === 'close-modal-bg' && target !== e.target) return;
    ui.modalSummary = false;
    render();
    return;
  }
  if (action === 'noop') {
    return;
  }
  if (action === 'tour-start') {
    tourStart();
    return;
  }
  if (action === 'tour-next') {
    if (tourIdx >= TOUR_STEPS.length - 1) tourEnd(true);
    else { tourIdx++; tourApplyStep(); }
    return;
  }
  if (action === 'tour-prev') {
    if (tourIdx > 0) { tourIdx--; tourApplyStep(); }
    return;
  }
  if (action === 'tour-skip') {
    tourEnd(false);
    return;
  }
  if (action === 'copy-summary') {
    copySummary();
    return;
  }
  if (action === 'print') {
    window.print();
    return;
  }
  if (action === 'set-survey') {
    S.setSurveyField(target.dataset.field, target.dataset.value);
    render();
    return;
  }
  if (action === 'reset-survey') {
    S.resetSurvey();
    render();
    toast('Đã xóa câu trả lời khảo sát.');
    return;
  }
  if (action === 'recompute-after-survey') {
    if (ui.result) {
      ask(ui.query || '', ui.result.typeId);
      toast('Đã cập nhật kết quả theo khảo sát mới.', true);
    } else {
      toast('Đã lưu khảo sát — hiển thị quy trình với thông tin mới.', true);
    }
    // Tự nhảy sang màn Quy trình đầu tư để xem kết quả mới
    ui.view = 'process';
    ui.activeNav = 'process';
    ui.soon = null;
    render();
    return;
  }
  if (action === 'clear-history') {
    S.clearHistory();
    render();
    toast('Đã xóa lịch sử tư vấn.');
    return;
  }
  if (action === 'reopen-history') {
    const item = S.getHistory().find((h) => h.id === target.dataset.id);
    if (item && item.snapshot) reopenHistory(item);
    else ask(target.dataset.query || '', target.dataset.type); // dòng cũ chưa có snapshot thì phân tích lại
    return;
  }
  if (action === 'chat-send') {
    const inp = document.getElementById('chat-input');
    const q = (inp?.value || '').trim();
    if (!q) { toast('Hãy nhập câu hỏi trước khi gửi.'); return; }
    if (inp) inp.value = '';
    sendChat(q);
    return;
  }
  if (action === 'chat-chip') {
    sendChat(target.dataset.q);
    return;
  }
  if (action === 'chat-clear') {
    clearConvo();
    return;
  }
  if (action === 'chat-toggle-history') {
    ui.historyAll = !ui.historyAll;
    renderChatSideInto();
    return;
  }
  if (action === 'convo-new') {
    createConvo();
    render();
    return;
  }
  if (action === 'convo-open') {
    const id = target.dataset.id;
    if (id && ui.activeConvoId !== id) {
      ui.activeConvoId = id;
      saveConvos();
      render();
    }
    return;
  }
  if (action === 'chat-open-process') {
    const t = D.typeById(target.dataset.type);
    ui.result = D.suggest(t, S.getSurvey());
    ui.query = '';
    ui.view = 'process';
    ui.activeNav = 'process';
    ui.soon = null;
    render();
    return;
  }
  if (action === 'chat-summary-modal') {
    const t = D.typeById(target.dataset.type);
    ui.result = D.suggest(t, S.getSurvey());
    ui.modalSummary = true;
    render();
    return;
  }
  if (action === 'chat-open-stage') {
    const t = D.typeById(target.dataset.type);
    ui.result = D.suggest(t, S.getSurvey());
    ui.detailStageId = target.dataset.stage;
    ui.whyOpen.clear();
    ui.view = 'assistant';
    ui.activeNav = 'process';
    ui.soon = null;
    render();
    return;
  }
  if (action === 'run-portfolio') {
    requestPortfolio();
    return;
  }
  if (action === 'nav-survey') {
    ui.activeNav = 'survey';
    ui.view = 'survey';
    ui.soon = null;
    render();
    return;
  }
  if (action === 'toggle-tree-stage') {
    const id = target.dataset.id;
    if (ui.treeOpen.has(id)) ui.treeOpen.delete(id); else ui.treeOpen.add(id);
    render();
    return;
  }
  if (action === 'toggle-tree') {
    const id = target.dataset.id;
    if (ui.treeOpen.has(id)) ui.treeOpen.delete(id); else ui.treeOpen.add(id);
    render();
    return;
  }
  if (action === 'tree-expand-all') {
    D.ALL_NODES.forEach((n) => { if (n.children.length) ui.treeOpen.add(n.id); });
    render();
    return;
  }
  if (action === 'tree-collapse-all') {
    ui.treeOpen.clear();
    render();
    return;
  }
});

function bindLocalHandlers() {
  const askInput = document.getElementById('ask-input');
  if (askInput) {
    askInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = askInput.value.trim();
        if (q) ask(q, null);
      }
    };
    // giữ cursor nếu render lại cùng giá trị
    if (document.activeElement === askInput) {
      requestAnimationFrame(() => askInput.focus());
    }
  }
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = chatInput.value.trim();
        if (!q) return;
        chatInput.value = '';
        sendChat(q);
      }
    };
  }
  const tableSearch = elMain.querySelector('.table-card input[data-action="search-table"]');
  if (tableSearch) {
    tableSearch.oninput = (e) => {
      ui.search = e.target.value;
      clearTimeout(tableSearch._timer);
      // Render lại riêng phần bảng để không dựng lại ô nhập -> giữ nguyên focus và vị trí con trỏ
      tableSearch._timer = setTimeout(() => rerenderTableOnly(), 120);
    };
  }
  const treeSearch = elMain.querySelector('input[data-action="search-tree"]');
  if (treeSearch) {
    treeSearch.oninput = (e) => {
      ui.treeSearch = e.target.value;
      clearTimeout(treeSearch._timer);
      treeSearch._timer = setTimeout(() => rerenderTreeOnly(treeSearch), 120);
    };
  }
}

/** Render lại riêng cây quy trình, giữ nguyên ô tìm kiếm (focus + caret) để gõ liên tục được. */
function rerenderTreeOnly(inputEl) {
  const procTools = elMain.querySelector('.proc-tools');
  if (!procTools) { render(); return; }
  const result = ui.result || D.suggest(D.typeById('chung'), S.getSurvey());
  const q = normText(ui.treeSearch);
  if (q && q !== ui._lastTreeSearch) {
    D.ALL_NODES.forEach((n) => { if (n.children.length && normText(n.name).includes(q)) ui.treeOpen.add(n.id); });
    D.STAGES.forEach((s) => ui.treeOpen.add(s.id));
  }
  ui._lastTreeSearch = q;
  const nodes = D.STAGES.flatMap((stage) => {
    const list = [];
    const walk = (node) => { if (!q || normText(node.name).includes(q)) list.push(node); node.children.forEach(walk); };
    stage.children.forEach(walk);
    return list;
  });
  const emptySearch = q && !nodes.length
    ? `<div class="empty"><div class="empty-title">Không tìm thấy bước nào khớp với "${esc(ui.treeSearch)}".</div><div>Thử từ khóa khác hoặc xóa ô tìm kiếm.</div></div>`
    : '';
  // Thay thế toàn bộ vùng dưới thanh công cụ (cây hoặc thông báo trống) bằng nội dung mới
  let region = procTools.nextElementSibling;
  const fresh = document.createElement('div');
  fresh.innerHTML = emptySearch || `<div class="tree">${renderProcessBody(result, q)}</div>`;
  const newRegion = fresh.firstElementChild;
  if (region) region.replaceWith(newRegion); else procTools.after(newRegion);
  // Khôi phục focus + vị trí con trỏ vào ô tìm kiếm
  const caret = inputEl ? inputEl.selectionStart : null;
  const next = elMain.querySelector('input[data-action="search-tree"]');
  if (next) {
    next.focus();
    try { if (caret != null) next.setSelectionRange(caret, caret); } catch (e) { /* bỏ qua */ }
  }
}

/** Phần thân của màn Quy trình (các giai đoạn) — tách ra để render riêng khi tìm kiếm. */
function renderProcessBody(result, q) {
  return D.STAGES.map((stage, i) => {
    const stageInfo = result.map.get(stage.id) || { status: APPLY.YES, why: '' };
    const isOpen = ui.treeOpen.has(stage.id);
    const tone = stageToneClass(i);
    const childrenHtml = isOpen ? renderTreeChildren(stage.children, result.map, q) : '';
    if (q) {
      const anyMatch = normText(stage.name).includes(q) || stage.children.some(function hasMatch(n) {
        return normText(n.name).includes(q) || n.children.some(hasMatch);
      });
      if (!anyMatch) return '';
    }
    return `
      <div class="tree-stage">
        <div class="tree-stage-head" data-action="toggle-tree-stage" data-id="${stage.id}" role="button" tabindex="0" aria-expanded="${isOpen}">
          <span class="caret ${isOpen ? 'open' : ''}">${ICONS.chevronRight}</span>
          <div class="stage-ic ${tone}">${STAGE_ICONS[i] || ''}</div>
          <div class="stage-title" style="flex:1">${i + 1}. ${esc(stage.name)}</div>
          ${pill(stageInfo.status, false)}
        </div>
        ${isOpen ? `<div class="tree-children">${childrenHtml}</div>` : ''}
      </div>
    `;
  }).join('');
}

/** Render lại riêng card bảng quy trình (màn assistant), giữ nguyên ô tìm kiếm trong bảng. */
function rerenderTableOnly() {
  const card = elMain.querySelector('.table-card');
  if (!card || !ui.result) { render(); return; }
  const disp = displayResult(ui.result);
  const fresh = document.createElement('div');
  fresh.innerHTML = renderTable(disp);
  card.replaceWith(fresh.firstElementChild);
  const next = elMain.querySelector('.table-card input[data-action="search-table"]');
  if (next) {
    next.focus();
    try { const c = ui.search.length; next.setSelectionRange(c, c); } catch (e) { /* bỏ qua */ }
  }
}

/* ============================================================
   Hướng dẫn nổi (tour) cho người mới
   ============================================================ */

const TOUR_KEY = 'hacom-tour-done-v1';
const TOUR_STEPS = [
  { view: 'assistant', sel: '.ask-card', title: 'Đặt câu hỏi cho AI', body: 'Gõ loại dự án bạn muốn tìm hiểu rồi nhấn "Gửi câu hỏi". Ví dụ: "Quy trình đầu tư nhà ở xã hội".' },
  { view: 'assistant', sel: '.quick-chips', title: 'Chọn nhanh loại dự án', body: 'Không cần gõ chữ — bấm chọn một loại dự án có sẵn: nhà ở xã hội, nhà ở thương mại, khu đô thị, khu công nghiệp, hạ tầng kỹ thuật.' },
  { view: 'assistant', sel: '.content-side', title: 'Tóm tắt quy trình & lưu ý', body: 'Cột phải tóm tắt 8 giai đoạn kèm thời gian dự kiến, cùng các lưu ý về cách hiển thị trạng thái "Áp dụng / Chưa xác định / Không áp dụng".' },
  { view: 'assistant', sel: '.side-nav', title: 'Menu điều hướng', body: 'Di chuyển giữa các chức năng: Khảo sát & Mục tiêu, Quy trình đầu tư, Lịch sử tư vấn... Mục đang phát triển sẽ được thông báo rõ.' },
  { view: 'survey', sel: '.survey-list', title: 'Khảo sát nhanh', body: 'Trả lời 7 câu hỏi điều kiện để giải đáp các mục "Chưa xác định". Xong nhấn "Cập nhật kết quả" — hệ thống tự mở bảng quy trình mới.' },
  { view: 'process', sel: '.tree', title: 'Duyệt cây quy trình', body: 'Mở từng giai đoạn để xem các bước, hồ sơ, tài liệu kèm trạng thái và lý do "Vì sao?". Ô tìm kiếm giúp lọc bước theo từ khóa.' },
];
let tourIdx = -1; // -1 = không chạy tour

function tourStart() {
  tourIdx = 0;
  tourApplyStep();
}

function tourEnd(done) {
  tourIdx = -1;
  try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) { /* bỏ qua */ }
  window.removeEventListener('resize', tourPosition);
  window.removeEventListener('scroll', tourPosition, true);
  const root = document.getElementById('tour-root');
  if (root) root.remove();
  if (done) toast('Hoàn thành hướng dẫn — chúc bạn khám phá hiệu quả!', true);
}

function tourApplyStep() {
  const step = TOUR_STEPS[tourIdx];
  // Chuyển đúng màn hình để phần tử đích tồn tại
  ui.view = step.view;
  ui.activeNav = step.view;
  ui.soon = null;
  render();
  requestAnimationFrame(() => {
    const el = document.querySelector(step.sel);
    if (el) el.scrollIntoView({ block: 'center' });
    tourRenderCard();
    tourPosition();
  });
}

function tourRenderCard() {
  let root = document.getElementById('tour-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'tour-root';
    document.body.appendChild(root);
    window.addEventListener('resize', tourPosition);
    window.addEventListener('scroll', tourPosition, true);
  }
  const step = TOUR_STEPS[tourIdx];
  const n = TOUR_STEPS.length;
  root.innerHTML = `
    <div class="tour-backdrop" data-action="tour-next"></div>
    <div class="tour-spot"></div>
    <div class="tour-card" data-action="noop">
      <button class="tour-x" data-action="tour-skip" title="Đóng hướng dẫn">&times;</button>
      <div class="tour-step">Bước ${tourIdx + 1}/${n}</div>
      <div class="tour-title">${esc(step.title)}</div>
      <div class="tour-body">${esc(step.body)}</div>
      <div class="tour-dots">${TOUR_STEPS.map((s, i) => `<span class="${i === tourIdx ? 'on' : ''}"></span>`).join('')}</div>
      <div class="tour-actions">
        <button class="tour-skip" data-action="tour-skip">Bỏ qua</button>
        <div class="tour-nav">
          <button class="btn btn-outline btn-sm" data-action="tour-prev" ${tourIdx === 0 ? 'disabled' : ''}>&larr; Trước</button>
          <button class="btn btn-primary btn-sm" data-action="tour-next">${tourIdx === n - 1 ? 'Hoàn thành' : 'Tiếp &rarr;'}</button>
        </div>
      </div>
      <div class="tour-hint">Nhấp ra ngoài màn hình để sang bước tiếp theo</div>
    </div>
  `;
}

function tourPosition() {
  if (tourIdx < 0) return;
  const root = document.getElementById('tour-root');
  if (!root) return;
  const spot = root.querySelector('.tour-spot');
  const card = root.querySelector('.tour-card');
  const step = TOUR_STEPS[tourIdx];
  const el = document.querySelector(step.sel);
  let r = el ? el.getBoundingClientRect() : null;
  if (r && r.width === 0 && r.height === 0) r = null;
  const pad = 6;
  if (r) {
    spot.style.display = 'block';
    spot.style.top = (r.top - pad) + 'px';
    spot.style.left = (r.left - pad) + 'px';
    spot.style.width = (r.width + pad * 2) + 'px';
    spot.style.height = (r.height + pad * 2) + 'px';
  } else {
    spot.style.display = 'none';
  }
  const cw = Math.min(380, window.innerWidth - 24);
  const ch = card.offsetHeight || 260;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top;
  let left;
  if (r) {
    if (r.bottom + pad + ch + 12 < vh) top = r.bottom + pad + 12;
    else if (r.top - pad - ch - 12 > 0) top = r.top - pad - ch - 12;
    else top = Math.max(12, (vh - ch) / 2);
    left = Math.min(Math.max(12, r.left), vw - cw - 12);
  } else {
    top = Math.max(12, (vh - ch) / 2);
    left = Math.max(12, (vw - cw) / 2);
  }
  card.style.top = top + 'px';
  card.style.left = left + 'px';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && tourIdx >= 0) tourEnd(false);
});

/* ============================================================
   Khởi tạo
   ============================================================ */

// Nếu localStorage không persistent thì cảnh báo nhỏ
if (!S.isPersistent()) {
  toast('LocalStorage bị khóa (file://?) — dữ liệu chỉ tồn tại trong tab này.');
}

render();

// Tự mở hướng dẫn nổi ở lần truy cập đầu tiên (ghi nhớ trong localStorage)
try {
  if (!localStorage.getItem(TOUR_KEY)) tourStart();
} catch (e) { /* bỏ qua */ }

})();
