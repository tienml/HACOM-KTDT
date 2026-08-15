/**
 * Giao diện Hacom AI Invest — trợ lý gợi ý quy trình đầu tư.
 *
 * Các màn hình:
 *   assistant  - Hỏi / chọn loại dự án, xem bảng kết quả, chi tiết, mục chưa xác định
 *   process    - Duyệt toàn bộ cây quy trình với trạng thái (từ khảo sát + lần hỏi gần nhất)
 *   survey     - Trả lời khảo sát nhanh (7 trường điều kiện) để giải đáp "Chưa xác định"
 *   history    - Lịch sử các lần tư vấn
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
  { id: 'my-portfolio', label: 'Danh mục của tôi', icon: ICONS.briefcase },
  { id: 'monitor', label: 'Theo dõi & Đánh giá', icon: ICONS.trendingUp },
  { id: 'history', label: 'Lịch sử tư vấn', icon: ICONS.clock },
];

// Map view → thực tế hiển thị (một số màn chưa triển khai trong bản demo)
const VIEW_REAL = {
  'assistant': 'assistant',
  'ai-assistant': 'assistant',
  'survey': 'survey',
  'process': 'process',
  'history': 'history',
};

/* ============================================================
   Trạng thái UI
   ============================================================ */

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
  S.addHistory({ query: query || type.label, typeId: type.id, typeLabel: type.label, counts: result.counts });
  render();
}

function summaryText(result, beginner) {
  if (!result) return '';
  const type = D.typeById(result.typeId);
  const lines = [];
  lines.push(`Gợi ý quy trình đầu tư: ${type.label}`);
  lines.push(beginner && type.beginnerIntro ? type.beginnerIntro : type.intro);
  lines.push('');
  result.stages.forEach((st, i) => {
    const statusLabel = st.status === APPLY.YES ? 'Áp dụng' : st.status === APPLY.UNKNOWN ? 'Chưa xác định' : 'Không áp dụng';
    lines.push(`${i + 1}. ${st.node.name} — ${statusLabel} (${st.duration})`);
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

function renderAssistant() {
  const result = ui.result;
  const type = result ? D.typeById(result.typeId) : null;
  const hasResult = !!result;

  const statCards = hasResult ? `
    <div class="stat-grid">
      <div class="stat-card st-apply">
        <div class="stat-text"><span class="stat-label">Áp dụng</span><span class="stat-num">${result.counts.apply}</span></div>
        <div class="stat-ic">${ICONS.checkSquare}</div>
      </div>
      <div class="stat-card st-unknown">
        <div class="stat-text"><span class="stat-label">Chưa xác định</span><span class="stat-num">${result.counts.unknown}</span></div>
        <div class="stat-ic">${ICONS.helpCircle}</div>
      </div>
      <div class="stat-card st-na">
        <div class="stat-text"><span class="stat-label">Không áp dụng</span><span class="stat-num">${result.counts.na}</span></div>
        <div class="stat-ic">${ICONS.xCircle}</div>
      </div>
      <div class="stat-card st-total">
        <div class="stat-text"><span class="stat-label">Tổng số mục</span><span class="stat-num">${result.counts.total}</span></div>
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
      <div class="result-source">Nguồn: Cấu trúc quy trình đầu tư Hacom</div>
      ${statCards}
    </div>
  ` : '';

  const tableCard = hasResult ? renderTable(result) : `
    <div class="empty">
      ${ICONS.lightbulb}
      <div class="empty-title">Hãy đặt câu hỏi hoặc chọn một loại dự án bên trên.</div>
      <div>AI sẽ phân tích và đưa ra quy trình phù hợp nhất.</div>
    </div>
  `;

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
        ${tableCard}
      </div>
      <aside class="content-side">
        ${hasResult ? renderSideSummary(result) : `
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

function renderTable(result) {
  const stages = filterStages(result.stages, ui.filter, ui.search);
  const rows = stages.length ? stages.map((st, i) => {
    const idx = D.STAGES.findIndex((s) => s.id === st.node.id);
    const tone = stageToneClass(idx);
    const beginnerInline = ui.beginner && st.beginner ? `<div class="beginner-inline">${esc(st.beginner)}</div>` : '';
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
        <td class="stage-desc-cell">${esc(st.desc)}</td>
        <td>${pill(st.status, false)}</td>
        <td style="text-align:right"><button class="detail-link" data-action="open-detail" data-stage="${st.node.id}">Xem chi tiết &rsaquo;</button></td>
      </tr>
    `;
  }).join('') : `<tr><td colspan="4" class="empty">Không có giai đoạn phù hợp với bộ lọc hiện tại.</td></tr>`;

  const countAll = result.stages.length;
  const countApply = result.stages.filter((s) => s.status === APPLY.YES).length;
  const countUnknown = result.stages.filter((s) => s.status === APPLY.UNKNOWN).length;
  const countNa = result.stages.filter((s) => s.status === APPLY.NO).length;

  return `
    <div class="card table-card">
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
              <th style="text-align:right">Thao tác</th>
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
      <div class="modal" onclick="event.stopPropagation()">
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
  const nodes = D.STAGES.flatMap((stage) => {
    const list = [];
    const walk = (node) => {
      if (!q || normText(node.name).includes(q)) list.push(node);
      node.children.forEach(walk);
    };
    stage.children.forEach(walk);
    return list;
  });

  const body = D.STAGES.map((stage, i) => {
    const stageInfo = result.map.get(stage.id) || { status: APPLY.YES, why: '' };
    const isOpen = ui.treeOpen.has(stage.id);
    const tone = stageToneClass(i);
    const childrenHtml = isOpen ? renderTreeChildren(stage.children, result.map) : '';
    return `
      <div class="tree-stage">
        <div class="tree-stage-head">
          <button class="caret ${isOpen ? 'open' : ''}" data-action="toggle-tree-stage" data-id="${stage.id}">
            ${ICONS.chevronRight}
          </button>
          <div class="stage-ic ${tone}">${STAGE_ICONS[i] || ''}</div>
          <div class="stage-title" style="flex:1">${i + 1}. ${esc(stage.name)}</div>
          ${pill(stageInfo.status, false)}
        </div>
        ${isOpen ? `<div class="tree-children">${childrenHtml}</div>` : ''}
      </div>
    `;
  }).join('');

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
    <div class="tree">${body}</div>
  `;
}

function renderTreeChildren(children, map) {
  if (!children.length) return '';
  return children.map((child) => {
    const info = map.get(child.id) || { status: APPLY.YES, why: '' };
    const isOpen = ui.treeOpen.has(child.id);
    const isLeaf = !child.children.length;
    const caret = isLeaf ? '<span class="caret" style="visibility:hidden"></span>' :
      `<button class="caret ${isOpen ? 'open' : ''}" data-action="toggle-tree" data-id="${child.id}">${ICONS.chevronRight}</button>`;
    const gate = child.gate ? `<span class="item-gate">GATE</span>` : '';
    const note = child.note ? `<div class="tnote">${esc(child.note)}</div>` : '';
    const subs = isOpen ? `<div class="tree-children">${renderTreeChildren(child.children, map)}</div>` : '';
    return `
      <div class="tree-node ${info.status === APPLY.NO ? 'na-node' : ''}">
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
          <button class="btn btn-outline btn-sm" data-action="reopen-history" data-type="${item.typeId}" data-query="${esc(item.query || '')}">Xem lại</button>
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
  } else if (ui.view === 'process') {
    elMain.innerHTML = renderProcess();
  } else if (ui.view === 'survey') {
    elMain.innerHTML = renderSurvey();
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
  if (action === 'go-ask') {
    ui.view = 'assistant';
    ui.activeNav = 'ai-assistant';
    ui.soon = null;
    ui.detailStageId = null;
    render();
    requestAnimationFrame(() => {
      const inp = document.getElementById('ask-input');
      if (inp) inp.focus();
    });
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
    ui.activeNav = 'ai-assistant';
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
    ui.activeNav = 'ai-assistant';
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
    ui.modalSummary = false;
    render();
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
      toast('Chưa có kết quả để cập nhật.');
    }
    return;
  }
  if (action === 'clear-history') {
    S.clearHistory();
    render();
    toast('Đã xóa lịch sử tư vấn.');
    return;
  }
  if (action === 'reopen-history') {
    ask(target.dataset.query || '', target.dataset.type);
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
  const tableSearch = elMain.querySelector('.table-card input[data-action="search-table"]');
  if (tableSearch) {
    tableSearch.oninput = (e) => {
      ui.search = e.target.value;
      // re-render phần bảng thôi — đơn giản nhất là render lại toàn trang; debounce nhẹ
      clearTimeout(tableSearch._timer);
      tableSearch._timer = setTimeout(() => render(), 120);
    };
  }
  const treeSearch = elMain.querySelector('input[data-action="search-tree"]');
  if (treeSearch) {
    treeSearch.oninput = (e) => {
      ui.treeSearch = e.target.value;
      clearTimeout(treeSearch._timer);
      treeSearch._timer = setTimeout(() => render(), 120);
    };
  }
}

/* ============================================================
   Khởi tạo
   ============================================================ */

// Nếu localStorage không persistent thì cảnh báo nhỏ
if (!S.isPersistent()) {
  toast('LocalStorage bị khóa (file://?) — dữ liệu chỉ tồn tại trong tab này.');
}

render();

})();
