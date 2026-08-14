/**
 * Giao diện demo.
 *
 * Ý tưởng trung tâm: quy trình đầy đủ ngay từ đầu, còn checklist thì để TRỐNG
 * một cách có chủ ý. Mỗi folder đều có khung "Hồ sơ cần có" — hiện "Chưa thiết lập"
 * — kèm chỗ để người dùng nói ra tài liệu cần có. Checklist hình thành từ chính
 * dữ liệu người dùng đẩy lên và đề xuất, thay vì phát biểu mẫu cho ai tick.
 */

(function () {
  'use strict';

  const D = window.HacomData;
  const S = window.HacomStore;
  const { APPLY } = D;

  const el = {
    sidebar: document.getElementById('sidebar'),
    main: document.getElementById('main'),
    headerMid: document.getElementById('header-mid'),
    drawer: document.getElementById('drawer'),
    drawerBackdrop: document.getElementById('drawer-backdrop'),
    drawerTitle: document.getElementById('drawer-title'),
    drawerPath: document.getElementById('drawer-path'),
    drawerChips: document.getElementById('drawer-chips'),
    drawerBody: document.getElementById('drawer-body'),
    drawerClose: document.getElementById('drawer-close'),
    toastWrap: document.getElementById('toast-wrap'),
    btnGuide: document.getElementById('btn-guide'),
    btnReset: document.getElementById('btn-reset'),
  };

  const ICON = {
    caret: '<svg viewBox="0 0 12 12" width="9" height="9" aria-hidden="true"><path fill="currentColor" d="M4 2l5 4-5 4z"/></svg>',
    plus: '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M7.25 2h1.5v5.25H14v1.5H8.75V14h-1.5V8.75H2v-1.5h5.25z"/></svg>',
    trash: '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M6 1.5h4l.4.8H13v1.4H3V2.3h2.6zM4 5h8l-.6 8.2a1.2 1.2 0 01-1.2 1.1H5.8a1.2 1.2 0 01-1.2-1.1L4 5z"/></svg>',
    edit: '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M11.6 1.6l2.8 2.8-1.6 1.6-2.8-2.8zM8.9 4.3l2.8 2.8-6.4 6.4H2.5v-2.8z"/></svg>',
    folder: '<svg viewBox="0 0 20 16" width="18" height="15" aria-hidden="true"><path fill="currentColor" d="M1.5 2.2A1.7 1.7 0 013.2.5h4.1l1.8 2H17a1.7 1.7 0 011.7 1.7v8.9a2.4 2.4 0 01-2.4 2.4H3.7a2.4 2.4 0 01-2.4-2.4V2.2z"/><path fill="rgba(255,255,255,.28)" d="M2.8 5h14.4v1H2.8z"/></svg>',
    folderFill: '<svg viewBox="0 0 20 16" width="19" height="15" aria-hidden="true"><path fill="currentColor" d="M1.5 2.2A1.7 1.7 0 013.2.5h4.1l1.8 2H17a1.7 1.7 0 011.7 1.7v8.9a2.4 2.4 0 01-2.4 2.4H3.7a2.4 2.4 0 01-2.4-2.4V2.2z"/></svg>',
    upload: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M10 13V4.5M6.5 7.5L10 4l3.5 3.5M4 14v2.5h12V14"/></svg>',
    grid: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z"/></svg>',
    list: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M3 4h14v2H3zM3 9h14v2H3zM3 14h14v2H3z"/></svg>',
    chart: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M3 16.5h14V18H3zM4.5 9h2.4v5.5H4.5zM8.8 4.5h2.4V14.5H8.8zM13.1 11h2.4v3.5h-2.4z"/></svg>',
    bulb: '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M10 2a6 6 0 013.6 10.8c-.5.4-.6.9-.6 1.5H7c0-.6-.1-1.1-.6-1.5A6 6 0 0110 2zM7.5 15h5v1.5h-5zM8.2 17.3h3.6v1.5H8.2z"/></svg>',
    check: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="10" cy="10" r="7.3" fill="none" stroke="currentColor" stroke-width="1.7"/><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="M6.9 10.2l2.2 2.2 4-4.3"/></svg>',
    dots: '<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><circle cx="4.5" cy="10" r="1.7" fill="currentColor"/><circle cx="10" cy="10" r="1.7" fill="currentColor"/><circle cx="15.5" cy="10" r="1.7" fill="currentColor"/></svg>',
    search: '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8.6 3.4a5.2 5.2 0 100 10.4 5.2 5.2 0 000-10.4zm3.9 8.9l4 4"/></svg>',
    clipboard: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><rect x="4" y="3.4" width="12" height="14.4" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="7.2" y="1.7" width="5.6" height="3" rx="1" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M7.3 11.2l2 2 3.4-3.9"/></svg>',
    clock: '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="10" cy="10" r="7.3" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M10 5.9V10l2.8 1.9"/></svg>',
    download: '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M10 3.5V13M6.5 9.5L10 13l3.5-3.5M4 16.5h12"/></svg>',
    folderLine: '<svg viewBox="0 0 20 16" width="17" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M2 3.5A1.5 1.5 0 013.5 2h4.3l1.8 2h6.9A1.5 1.5 0 0118 5.5v7a2.5 2.5 0 01-2.5 2.5h-12A1.5 1.5 0 012 13.5z"/></svg>',
  };

  /** Trạng thái chỉ liên quan tới giao diện, không cần lưu xuống localStorage. */
  const ui = {
    view: 'dashboard',     // 'dashboard' | 'projects' | 'report' | 'new' | 'process'
    lastView: 'dashboard', // view trước khi vào form — dùng cho nút Hủy
    activeStage: null,     // id giai đoạn đang xem
    openNodes: new Set(),  // node đang mở trong cây
    drawerNodeId: null,
    pendingFiles: [],      // file chờ khai loại tài liệu
    draftProfile: {},
    profileError: '',
    editingProjectId: null, // khác null = đang sửa dự án, không phải tạo mới
    locationOpen: false,
    locationActive: -1,
    menuFor: null,         // id dự án đang mở menu "..." trong bảng
    searchQuery: '',
    statusFilter: 'all',
    page: 1,               // trang hiện tại của bảng dự án (5 dòng/trang)
    reportRange: '7d',     // '7d' | '30d' — khoảng thời gian trên trang báo cáo
  };

  const PAGE_SIZE = 5;

  /* ------------------------------------------------------------ helpers */

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));

  function formatSize(bytes) {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  function toast(message, gold = false) {
    const node = document.createElement('div');
    node.className = `toast${gold ? ' is-gold' : ''}`;
    node.textContent = message;
    el.toastWrap.appendChild(node);
    setTimeout(() => node.remove(), 3200);
  }

  /** Node nào là folder — nơi thực sự nhận tài liệu. */
  function isFolder(node) {
    return D.acceptsUpload(node);
  }

  function normalizeSearch(value) {
    return String(value || '').normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }

  function locationSuggestions(value) {
    const query = normalizeSearch(value).trim();
    if (!query) return D.PROVINCES;
    // Ưu tiên khớp chữ cái đầu: "H" chỉ ra Hà Nội, Hải Phòng...
    const byPrefix = D.PROVINCES.filter((name) => normalizeSearch(name).startsWith(query));
    if (byPrefix.length) return byPrefix;
    return D.PROVINCES.filter((name) => normalizeSearch(name).includes(query));
  }

  /** Địa điểm hợp lệ phải là một tỉnh/thành trong danh sách (so sánh không dấu). */
  function matchProvince(value) {
    const query = normalizeSearch(value).trim();
    return D.PROVINCES.find((name) => normalizeSearch(name) === query) || null;
  }

  /* ------------------------------------------------------------ project meta */

  const AVATAR_TONES = ['tone-red', 'tone-gold', 'tone-blue', 'tone-slate', 'tone-green'];

  /** Mã dự án ngắn, ổn định theo id — đủ để phân biệt trong demo. */
  function projectCode(project) {
    return 'DA-' + String(project.id).replace(/^PRJ-/, '').slice(-5).toUpperCase();
  }

  /**
   * Trạng thái dự án — chỉ suy ra từ dữ liệu thật:
   * đủ chuẩn ở mọi folder áp dụng thì hoàn thành; có tài liệu thì đang chạy;
   * còn câu hỏi chưa trả lời thì chờ xử lý; ngoài ra là chưa bắt đầu.
   */
  function projectStatus(project, r = computeReadiness(project)) {
    if (r.applicable > 0 && r.complete === r.applicable) return 'done';
    if (r.docCount > 0) return 'run';
    if (r.unknown > 0) return 'wait';
    return 'idle';
  }

  const STATUS_INFO = {
    done: { label: 'Hoàn thành', cls: 'st-done' },
    run: { label: 'Đang thực hiện', cls: 'st-run' },
    wait: { label: 'Chờ xử lý', cls: 'st-wait' },
    idle: { label: 'Chưa bắt đầu', cls: 'st-idle' },
  };

  function relativeTime(iso) {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return formatDate(iso);
  }

  /** Đường dẫn đầy đủ của node, ví dụ "Bước 2. Chuẩn bị đầu tư > ... > Hồ sơ đất đai". */
  function nodePathOf(nodeId) {
    const names = [];
    let current = D.NODE_BY_ID.get(nodeId);
    while (current) {
      names.unshift(current.name);
      current = current.parentId ? D.NODE_BY_ID.get(current.parentId) : null;
    }
    return names.join(' > ');
  }

  /** Cập nhật cuối = thời điểm mới nhất trong mọi hoạt động của dự án. */
  function projectLastUpdate(project) {
    const times = [new Date(project.createdAt).getTime()];
    S.getDocuments(project.id).forEach((doc) => times.push(new Date(doc.uploadedAt).getTime()));
    return new Date(Math.max(...times)).toISOString();
  }

  function filterProjects(projects) {
    const q = normalizeSearch(ui.searchQuery);
    return projects.filter((p) => {
      if (ui.statusFilter !== 'all' && projectStatus(p) !== ui.statusFilter) return false;
      if (!q) return true;
      return normalizeSearch(p.name).includes(q)
        || normalizeSearch(p.profile.dia_diem || '').includes(q)
        || normalizeSearch(projectCode(p)).includes(q);
    });
  }

  /** Thẻ số liệu: nhãn nhỏ ở trên, số lớn ở giữa, chú thích nhỏ ở dưới. */
  function statCardHtml(tone, icon, label, value, sub) {
    return `
      <div class="stat-card">
        <div class="stat-icon ${tone}">${icon}</div>
        <div class="stat-body">
          <div class="stat-label">${label}</div>
          <div class="stat-value">${value}</div>
          ${sub ? `<div class="stat-sub">${sub}</div>` : ''}
        </div>
      </div>`;
  }

  /** Hai chữ cái đại diện cho avatar: chữ cái đầu của hai từ đầu tiên. */
  function projectInitials(name) {
    const words = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  /** Khóa ngày theo giờ địa phương — tránh lệch múi giờ khi dùng toISOString. */
  function dayKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  /** Mẹo sử dụng ở chân sidebar, đổi theo từng màn hình. */
  const TIP_TEXT = {
    report: 'Theo dõi báo cáo giúp bạn nắm bắt tình hình dự án nhanh chóng.',
    default: 'Tạo dự án và xây dựng quy trình để bắt đầu quản lý hồ sơ hiệu quả.',
  };

  const PROJECT_TABLE_HEAD = `
    <tr>
      <th>Dự án</th>
      <th>Mô tả</th>
      <th style="width:170px">Tiến độ quy trình</th>
      <th>Trạng thái</th>
      <th style="width:130px">Cập nhật cuối</th>
      <th style="width:110px">Thao tác</th>
    </tr>`;

  /** Thanh công cụ chung của bảng dự án: tìm kiếm, lọc trạng thái, tạo mới. */
  function toolbarHtml() {
    const statusOptions = ['all', 'done', 'run', 'wait', 'idle'].map((value) => `
      <option value="${value}"${ui.statusFilter === value ? ' selected' : ''}>
        ${value === 'all' ? 'Tất cả trạng thái' : STATUS_INFO[value].label}
      </option>`).join('');

    return `
      <div class="list-toolbar">
        <div class="toolbar-right">
          <div class="search-box">
            <span class="sb-icon">${ICON.search}</span>
            <input type="search" id="project-search" value="${esc(ui.searchQuery)}"
                   placeholder="Tìm kiếm dự án, mã dự án..." aria-label="Tìm dự án">
          </div>
          <div class="select-pill-wrap">
            <select class="select-pill" data-action="filter-status" aria-label="Lọc theo trạng thái">${statusOptions}</select>
            <span class="sp-caret">${ICON.caret}</span>
          </div>
          <button type="button" class="btn btn-primary btn-sm" data-action="new-project">${ICON.plus} Tạo dự án mới</button>
        </div>
      </div>`;
  }

  /** Chân bảng: "Hiển thị x đến y của n" + phân trang. */
  function tableFootHtml(filtered) {
    if (!filtered.length) return '';
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const from = (ui.page - 1) * PAGE_SIZE + 1;
    const to = Math.min(ui.page * PAGE_SIZE, filtered.length);

    const pageBtn = (action, label, disabled, aria) => `
      <button type="button" class="page-btn" data-action="${action}"
              ${disabled ? 'disabled' : ''} aria-label="${aria}">${label}</button>`;

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => `
      <button type="button" class="page-btn${n === ui.page ? ' is-active' : ''}"
              data-action="page-goto" data-page="${n}" aria-label="Trang ${n}"
              ${n === ui.page ? 'aria-current="page"' : ''}>${n}</button>`).join('');

    return `
      <div class="table-foot">
        <div class="tf-info">Hiển thị ${from} đến ${to} của ${filtered.length} dự án</div>
        <div class="tf-pager">
          ${pageBtn('page-first', '&laquo;', ui.page <= 1, 'Trang đầu')}
          ${pageBtn('page-prev', '&lsaquo;', ui.page <= 1, 'Trang trước')}
          ${pageNumbers}
          ${pageBtn('page-next', '&rsaquo;', ui.page >= totalPages, 'Trang sau')}
          ${pageBtn('page-last', '&raquo;', ui.page >= totalPages, 'Trang cuối')}
        </div>
      </div>`;
  }

  /** Gõ tìm kiếm: chỉ thay tbody + chân bảng, không render lại cả trang. */
  function refreshProjectsTable() {
    const all = S.getState().projects;
    const filtered = filterProjects(all);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    ui.page = Math.min(Math.max(1, ui.page), totalPages);
    const start = (ui.page - 1) * PAGE_SIZE;
    const tbody = document.querySelector('.pj-table tbody');
    if (tbody) tbody.innerHTML = projectTableBody(filtered.slice(start, start + PAGE_SIZE), all.length > 0);
    const slot = document.getElementById('table-foot-slot');
    if (slot) slot.innerHTML = tableFootHtml(filtered);
  }

  /** Định vị menu "..." bằng position:fixed để không bị khung cuộn của bảng cắt,
   *  và tự lật lên trên khi dòng nằm sát đáy màn hình để khỏi phải cuộn. */
  function positionRowMenu(id) {
    const btn = document.querySelector(`button[data-action="toggle-menu"][data-id="${id}"]`);
    const wrap = btn?.closest('.menu-wrap');
    const menu = wrap?.querySelector('.row-menu');
    if (!btn || !menu) return;
    const rect = btn.getBoundingClientRect();
    const menuHeight = menu.offsetHeight || 130;
    const fitsBelow = rect.bottom + menuHeight + 8 <= window.innerHeight;
    const openUp = !fitsBelow && rect.top > menuHeight + 8;
    wrap.classList.toggle('is-up', openUp);
    menu.style.position = 'fixed';
    menu.style.top = openUp ? '' : `${rect.bottom + 5}px`;
    menu.style.bottom = openUp ? `${window.innerHeight - rect.top + 5}px` : '';
    // right của position:fixed tính theo layout viewport (clientWidth), không phải innerWidth.
    menu.style.right = `${Math.max(8, document.documentElement.clientWidth - rect.right)}px`;
    menu.style.left = 'auto';
  }

  function locationOptionsHtml(suggestions, active = -1) {
    if (!suggestions.length) {
      return '<div class="location-empty">Không có tỉnh/thành nào khớp với từ vừa gõ.</div>';
    }
    return suggestions.map((name, index) => `
      <button type="button" id="location-option-${index}" role="option"
              class="location-option${index === active ? ' is-active' : ''}"
              aria-selected="${index === active}" data-action="select-location" data-value="${esc(name)}">
        ${esc(name)}
      </button>`).join('');
  }

  function nodePath(node) {
    const parts = [];
    let current = node;
    while (current) {
      parts.unshift(current.name);
      current = current.parentId ? D.NODE_BY_ID.get(current.parentId) : null;
    }
    return parts;
  }

  /* ------------------------------------------------------------ readiness */

  /**
   * Số liệu cho sidebar. Điểm quan trọng: KHÔNG báo "đủ/thiếu" khi chưa có chuẩn,
   * và tách riêng phần "chưa xác định" thay vì gộp vào tỷ lệ hoàn thành.
   */
  function computeReadiness(project) {
    let applicable = 0;
    let unknown = 0;
    let withStandard = 0;
    let complete = 0;

    const walk = (node, inherited) => {
      const apply = D.resolveApply(node, project.profile, inherited);
      if (isFolder(node)) {
        if (apply === APPLY.YES) applicable += 1;
        if (apply === APPLY.UNKNOWN) unknown += 1;
        if (apply === APPLY.YES) {
          const checklist = S.getChecklist(node.id);
          if (checklist) {
            withStandard += 1;
            const docs = S.getDocuments(project.id, node.id);
            const names = new Set(docs.map((doc) => doc.docType.trim().toLowerCase()));
            const required = checklist.items.filter((item) => item.level === 'bat_buoc');
            const done = required.every((item) => names.has(item.name.trim().toLowerCase()));
            if (done && required.length) complete += 1;
          }
        }
      }
      node.children.forEach((child) => walk(child, apply));
    };

    D.STAGES.forEach((stage) => walk(stage, APPLY.YES));

    const docs = S.getDocuments(project.id);
    return {
      applicable,
      unknown,
      withStandard,
      complete,
      docCount: docs.length,
      noStandard: applicable - withStandard,
    };
  }

  /* ------------------------------------------------------------ sidebar & header */

  /** Nội dung menu "..." của một dòng dự án — __ID__ được thay bằng id thật. */
  const PROJECT_MENU_HTML = `
    <button type="button" class="menu-item" data-action="open-project" data-id="__ID__">
      ${ICON.folderFill} Mở dự án
    </button>
    <button type="button" class="menu-item" data-action="edit-profile" data-id="__ID__">
      ${ICON.edit} Sửa tên &amp; đặc điểm
    </button>
    <button type="button" class="menu-item is-danger" data-action="delete-project" data-id="__ID__">
      ${ICON.trash} Xóa dự án
    </button>`;

  function renderHeaderMid() {
    const project = S.getActiveProject();

    if (ui.view === 'process' && project) {
      // Công tắc chuyển nhanh giữa các dự án ngay trên header.
      const options = S.getState().projects
        .map((p) => `<option value="${p.id}"${p.id === project.id ? ' selected' : ''}>${esc(p.name)}</option>`)
        .join('');
      el.headerMid.innerHTML = `
        <div class="switcher">
          <select class="switcher-select" data-action="switch-project" aria-label="Chọn dự án">${options}</select>
          <span class="switcher-caret">${ICON.caret}</span>
        </div>`;
    } else if (!S.isPersistent()) {
      // Mở bằng file:// thì browser chặn lưu trữ, dữ liệu mất khi tải lại trang.
      el.headerMid.innerHTML = `
        <div class="header-warn" title="Chạy qua web server hoặc mở bằng start-demo.bat để lưu được dữ liệu">
          Dữ liệu sẽ mất khi tải lại trang — hãy mở bằng <strong>start-demo.bat</strong>
        </div>`;
    } else {
      el.headerMid.innerHTML = '';
    }
  }

  function renderSidebar() {
    const project = S.getActiveProject();
    // Đang sửa dự án thì không tô sáng mục "Tạo dự án mới".
    const activeNav = ui.view === 'new'
      ? (ui.editingProjectId ? null : 'new')
      : (ui.view === 'process' ? 'projects' : ui.view);

    const navItem = (view, icon, label) => `
      <button type="button" class="nav-item${activeNav === view ? ' is-active' : ''}" data-action="go-${view}">
        <span class="nav-icon">${icon}</span> ${label}
      </button>`;

    // Chỉ hiện danh sách 8 giai đoạn khi đang ở trong quy trình của một dự án.
    const stageNav = project && ui.view === 'process' ? `
      <div class="side-label">Quy trình đầu tư</div>
      <nav class="stage-nav">${D.STAGES.map((stage) => {
        const apply = D.resolveApply(stage, project.profile);
        const cls = [
          'stage-link',
          stage.id === ui.activeStage ? 'is-active' : '',
          apply === APPLY.NO ? 'is-na' : '',
        ].filter(Boolean).join(' ');
        const docs = countStageDocs(project, stage);
        return `
          <button type="button" class="${cls}" data-action="goto-stage" data-stage="${stage.id}">
            <span class="stage-num">${stage.stageIndex}</span>
            <span class="sl-name">${esc(stage.name.split('(')[0].trim())}</span>
            ${docs ? '<span class="stage-dot" title="Đã có tài liệu"></span>' : ''}
          </button>`;
      }).join('')}</nav>` : '';

    el.sidebar.innerHTML = `
      <div class="side-brand">
        <img class="side-brand-logo" src="assets/shield.svg" alt="Hacom Holdings">
        <div class="side-brand-text">
          <span class="side-brand-title">Hacom Holdings</span>
          <span class="side-brand-sub">Quản lý hồ sơ dự án đầu tư</span>
        </div>
      </div>

      <nav class="side-nav">
        ${navItem('dashboard', ICON.grid, 'Dashboard')}
        <div class="side-label">DỰ ÁN</div>
        ${navItem('projects', ICON.folderLine, 'Tất cả dự án')}
        <button type="button" class="nav-item${activeNav === 'new' ? ' is-active' : ''}" data-action="new-project">
          <span class="nav-icon">${ICON.plus}</span> Tạo dự án mới
        </button>
        <div class="side-label">BÁO CÁO</div>
        ${navItem('report', ICON.chart, 'Báo cáo tổng hợp')}
        ${stageNav}
      </nav>

      <div class="side-foot">
        <div class="tip-card">
          <div class="tip-title"><span class="tip-bulb">${ICON.bulb}</span> Mẹo sử dụng</div>
          <div class="tip-text">${ui.view === 'report' ? TIP_TEXT.report : TIP_TEXT.default}</div>
        </div>
        <div class="side-watermark"><img src="assets/watermark.svg" alt=""></div>
        <div class="side-copy">&copy; 2026 Hacom Holdings<br>Quản lý hồ sơ dự án đầu tư</div>
      </div>`;
  }

  /** Đếm tài liệu trong một giai đoạn, để hiện dấu chấm ở sidebar. */
  function countStageDocs(project, stage) {
    let total = 0;
    const walk = (node) => {
      total += S.getDocuments(project.id, node.id).length;
      node.children.forEach(walk);
    };
    stage.children.forEach(walk);
    return total;
  }

  /* ------------------------------------------------------------ views */

  function projectTableRow(project) {
    const r = computeReadiness(project);
    const status = projectStatus(project, r);
    const info = STATUS_INFO[status];
    const codeSum = [...project.name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const tone = AVATAR_TONES[codeSum % AVATAR_TONES.length];
    // Tiến độ quy trình = số giai đoạn đã có tài liệu, màu theo trạng thái.
    const usedStages = D.STAGES.filter((s) => countStageDocs(project, s) > 0).length;
    const pct = Math.round((usedStages / D.STAGES.length) * 100);
    const desc = project.profile.dia_diem
      ? `Dự án đầu tư tại ${esc(project.profile.dia_diem)}.`
      : 'Chưa nhập địa điểm.';
    const menuHtml = ui.menuFor === project.id
      ? `<div class="row-menu">${PROJECT_MENU_HTML.replaceAll('__ID__', project.id)}</div>`
      : '';

    return `
      <tr>
        <td>
          <div class="pj-cell">
            <span class="pj-avatar ${tone}">${esc(projectInitials(project.name))}</span>
            <div class="pj-info">
              <div class="pj-name">${esc(project.name)}</div>
              <div class="pj-code">Mã dự án: ${projectCode(project)}</div>
            </div>
          </div>
        </td>
        <td class="td-desc">${desc}</td>
        <td>
          <div class="prog-stack">
            <div class="prog-text">${usedStages} / ${D.STAGES.length} bước</div>
            <div class="prog-bar"><div class="prog-fill pf-${status}" style="width:${pct}%"></div></div>
          </div>
        </td>
        <td><span class="status-chip ${info.cls}">${info.label}</span></td>
        <td class="td-muted">${relativeTime(projectLastUpdate(project))}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="btn-square" data-action="open-project" data-id="${project.id}"
                    title="Mở dự án" aria-label="Mở dự án ${esc(project.name)}">${ICON.folderLine}</button>
            <div class="menu-wrap">
              <button type="button" class="btn-square" data-action="toggle-menu" data-id="${project.id}"
                      title="Thao tác khác" aria-label="Thao tác khác cho ${esc(project.name)}">${ICON.dots}</button>
              ${menuHtml}
            </div>
          </div>
        </td>
      </tr>`;
  }

  function projectTableBody(projects, hasAny = true) {
    if (!projects.length) {
      const msg = hasAny
        ? 'Không có dự án nào khớp bộ lọc hiện tại.'
        : 'Chưa có dự án nào. Bấm “Tạo dự án mới” để bắt đầu.';
      return `
        <tr>
          <td colspan="6">
            <div class="table-empty">${msg}</div>
          </td>
        </tr>`;
    }
    return projects.map(projectTableRow).join('');
  }

  function renderDashboard() {
    const state = S.getState();
    const projects = state.projects;
    const readings = projects.map((p) => ({ project: p, r: computeReadiness(p) }));

    const byStatus = { done: 0, run: 0, wait: 0, idle: 0 };
    readings.forEach(({ project, r }) => { byStatus[projectStatus(project, r)] += 1; });
    const runningIn = readings.filter(({ r }) => r.docCount > 0).length;

    const filtered = filterProjects(projects);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    ui.page = Math.min(Math.max(1, ui.page), totalPages);
    const start = (ui.page - 1) * PAGE_SIZE;
    const rows = filtered.slice(start, start + PAGE_SIZE);

    el.main.innerHTML = `
      <div class="wrap is-wide">
        <div class="page-head">
          <h1 class="welcome">Chào mừng bạn trở lại! 👋</h1>
          <p class="page-sub">Theo dõi tổng quan tình hình quản lý hồ sơ dự án và các quy trình đang thực hiện.</p>
        </div>

        <div class="stat-grid">
          ${statCardHtml('tone-red', ICON.folderFill, 'Tổng dự án', projects.length, 'Đang quản lý')}
          ${statCardHtml('tone-green', ICON.clipboard, 'Quy trình đang chạy', byStatus.run, `Trong ${runningIn} dự án`)}
          ${statCardHtml('tone-orange', ICON.clock, 'Chờ xử lý', byStatus.wait, 'Cần hành động')}
          ${statCardHtml('tone-purple', ICON.check, 'Hoàn thành', byStatus.done, 'Quy trình đã xong')}
        </div>

        <div class="section-head">
          <div>
            <h2 class="section-title">Danh sách dự án</h2>
            <div class="section-sub">Quản lý và theo dõi tiến độ các dự án của bạn.</div>
          </div>
        </div>

        ${toolbarHtml()}

        <div class="card">
          <div class="table-wrap">
            <table class="pj-table">
              <thead>${PROJECT_TABLE_HEAD}</thead>
              <tbody>${projectTableBody(rows, projects.length > 0)}</tbody>
            </table>
          </div>
          <div id="table-foot-slot">${tableFootHtml(filtered)}</div>
        </div>
      </div>`;
  }

  function renderProjectList() {
    const all = S.getState().projects;
    const filtered = filterProjects(all);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    ui.page = Math.min(Math.max(1, ui.page), totalPages);
    const start = (ui.page - 1) * PAGE_SIZE;
    const rows = filtered.slice(start, start + PAGE_SIZE);

    el.main.innerHTML = `
      <div class="wrap is-wide">
        <div class="page-head">
          <h1>Tất cả dự án</h1>
          <p class="page-sub">Danh sách tất cả dự án trong hệ thống.</p>
        </div>

        ${toolbarHtml()}

        <div class="card">
          <div class="table-wrap">
            <table class="pj-table">
              <thead>${PROJECT_TABLE_HEAD}</thead>
              <tbody>${projectTableBody(rows, all.length > 0)}</tbody>
            </table>
          </div>
          <div id="table-foot-slot">${tableFootHtml(filtered)}</div>
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------ report */

  /** Donut trạng thái dự án — 4 màu trạng thái, mỗi phần có nhãn số nên không chỉ đọc bằng màu. */
  const DONUT_COLORS = { done: '#16a34a', run: '#2563eb', wait: '#7c3aed', idle: '#c2c9d4' };

  function donutHtml(byStatus, total) {
    const entries = ['done', 'run', 'wait', 'idle'].map((k) => ({
      key: k, label: STATUS_INFO[k].label, count: byStatus[k],
    }));
    const C = 2 * Math.PI * 56;
    let cumulative = 0;
    const segs = entries.filter((e) => e.count > 0).map((e) => {
      const frac = e.count / total;
      const dash = Math.max(frac * C - 1.5, 0.5); // khe 1.5 giữa các đoạn
      const seg = `<circle cx="70" cy="70" r="56" fill="none" stroke="${DONUT_COLORS[e.key]}"
        stroke-width="16" stroke-dasharray="${dash.toFixed(2)} ${C.toFixed(2)}"
        stroke-dashoffset="${(-cumulative).toFixed(2)}"><title>${e.label}: ${e.count}</title></circle>`;
      cumulative += frac * C;
      return seg;
    }).join('');

    const legend = entries.map((e) => `
      <div class="legend-row">
        <span class="lg-dot" style="background:${DONUT_COLORS[e.key]}"></span>
        <span class="lg-name">${e.label}</span>
        <span class="lg-count">${e.count}</span>
        <span class="lg-pct">${total ? Math.round((e.count / total) * 100) : 0}%</span>
      </div>`).join('');

    return `
      <div class="donut-body">
        <svg class="donut-svg" viewBox="0 0 140 140" role="img" aria-label="Phân bố dự án theo trạng thái">
          <circle cx="70" cy="70" r="56" fill="none" stroke="#f1f4f8" stroke-width="16"/>
          <g transform="rotate(-90 70 70)">${segs}</g>
          <text class="dn-value" x="70" y="66" text-anchor="middle">${total}</text>
          <text class="dn-label" x="70" y="84" text-anchor="middle">Dự án</text>
        </svg>
        <div class="chart-legend">${legend}</div>
      </div>`;
  }

  /** Hoạt động mỗi ngày: ngày tạo dự án + ngày đẩy tài liệu, trong khoảng đã chọn. */
  function activitySeries(days) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = new Map();
    const labels = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      buckets.set(key, 0);
      labels.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const add = (iso) => {
      const key = dayKey(new Date(iso));
      if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1);
    };
    S.getState().projects.forEach((p) => add(p.createdAt));
    S.getState().documents.forEach((doc) => add(doc.uploadedAt));
    return { labels, counts: [...buckets.values()] };
  }

  function lineChartHtml(series) {
    const W = 640, H = 170, L = 30, R = 10, T = 14, B = 24;
    const innerW = W - L - R;
    const innerH = H - T - B;
    const maxCount = Math.max(...series.counts, 1);
    const n = series.counts.length;
    const x = (i) => n <= 1 ? L + innerW / 2 : L + (i / (n - 1)) * innerW;
    const y = (c) => T + innerH - (c / maxCount) * innerH;

    const grid = [0, maxCount / 2, maxCount].map((c) => {
      const gy = y(c);
      return `
        <line x1="${L}" y1="${gy.toFixed(1)}" x2="${W - R}" y2="${gy.toFixed(1)}"
              stroke="#e8edf3" stroke-width="1"/>
        <text class="ax-t" x="${L - 5}" y="${(gy + 3).toFixed(1)}" text-anchor="end">${Math.round(c)}</text>`;
    }).join('');

    const step = Math.max(1, Math.ceil(n / 7));
    const xLabels = series.labels.map((lb, i) => (i % step === 0 || i === n - 1
      ? `<text class="ax-t" x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${lb}</text>`
      : '')).join('');

    const pts = series.counts.map((c, i) => `${x(i).toFixed(1)},${y(c).toFixed(1)}`).join(' ');
    const path = `M${pts.split(' ').join(' L')}`;
    const area = `${path} L${x(n - 1).toFixed(1)},${(T + innerH).toFixed(1)} L${x(0).toFixed(1)},${(T + innerH).toFixed(1)} Z`;
    const dots = series.counts.map((c, i) => `
      <circle class="ln-dot" cx="${x(i).toFixed(1)}" cy="${y(c).toFixed(1)}" r="3">
        <title>${series.labels[i]}: ${c} hoạt động</title>
      </circle>`).join('');

    return `
      <svg class="line-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Số hoạt động theo ngày">
        ${grid}
        <path d="${area}" fill="rgba(228,3,46,0.07)"/>
        <path d="${path}" fill="none" stroke="#e4032e" stroke-width="2" stroke-linejoin="round"/>
        ${dots}
        ${xLabels}
      </svg>`;
  }

  /** Địa điểm có nhiều dự án nhất — lấy từ dữ liệu thật, không bịa. */
  function topLocationsHtml(projects) {
    const counts = new Map();
    projects.forEach((p) => {
      const key = p.profile.dia_diem || 'Chưa nhập';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = Math.max(...rows.map(([, c]) => c), 1);
    return rows.map(([name, count]) => `
      <div class="hbar-row">
        <span class="hb-name">${esc(name)}</span>
        <div class="hb-track"><div class="hb-fill" style="width:${(count / max) * 100}%"></div></div>
        <span class="hb-count">${count}</span>
      </div>`).join('');
  }

  function recentListHtml(projects, limit = 5) {
    const sorted = [...projects]
      .sort((a, b) => new Date(projectLastUpdate(b)).getTime() - new Date(projectLastUpdate(a)).getTime())
      .slice(0, limit);
    return sorted.map((project) => {
      const info = STATUS_INFO[projectStatus(project)];
      const tone = AVATAR_TONES[[...project.name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length];
      return `
        <div class="recent-row">
          <span class="pj-avatar ${tone}">${esc(projectInitials(project.name))}</span>
          <div class="recent-info">
            <div class="pj-name">${esc(project.name)}</div>
            <div class="pj-code">${relativeTime(projectLastUpdate(project))}</div>
          </div>
          <span class="status-chip ${info.cls}">${info.label}</span>
        </div>`;
    }).join('');
  }

  function renderReport() {
    const projects = S.getState().projects;

    if (!projects.length) {
      el.main.innerHTML = `
        <div class="wrap is-wide">
          <h1 class="welcome">Báo cáo tổng hợp</h1>
          <div class="empty">
            <h2>Chưa có dữ liệu để tổng hợp</h2>
            <p>Tạo dự án và đẩy tài liệu lên, trang này sẽ tổng hợp độ phủ hồ sơ theo từng giai đoạn.</p>
            <button type="button" class="btn btn-primary" data-action="new-project">${ICON.plus} Tạo dự án mới</button>
          </div>
        </div>`;
      return;
    }

    const readings = projects.map((p) => ({ project: p, r: computeReadiness(p) }));
    const totalDocs = readings.reduce((acc, x) => acc + x.r.docCount, 0);
    const usedStagesTotal = readings.reduce(
      (acc, { project }) => acc + D.STAGES.filter((s) => countStageDocs(project, s) > 0).length, 0);
    const byStatus = { done: 0, run: 0, wait: 0, idle: 0 };
    readings.forEach(({ project, r }) => { byStatus[projectStatus(project, r)] += 1; });

    const days = ui.reportRange === '30d' ? 30 : 7;
    const series = activitySeries(days);
    const rangeSelect = `
      <div class="select-pill-wrap">
        <select class="select-pill" data-action="report-range" aria-label="Khoảng thời gian">
          <option value="7d"${ui.reportRange === '7d' ? ' selected' : ''}>7 ngày qua</option>
          <option value="30d"${ui.reportRange === '30d' ? ' selected' : ''}>30 ngày qua</option>
        </select>
        <span class="sp-caret">${ICON.caret}</span>
      </div>`;

    el.main.innerHTML = `
      <div class="wrap is-wide">
        <div class="page-head is-split">
          <div>
            <h1>Báo cáo tổng hợp</h1>
            <p class="page-sub">Tổng quan tình hình dự án trong hệ thống.</p>
          </div>
          <div class="toolbar-right">
            ${rangeSelect}
            <button type="button" class="btn btn-primary btn-sm" data-action="export-report">
              ${ICON.download} Xuất báo cáo
            </button>
          </div>
        </div>

        <div class="stat-grid">
          ${statCardHtml('tone-red', ICON.folderFill, 'Tổng dự án', projects.length, 'Trong hệ thống')}
          ${statCardHtml('tone-blue', ICON.upload, 'Tài liệu ghi nhận', totalDocs, 'Chỉ lưu metadata, không lưu nội dung')}
          ${statCardHtml('tone-gold', ICON.grid, 'Giai đoạn có hồ sơ', usedStagesTotal, `Trên ${projects.length} dự án`)}
          ${statCardHtml('tone-green', ICON.check, 'Dự án hoàn thành', byStatus.done, 'Đủ hồ sơ mọi bước áp dụng')}
        </div>

        <div class="report-grid">
          <div class="card">
            <div class="card-head"><div><h2>Tiến độ dự án theo trạng thái</h2></div></div>
            <div class="card-body">${donutHtml(byStatus, projects.length)}</div>
          </div>
          <div class="card">
            <div class="card-head">
              <div>
                <h2>Dự án theo thời gian cập nhật</h2>
                <div class="card-sub">Ngày tạo dự án và ngày đẩy tài liệu, ${ui.reportRange === '30d' ? '30 ngày' : '7 ngày'} gần nhất.</div>
              </div>
            </div>
            <div class="card-body">${lineChartHtml(series)}</div>
          </div>
          <div class="card">
            <div class="card-head">
              <div>
                <h2>Top địa điểm dự án</h2>
                <div class="card-sub">Số dự án theo tỉnh/thành đã khai.</div>
              </div>
            </div>
            <div class="card-body">${topLocationsHtml(projects)}</div>
          </div>
          <div class="card">
            <div class="card-head">
              <div>
                <h2>Cập nhật gần đây</h2>
                <div class="card-sub">Hoạt động mới nhất trên các dự án.</div>
              </div>
            </div>
            <div class="card-body">${recentListHtml(projects)}</div>
          </div>
        </div>
      </div>`;
  }

  function renderField(field) {
    const value = ui.draftProfile[field.id] || '';
    let control = '';

    if (field.type === 'text') {
      control = `<input type="text" data-profile="${field.id}" value="${esc(value)}" placeholder="Ví dụ: Khu đô thị ABC">`;
    } else if (field.type === 'location') {
      const suggestions = locationSuggestions(value);
      const active = Math.min(ui.locationActive, suggestions.length - 1);
      control = `
        <div class="location-combobox${ui.locationOpen ? ' is-open' : ''}">
          <input type="text" data-profile="${field.id}" data-location-input
                 value="${esc(value)}" placeholder="Gõ H để tìm Hà Nội, Hải Phòng..."
                 role="combobox" aria-autocomplete="list" aria-controls="location-listbox"
                 aria-expanded="${ui.locationOpen}" ${active >= 0 ? `aria-activedescendant="location-option-${active}"` : ''}
                 autocomplete="off">
          <div class="location-options" id="location-listbox" role="listbox">
            ${locationOptionsHtml(suggestions, active)}
          </div>
        </div>`;
    } else if (field.type === 'yesno') {
      control = `<div class="segmented" role="group" aria-label="${esc(field.label)}">${D.YESNO_OPTIONS.map((opt) => `
        <button type="button" data-profile-set="${field.id}" data-value="${opt.value}"
                aria-pressed="${value === opt.value}">${opt.label}</button>`).join('')}</div>`;
    } else {
      control = `<select data-profile="${field.id}">
        <option value="">— Chọn —</option>
        ${field.options.map((opt) => `<option value="${opt.value}"${value === opt.value ? ' selected' : ''}>${esc(opt.label)}</option>`).join('')}
      </select>`;
    }

    return `
      <div class="field">
        <label>${esc(field.label)}${field.required ? ' <span class="req">*</span>' : ''}</label>
        ${control}
        <div class="hint">${esc(field.hint)}</div>
      </div>`;
  }

  function renderNewProject() {
    const isEditing = ui.editingProjectId !== null;
    const byId = (id) => D.PROFILE_FIELDS.find((f) => f.id === id);

    const groups = [
      { title: 'Thông tin chung', ids: ['ten_du_an', 'dia_diem', 'tinh_trang_qh'] },
      { title: 'Nhà đầu tư & đất đai', ids: ['hinh_thuc_ndt', 'co_gpmb', 'co_cuong_che'] },
      { title: 'Môi trường, xây dựng & PCCC', ids: ['thuoc_dtm', 'thuoc_gpmt', 'phai_xin_gpxd', 'thuoc_pccc'] },
    ];

    const body = groups.map((group) => `
      <div class="form-group">
        <div class="form-group-title">${esc(group.title)}</div>
        <div class="profile-grid">${group.ids.map((id) => renderField(byId(id))).join('')}</div>
      </div>`).join('');

    el.main.innerHTML = `
      <div class="wrap">
        <div class="page-head">
          <div class="crumb">
            <span>Dự án</span><span class="sep">/</span>
            <span>${isEditing ? 'Cập nhật đặc điểm' : 'Tạo mới'}</span>
          </div>
          <h1>${isEditing ? 'Cập nhật đặc điểm dự án' : 'Tạo dự án mới'}</h1>
          <p class="page-sub">10 câu hỏi này quyết định dự án phải đi qua những bước nào trong 130 bước.</p>
        </div>

        <div class="callout">
          <span class="co-icon">💡</span>
          <div>
            <strong>Chưa biết thì chọn &ldquo;Chưa xác định&rdquo;.</strong>
            Bước liên quan vẫn hiện và được đếm riêng, thay vì bị ẩn đi.
            Thiếu dữ liệu không đồng nghĩa với không cần làm.
          </div>
        </div>

        <div class="card">
          <div class="card-body is-flush">${body}</div>
          <div class="form-foot">
            <button type="button" class="btn btn-primary" data-action="save-project">
              ${isEditing ? 'Lưu thay đổi' : 'Tạo dự án & xem quy trình'}
            </button>
            <button type="button" class="btn btn-ghost" data-action="cancel-new">Hủy</button>
            <div class="spacer"></div>
            ${ui.profileError ? `<div class="form-error">${esc(ui.profileError)}</div>` : ''}
          </div>
        </div>
      </div>`;
  }

  function nodeChips(node, project, apply) {
    const chips = [];

    if (node.kind !== 'task') {
      chips.push(`<span class="chip chip-kind">${esc(D.KIND_LABEL[node.kind] || node.kind)}</span>`);
    }
    if (node.gate) {
      chips.push('<span class="chip chip-gate">Mốc kiểm soát</span>');
    }
    if (node.note) {
      chips.push(`<span class="chip chip-note" title="${esc(node.note)}">Cần xác nhận</span>`);
    }

    if (apply === APPLY.NO) {
      chips.push('<span class="chip chip-na">Không áp dụng</span>');
    } else if (apply === APPLY.UNKNOWN) {
      chips.push('<span class="chip chip-unknown">Chưa xác định</span>');
    }

    if (isFolder(node) && apply !== APPLY.NO) {
      const count = S.getDocuments(project.id, node.id).length;
      if (count) chips.push(`<span class="chip chip-count">${count} tài liệu</span>`);

      chips.push(S.getChecklist(node.id)
        ? '<span class="chip chip-std-set">Đã có chuẩn</span>'
        : '<span class="chip chip-std-none">Chuẩn: chưa thiết lập</span>');
    }

    return chips.join('');
  }

  function renderNode(node, project, inherited) {
    const apply = D.resolveApply(node, project.profile, inherited);
    const hasChildren = node.children.length > 0;
    const isOpen = ui.openNodes.has(node.id);
    const folder = isFolder(node);
    const cls = [
      'node',
      `level-${Math.min(node.level, 3)}`,
      folder ? 'is-folder' : 'is-container',
      isOpen ? 'is-open' : '',
      apply === APPLY.NO ? 'is-na' : '',
    ].filter(Boolean).join(' ');

    const children = hasChildren && isOpen
      ? `<div class="node-children">${node.children.map((child) => renderNode(child, project, apply)).join('')}</div>`
      : '';

    const caret = hasChildren
      ? `<button type="button" class="node-caret-btn" data-action="toggle-node" data-id="${node.id}"
                 aria-expanded="${isOpen}" aria-label="${isOpen ? 'Thu gọn' : 'Mở rộng'} ${esc(node.name)}">
           <span class="node-caret">${ICON.caret}</span>
         </button>`
      : '<span class="node-caret-btn is-empty"></span>';

    const rowAction = folder ? 'open-folder' : 'toggle-node';
    const rowLabel = folder ? `Mở thư mục ${node.name}` : `${isOpen ? 'Thu gọn' : 'Mở rộng'} nhóm ${node.name}`;

    return `
      <div class="${cls}">
        <div class="node-row">
          ${caret}
          <button type="button" class="node-open" data-action="${rowAction}" data-id="${node.id}"
                  ${!folder ? `aria-expanded="${isOpen}"` : ''} aria-label="${esc(rowLabel)}">
            ${folder ? `<span class="node-folder-icon">${ICON.folder}</span>` : ''}
            <span class="node-name">${esc(node.name)}</span>
            <span class="node-meta">${nodeChips(node, project, apply)}</span>
          </button>
        </div>
        ${children}
      </div>`;
  }

  function renderProcess() {
    const project = S.getActiveProject();
    if (!project) { ui.view = 'projects'; render(); return; }

    if (!ui.activeStage || !D.STAGES.some((s) => s.id === ui.activeStage)) {
      ui.activeStage = D.STAGES[0].id;
    }

    const stage = D.STAGES.find((s) => s.id === ui.activeStage);
    const apply = D.resolveApply(stage, project.profile);
    const r = computeReadiness(project);
    const statusInfo = STATUS_INFO[projectStatus(project, r)];
    const unknownFields = D.PROFILE_FIELDS.filter((f) => (
      f.type !== 'text' && f.type !== 'location'
      && (!project.profile[f.id] || project.profile[f.id] === 'chua_xac_dinh')
    ));

    const tree = stage.children.map((child) => renderNode(child, project, apply)).join('');
    const stageName = stage.name.split('(')[0].trim();

    el.main.innerHTML = `
      <div class="wrap">
        <div class="page-head">
          <div class="crumb">
            <span>Giai đoạn ${stage.stageIndex} trên ${D.STAGES.length}</span>
          </div>
          <div class="head-row">
            <h1>${esc(stageName)}</h1>
            <span class="status-chip ${statusInfo.cls}">${statusInfo.label}</span>
          </div>
          <p class="page-sub">
            ${esc(project.name)} &middot; ${esc(project.profile.dia_diem || 'Chưa nhập địa điểm')}
            &middot; Mã dự án: ${projectCode(project)}
          </p>
        </div>

        <div class="stat-grid is-compact">
          ${statCardHtml('tone-blue', ICON.folder, 'Folder áp dụng', r.applicable, `trên ${r.withStandard} folder có chuẩn`)}
          ${statCardHtml('tone-orange', ICON.upload, 'Tài liệu đã đẩy', r.docCount, 'trong toàn dự án')}
          ${statCardHtml('tone-purple', ICON.bulb, 'Chờ xác định', r.unknown, 'thiếu dữ liệu đặc điểm')}
          ${statCardHtml('tone-green', ICON.check, 'Đã đủ chuẩn hồ sơ', r.complete, 'theo chuẩn đã xác nhận')}
        </div>

        <div class="callout callout-art">
          <span class="co-icon">${ICON.bulb}</span>
          <div>
            <strong>Chuẩn hồ sơ chưa được thiết lập &mdash; đúng như dự kiến.</strong>
            Nhóm quy trình dùng để đóng/mở các nhánh; chỉ mục có biểu tượng folder mới nhận tài liệu.
            Mở một folder để thấy khung &ldquo;Hồ sơ cần có&rdquo; đang trống, kèm chỗ ghi lại
            tài liệu mà folder đó thực sự cần.
          </div>
          <img class="co-art" src="assets/watermark.svg" alt="">
        </div>

        ${unknownFields.length ? `
        <div class="card">
          <div class="card-head">
            <div>
              <h2>Còn ${unknownFields.length} câu hỏi chưa trả lời</h2>
              <div class="card-sub">Bước liên quan vẫn hiện, gắn nhãn &ldquo;Chưa xác định&rdquo; chứ không bị ẩn.</div>
            </div>
            <button type="button" class="btn btn-sm" data-action="edit-profile">Cập nhật</button>
          </div>
        </div>` : ''}

        <div class="card">
          <div class="card-head">
            <div>
              <h2>Các bước trong giai đoạn</h2>
              <div class="card-sub">${stage.children.length} nhóm chính</div>
            </div>
            <div style="display:flex;gap:6px">
              <button type="button" class="btn btn-sm" data-action="expand-all">Mở hết</button>
              <button type="button" class="btn btn-sm" data-action="collapse-all">Thu hết</button>
            </div>
          </div>
          ${apply === APPLY.NO ? `
            <div class="card-body">
              <div class="state-note">
                Giai đoạn này <strong>không áp dụng</strong> với dự án hiện tại theo đặc điểm đã khai.
                Nội dung vẫn được giữ để tra cứu.
              </div>
            </div>` : ''}
          <div class="card-body is-flush"><div class="tree">${tree}</div></div>
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------ drawer */

  function renderDrawer() {
    const node = D.NODE_BY_ID.get(ui.drawerNodeId);
    const project = S.getActiveProject();
    if (!node || !project || !isFolder(node)) {
      closeDrawer();
      return;
    }

    const path = nodePath(node);
    el.drawerTitle.textContent = node.name;
    el.drawerPath.textContent = path.slice(0, -1)
      .map((part) => part.split('(')[0].trim())
      .join('  ›  ') || 'Giai đoạn';

    const docs = S.getDocuments(project.id, node.id);
    const checklist = S.getChecklist(node.id);
    const harvested = S.harvestNode(node.id);
    const dictionary = S.getDocTypeDictionary();
    const apply = (() => {
      // Tính lại mức áp dụng có kế thừa từ cha.
      const chain = [];
      let current = node;
      while (current) { chain.unshift(current); current = current.parentId ? D.NODE_BY_ID.get(current.parentId) : null; }
      return chain.reduce((acc, item) => D.resolveApply(item, project.profile, acc), APPLY.YES);
    })();

    /* --- Khung "Hồ sơ cần có": phần quan trọng nhất của demo --- */
    let standardHtml;
    if (checklist) {
      const names = new Set(docs.map((doc) => doc.docType.trim().toLowerCase()));
      const items = checklist.items.map((item) => {
        const have = names.has(item.name.trim().toLowerCase());
        return `
          <div class="checklist-item ${have ? 'is-have' : 'is-missing'}">
            <span class="ci-box">${have ? '✅' : '⬜'}</span>
            <span class="ci-name">${esc(item.name)}</span>
            <span class="chip ${item.level === 'bat_buoc' ? 'chip-gate' : 'chip-kind'}">
              ${item.level === 'bat_buoc' ? 'Bắt buộc' : 'Có điều kiện'}
            </span>
          </div>`;
      }).join('');

      const missing = checklist.items.filter((item) => (
        item.level === 'bat_buoc' && !names.has(item.name.trim().toLowerCase())
      )).length;

      standardHtml = `
        <div class="standard-box is-set">
          <div class="std-head">
            <span class="std-icon">${missing ? '⚠️' : '✅'}</span>
            <div>
              <div class="std-title">Hồ sơ cần có &mdash; đã thiết lập</div>
              <div class="std-text">
                ${missing ? `Còn thiếu <strong>${missing}</strong> tài liệu bắt buộc.` : 'Đã có đủ tài liệu bắt buộc.'}
                Chuẩn do ${esc(checklist.confirmedBy)} xác nhận ngày ${formatDate(checklist.confirmedAt)}.
              </div>
            </div>
          </div>
          <div class="checklist">${items}</div>
          <div style="margin-top:13px">
            <button type="button" class="btn btn-sm" data-action="revoke-checklist" data-id="${node.id}">
              Bỏ chuẩn, quay lại trạng thái chưa thiết lập
            </button>
          </div>
        </div>`;
    } else {
      standardHtml = `
        <div class="standard-box">
          <div class="std-head">
            <span class="std-icon">📋</span>
            <div>
              <div class="std-title">Hồ sơ cần có: chưa thiết lập</div>
              <div class="std-text">
                Hệ thống chưa biết bước này cần tài liệu gì, nên chưa thể báo đủ hay thiếu.
                Theo anh/chị, bước này phải có những tài liệu nào? Ghi vào đây, kể cả chưa chắc chắn.
              </div>
            </div>
          </div>
          <div class="proposal-form">
            <div class="row">
              <input type="text" id="proposal-name" placeholder="Tên tài liệu cần có...">
              <select id="proposal-level" aria-label="Mức yêu cầu">
                <option value="bat_buoc">Bắt buộc</option>
                <option value="co_dieu_kien">Có điều kiện</option>
                <option value="chua_xac_dinh">Chưa rõ</option>
              </select>
            </div>
            <div class="row">
              <input type="text" id="proposal-by" placeholder="Người đề xuất (tên hoặc bộ phận)">
              <button type="button" class="btn btn-gold" data-action="add-proposal" data-id="${node.id}">
                Thêm
              </button>
            </div>
          </div>
        </div>`;
    }

    /* --- Danh sách tổng hợp từ thực tế --- */
    const harvestHtml = harvested.length ? `
      <div class="drawer-section">
        <h3>Tài liệu ghi nhận được ở bước này</h3>
        <div class="harvest">
          ${harvested.map((item) => `
            <div class="harvest-row">
              <span class="hr-name">${esc(item.name)}</span>
              <span class="hr-stat">
                ${item.uploadCount ? `${item.uploadCount} lần đẩy lên` : 'chỉ mới đề xuất'}
                ${item.projectCount > 1 ? ` · ${item.projectCount} dự án` : ''}
                ${item.proposedBy.length ? ` · đề xuất bởi ${esc(item.proposedBy.join(', '))}` : ''}
              </span>
            </div>`).join('')}
        </div>
        ${!checklist ? `
          <p style="font-size:12.5px;color:var(--muted);margin-bottom:11px;line-height:1.6">
            Khi danh sách này đã ổn định qua vài dự án, chốt thành chuẩn.
            Từ lúc đó bước này mới bắt đầu báo đủ/thiếu.
          </p>
          <div class="confirm-row">
            <input type="text" id="confirm-by" class="inline-input" placeholder="Người xác nhận (SME / pháp chế)">
            <button type="button" class="btn btn-primary btn-sm" data-action="confirm-checklist" data-id="${node.id}">
              Chốt thành chuẩn
            </button>
          </div>` : ''}
      </div>` : '';

    /* --- Đề xuất đang chờ --- */
    const proposals = S.getProposals(node.id);
    const proposalHtml = proposals.length ? `
      <div class="drawer-section">
        <h3>Đề xuất chưa chốt (${proposals.length})</h3>
        <div class="doc-list">
          ${proposals.map((item) => `
            <div class="doc-item">
              <div class="di-main">
                <div class="di-type">${esc(item.name)}</div>
                <div class="di-meta">
                  ${item.level === 'bat_buoc' ? 'Bắt buộc' : item.level === 'co_dieu_kien' ? 'Có điều kiện' : 'Chưa rõ'}
                  &middot; ${esc(item.proposedBy)} &middot; ${formatDate(item.createdAt)}
                </div>
              </div>
              <div class="di-actions">
                <button type="button" class="btn btn-ghost btn-icon" data-action="remove-proposal" data-id="${item.id}"
                        title="Xóa đề xuất" aria-label="Xóa đề xuất">${ICON.trash}</button>
              </div>
            </div>`).join('')}
        </div>
      </div>` : '';

    /* --- Upload --- */
    const uploadHtml = `
      <div class="drawer-section">
        <h3>Đẩy tài liệu vào bước này</h3>
        <div class="dropzone" id="dropzone">
          <div class="dz-icon">📄</div>
          <div class="dz-text">Kéo file vào đây hoặc <button type="button" class="btn btn-sm" data-action="pick-file">chọn file</button></div>
          <div class="dz-sub">Chỉ ghi nhận tên file và loại tài liệu.</div>
          <input type="file" id="file-input" multiple class="sr-only">
        </div>

        ${ui.pendingFiles.length ? `
          <div class="pending-list">
            ${ui.pendingFiles.map((file, index) => `
              <div class="pending-item">
                <span class="pi-name">${esc(file.name)}</span>
                <span class="pi-size">${formatSize(file.size)}</span>
                <button type="button" class="btn btn-ghost btn-sm" data-action="drop-pending" data-index="${index}"
                        aria-label="Bỏ file này">✕</button>
              </div>`).join('')}
          </div>

          <div class="upload-fields">
            <div>
              <label for="doc-type">Đây là tài liệu gì? <span class="req" style="color:var(--red)">*</span></label>
              <input type="text" id="doc-type" list="doc-type-list"
                     placeholder="Gõ tên loại tài liệu, hoặc chọn từ danh sách đã có">
              <datalist id="doc-type-list">
                ${dictionary.map((item) => `<option value="${esc(item.name)}"></option>`).join('')}
              </datalist>
            </div>
            <div>
              <label for="uploader">Người đẩy lên</label>
              <input type="text" id="uploader" placeholder="Tên hoặc bộ phận">
            </div>
            <button type="button" class="btn btn-primary" data-action="commit-upload" data-id="${node.id}">
              Lưu ${ui.pendingFiles.length} tài liệu
            </button>
          </div>` : ''}
      </div>`;

    /* --- Tài liệu đã có --- */
    const docsHtml = `
      <div class="drawer-section">
        <h3>Tài liệu đã có trong dự án này (${docs.length})</h3>
        ${docs.length ? `
          <div class="doc-list">
            ${docs.map((doc) => `
              <div class="doc-item">
                <div class="di-main">
                  <div class="di-type">
                    ${esc(doc.docType)}
                    ${doc.docType === 'Chưa phân loại' ? '<span class="chip chip-unknown">Chưa phân loại</span>' : ''}
                  </div>
                  <div class="di-file">${esc(doc.fileName)}</div>
                  <div class="di-meta">
                    ${formatSize(doc.fileSize)} &middot; ${esc(doc.uploader)} &middot; ${formatDate(doc.uploadedAt)}
                  </div>
                </div>
                <div class="di-actions">
                  <button type="button" class="btn btn-ghost btn-icon" data-action="retype-doc" data-id="${doc.id}"
                          title="Sửa loại tài liệu" aria-label="Sửa loại tài liệu">${ICON.edit}</button>
                  <button type="button" class="btn btn-ghost btn-icon" data-action="remove-doc" data-id="${doc.id}"
                          title="Xóa" aria-label="Xóa tài liệu">${ICON.trash}</button>
                </div>
              </div>`).join('')}
          </div>` : '<div class="state-note">Chưa có tài liệu nào ở bước này.</div>'}
      </div>`;

    const applyNote = apply === APPLY.NO
      ? `<div class="state-note" style="margin-bottom:18px">
           Bước này <strong>không áp dụng</strong> theo đặc điểm dự án đã khai. Vẫn có thể lưu tài liệu để tra cứu.
         </div>`
      : apply === APPLY.UNKNOWN
      ? `<div class="callout" style="margin-bottom:18px">
           <span class="co-icon">⚠️</span>
           <div><strong>Chưa xác định bước này có áp dụng hay không.</strong>
           Cần người có thẩm quyền kết luận. Hệ thống không tự suy thành &ldquo;không áp dụng&rdquo;.</div>
         </div>`
      : '';

    const noteHtml = node.note
      ? `<div class="callout" style="margin-bottom:18px">
           <span class="co-icon">🔎</span>
           <div><strong>Ghi chú về cấu trúc:</strong> ${esc(node.note)}</div>
         </div>`
      : '';

    // Chip trạng thái đưa lên header của drawer cho dễ thấy.
    const headChips = [];
    if (node.gate) headChips.push('<span class="chip chip-gate">Mốc kiểm soát</span>');
    headChips.push(`<span class="chip chip-kind">${esc(D.KIND_LABEL[node.kind] || node.kind)}</span>`);
    if (apply === APPLY.NO) headChips.push('<span class="chip chip-na">Không áp dụng</span>');
    if (apply === APPLY.UNKNOWN) headChips.push('<span class="chip chip-unknown">Chưa xác định</span>');
    headChips.push(checklist
      ? '<span class="chip chip-std-set">Đã có chuẩn</span>'
      : '<span class="chip chip-std-none">Chuẩn: chưa thiết lập</span>');
    el.drawerChips.innerHTML = headChips.join('');

    el.drawerBody.innerHTML = `
      ${applyNote}
      ${noteHtml}
      <div class="drawer-section">${standardHtml}</div>
      ${harvestHtml}
      ${proposalHtml}
      ${uploadHtml}
      ${docsHtml}`;

    bindDropzone();
  }

  function openDrawer(nodeId) {
    const node = D.NODE_BY_ID.get(nodeId);
    if (!isFolder(node)) return;
    ui.drawerNodeId = nodeId;
    ui.pendingFiles = [];
    el.drawer.classList.add('is-open');
    el.drawer.setAttribute('aria-hidden', 'false');
    el.drawerBackdrop.classList.add('is-open');
    renderDrawer();
    el.drawerClose.focus();
  }

  function closeDrawer() {
    ui.drawerNodeId = null;
    ui.pendingFiles = [];
    el.drawer.classList.remove('is-open');
    el.drawer.setAttribute('aria-hidden', 'true');
    el.drawerBackdrop.classList.remove('is-open');
  }

  function bindDropzone() {
    const zone = document.getElementById('dropzone');
    const input = document.getElementById('file-input');
    if (!zone || !input) return;

    ['dragenter', 'dragover'].forEach((evt) => zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add('is-over');
    }));

    ['dragleave', 'drop'].forEach((evt) => zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove('is-over');
    }));

    zone.addEventListener('drop', (e) => {
      const files = [...(e.dataTransfer?.files || [])];
      if (files.length) { ui.pendingFiles.push(...files); renderDrawer(); }
    });

    input.addEventListener('change', () => {
      const files = [...input.files];
      if (files.length) { ui.pendingFiles.push(...files); renderDrawer(); }
    });
  }

  /* ------------------------------------------------------------ actions */

  const actions = {
    'go-home'() {
      ui.view = 'dashboard';
      render();
    },

    'go-dashboard'() {
      ui.view = 'dashboard';
      render();
    },

    'go-projects'() {
      ui.view = 'projects';
      render();
    },

    'go-report'() {
      ui.view = 'report';
      render();
    },

    'filter-status'(ctrl) {
      // Nút cũ dùng data-value; select trạng thái dùng value.
      ui.statusFilter = ctrl.value ?? ctrl.dataset.value ?? 'all';
      ui.page = 1;
      render();
    },

    'report-range'(select) {
      ui.reportRange = select.value;
      render();
    },

    'page-first'() {
      ui.page = 1;
      render();
    },

    'page-prev'() {
      ui.page = Math.max(1, ui.page - 1);
      render();
    },

    'page-next'() {
      ui.page += 1;
      render();
    },

    'page-last'() {
      // Số trang được kẹp lại trong render; MAX đủ để nhảy trang cuối.
      ui.page = Number.MAX_SAFE_INTEGER;
      render();
    },

    'page-goto'(btn) {
      ui.page = Number(btn.dataset.page) || 1;
      render();
    },

    'export-report'() {
      window.print();
    },

    'toggle-menu'(btn) {
      const id = btn.dataset.id;
      ui.menuFor = ui.menuFor === id ? null : id;
      render();
      positionRowMenu(id);
    },

    'switch-project'(btn) {
      S.setActiveProject(btn.value);
      ui.view = 'process';
      render();
    },

    'new-project'() {
      if (ui.view !== 'new') ui.lastView = ui.view;
      ui.view = 'new';
      ui.draftProfile = {};
      ui.editingProjectId = null;
      ui.profileError = '';
      render();
    },

    'cancel-new'() {
      ui.editingProjectId = null;
      ui.profileError = '';
      ui.view = ui.lastView || (S.getActiveProject() ? 'process' : 'projects');
      render();
    },

    'save-project'() {
      if (!ui.draftProfile.ten_du_an?.trim()) {
        ui.profileError = 'Cần nhập tên dự án.';
        render();
        return;
      }
      // Địa điểm phải khớp một tỉnh/thành trong danh sách — gõ "B" rồi lưu không được chấp nhận.
      const province = matchProvince(ui.draftProfile.dia_diem);
      if (!province) {
        ui.profileError = 'Địa điểm phải là một tỉnh/thành trong danh sách gợi ý — hãy chọn một mục hiện ra khi gõ.';
        render();
        return;
      }
      ui.draftProfile.dia_diem = province;
      // Câu nào bỏ trống thì coi là "chưa xác định", không phải "không".
      D.PROFILE_FIELDS.forEach((field) => {
        if (field.type !== 'text' && field.type !== 'location' && !ui.draftProfile[field.id]) {
          ui.draftProfile[field.id] = 'chua_xac_dinh';
        }
      });

      if (ui.editingProjectId) {
        Object.entries(ui.draftProfile).forEach(([key, value]) => {
          S.updateProfileField(ui.editingProjectId, key, value);
        });
        ui.editingProjectId = null;
        ui.profileError = '';
        ui.view = ui.lastView || 'process';
        toast('Đã cập nhật đặc điểm dự án.');
        render();
        return;
      }

      S.createProject({ ...ui.draftProfile });
      ui.view = 'process';
      ui.activeStage = D.STAGES[0].id;
      ui.openNodes = new Set(D.STAGES[0].children.slice(0, 2).map((n) => n.id));
      ui.profileError = '';
      toast('Đã tạo dự án. Quy trình được sinh theo đặc điểm vừa khai.');
      render();
    },

    'open-project'(btn) {
      if (ui.view !== 'process') ui.lastView = ui.view;
      S.setActiveProject(btn.dataset.id);
      ui.view = 'process';
      ui.activeStage = D.STAGES[0].id;
      ui.openNodes = new Set(D.STAGES[0].children.slice(0, 2).map((n) => n.id));
      ui.menuFor = null;
      render();
    },

    'delete-project'(btn) {
      const project = S.getState().projects.find((p) => p.id === btn.dataset.id);
      if (!project) return;
      if (!confirm(`Xóa dự án "${project.name}" và toàn bộ tài liệu đã ghi nhận trong dự án này?`)) return;
      S.deleteProject(btn.dataset.id);
      ui.menuFor = null;
      // Ở lại màn hình hiện tại; chỉ rời quy trình nếu không còn dự án nào để xem.
      if (ui.view === 'process' && !S.getActiveProject()) ui.view = 'projects';
      toast('Đã xóa dự án.');
      render();
    },

    'goto-stage'(btn) {
      ui.activeStage = btn.dataset.stage;
      ui.view = 'process';
      render();
    },

    'toggle-node'(btn) {
      const id = btn.dataset.id;
      if (ui.openNodes.has(id)) ui.openNodes.delete(id);
      else ui.openNodes.add(id);
      render();
    },

    'open-folder'(btn) {
      const node = D.NODE_BY_ID.get(btn.dataset.id);
      if (isFolder(node)) openDrawer(node.id);
    },

    'select-location'(btn) {
      ui.draftProfile.dia_diem = btn.dataset.value;
      ui.locationOpen = false;
      ui.locationActive = -1;
      render();
      document.querySelector('[data-location-input]')?.focus();
    },

    'expand-all'() {
      const stage = D.STAGES.find((s) => s.id === ui.activeStage);
      const walk = (node) => { ui.openNodes.add(node.id); node.children.forEach(walk); };
      stage.children.forEach(walk);
      render();
    },

    'collapse-all'() {
      ui.openNodes.clear();
      render();
    },

    'edit-profile'(btn) {
      const id = btn.dataset.id || S.getState().activeProjectId;
      const project = S.getState().projects.find((p) => p.id === id);
      if (!project) return;
      S.setActiveProject(project.id);
      if (ui.view !== 'new') ui.lastView = ui.view;
      ui.draftProfile = { ...project.profile };
      ui.editingProjectId = project.id;
      ui.profileError = '';
      ui.menuFor = null;
      ui.view = 'new';
      render();
    },

    'pick-file'() {
      document.getElementById('file-input')?.click();
    },

    'drop-pending'(btn) {
      ui.pendingFiles.splice(Number(btn.dataset.index), 1);
      renderDrawer();
    },

    'commit-upload'(btn) {
      const project = S.getActiveProject();
      const typeInput = document.getElementById('doc-type');
      const docType = typeInput?.value.trim();
      if (!docType) {
        toast('Cần khai đây là tài liệu gì — đó chính là dữ liệu tạo ra checklist.', true);
        typeInput?.focus();
        return;
      }
      const uploader = document.getElementById('uploader')?.value;
      const count = ui.pendingFiles.length;
      S.addDocuments(project.id, btn.dataset.id, ui.pendingFiles, docType, uploader);
      const syncMeta = {
        projectName: project.name,
        nodePath: nodePathOf(btn.dataset.id),
        docType,
        uploader: uploader?.trim() || '',
      };
      ui.pendingFiles.forEach((file) => HacomSync.sendUpload(file, syncMeta));
      ui.pendingFiles = [];
      toast(`Đã ghi nhận ${count} tài liệu loại "${docType}".`);
      render();
      renderDrawer();
    },

    'remove-doc'(btn) {
      S.removeDocument(btn.dataset.id);
      render();
      renderDrawer();
    },

    'retype-doc'(btn) {
      const doc = S.getState().documents.find((item) => item.id === btn.dataset.id);
      if (!doc) return;
      const next = prompt('Loại tài liệu:', doc.docType);
      if (next === null) return;
      S.retypeDocument(doc.id, next);
      toast('Đã cập nhật loại tài liệu.');
      render();
      renderDrawer();
    },

    'add-proposal'(btn) {
      const nameInput = document.getElementById('proposal-name');
      const name = nameInput?.value.trim();
      if (!name) { nameInput?.focus(); return; }
      const level = document.getElementById('proposal-level')?.value;
      const by = document.getElementById('proposal-by')?.value;
      S.addProposal(btn.dataset.id, name, level, by);
      HacomSync.sendEvent('proposal', {
        nodePath: nodePathOf(btn.dataset.id),
        name,
        level,
        proposedBy: by?.trim() || '',
      });
      toast('Đã ghi lại đề xuất. Chưa thành chuẩn cho tới khi được xác nhận.', true);
      renderDrawer();
    },

    'remove-proposal'(btn) {
      S.removeProposal(btn.dataset.id);
      renderDrawer();
    },

    'confirm-checklist'(btn) {
      const nodeId = btn.dataset.id;
      const harvested = S.harvestNode(nodeId);
      if (!harvested.length) return;
      const by = document.getElementById('confirm-by')?.value;
      if (!by?.trim()) {
        toast('Cần ghi ai xác nhận — chuẩn phải có người chịu trách nhiệm.', true);
        document.getElementById('confirm-by')?.focus();
        return;
      }
      const proposals = S.getProposals(nodeId);
      const items = harvested.map((item) => {
        const proposal = proposals.find((p) => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
        return { name: item.name, level: proposal?.level === 'co_dieu_kien' ? 'co_dieu_kien' : 'bat_buoc' };
      });
      S.confirmChecklist(nodeId, items, by);
      HacomSync.sendEvent('confirm', {
        nodePath: nodePathOf(nodeId),
        items,
        confirmedBy: by.trim(),
      });
      toast('Đã chốt chuẩn. Từ giờ bước này sẽ báo đủ/thiếu.');
      render();
      renderDrawer();
    },

    'revoke-checklist'(btn) {
      S.revokeChecklist(btn.dataset.id);
      toast('Đã bỏ chuẩn, quay lại trạng thái chưa thiết lập.');
      render();
      renderDrawer();
    },
  };

  /* ------------------------------------------------------------ events */

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-action]');
    // Select (lọc trạng thái, khoảng báo cáo…) chỉ xử lý ở sự kiện 'change'.
    // Dispatch ở click sẽ render() lại DOM và đóng dropdown native ngay lập tức.
    if (btn && btn.tagName !== 'SELECT') {
      const handler = actions[btn.dataset.action];
      if (handler) { event.preventDefault(); handler(btn); return; }
    }
    // Bấm ra ngoài menu "..." của dòng dự án thì đóng menu lại.
    if (ui.menuFor && !event.target.closest('.menu-wrap')) {
      ui.menuFor = null;
      render();
    }
  });

  document.addEventListener('input', (event) => {
    // Ô tìm kiếm trên bảng dự án: chỉ thay tbody + chân bảng, không render lại
    // toàn trang để con trỏ không bị mất khi đang gõ.
    if (event.target.id === 'project-search') {
      ui.searchQuery = event.target.value;
      ui.page = 1;
      refreshProjectsTable();
      return;
    }

    const field = event.target.closest('[data-profile]');
    if (!field) return;
    ui.draftProfile[field.dataset.profile] = field.value;
    if (field.matches('[data-location-input]')) {
      ui.locationOpen = true;
      ui.locationActive = -1;
      const combo = field.closest('.location-combobox');
      combo?.classList.add('is-open');
      field.setAttribute('aria-expanded', 'true');
      field.removeAttribute('aria-activedescendant');
      const listbox = combo?.querySelector('.location-options');
      if (listbox) listbox.innerHTML = locationOptionsHtml(locationSuggestions(field.value));
    }
  });

  document.addEventListener('change', (event) => {
    const select = event.target.closest('select[data-action]');
    if (!select) return;
    const handler = actions[select.dataset.action];
    if (handler) handler(select);
  });

  // Menu "..." dùng position:fixed nên khi trang cuộn, neo lại theo nút của nó.
  let menuRaf = 0;
  window.addEventListener('scroll', () => {
    if (!ui.menuFor || menuRaf) return;
    menuRaf = requestAnimationFrame(() => { menuRaf = 0; positionRowMenu(ui.menuFor); });
  }, { passive: true, capture: true });

  document.addEventListener('focusin', (event) => {
    if (!event.target.matches('[data-location-input]')) return;
    ui.locationOpen = true;
    ui.locationActive = -1;
    event.target.setAttribute('aria-expanded', 'true');
    event.target.closest('.location-combobox')?.classList.add('is-open');
  });

  document.addEventListener('focusout', (event) => {
    if (!event.target.matches('[data-location-input]')) return;
    setTimeout(() => {
      if (!document.activeElement?.closest('.location-combobox')) {
        ui.locationOpen = false;
        ui.locationActive = -1;
        document.querySelector('.location-combobox')?.classList.remove('is-open');
        document.querySelector('[data-location-input]')?.setAttribute('aria-expanded', 'false');
      }
    }, 0);
  });

  // Nút Có / Không / Chưa xác định trong form đặc điểm dự án.
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-profile-set]');
    if (!btn) return;
    ui.draftProfile[btn.dataset.profileSet] = btn.dataset.value;
    render();
  });

  el.drawerClose.addEventListener('click', closeDrawer);
  el.drawerBackdrop.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (event) => {
    const input = event.target.closest('[data-location-input]');
    if (input) {
      const suggestions = locationSuggestions(input.value);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        ui.locationOpen = true;
        if (suggestions.length) {
          const direction = event.key === 'ArrowDown' ? 1 : -1;
          ui.locationActive = (ui.locationActive + direction + suggestions.length) % suggestions.length;
        }
        render();
        const next = document.querySelector('[data-location-input]');
        next?.focus();
        next?.setSelectionRange(next.value.length, next.value.length);
        document.querySelector('.location-option.is-active')?.scrollIntoView({ block: 'nearest' });
        return;
      }
      if (event.key === 'Enter' && ui.locationOpen && ui.locationActive >= 0 && suggestions[ui.locationActive]) {
        event.preventDefault();
        ui.draftProfile.dia_diem = suggestions[ui.locationActive];
        ui.locationOpen = false;
        ui.locationActive = -1;
        render();
        document.querySelector('[data-location-input]')?.focus();
        return;
      }
      if (event.key === 'Escape' && ui.locationOpen) {
        event.preventDefault();
        ui.locationOpen = false;
        ui.locationActive = -1;
        document.querySelector('.location-combobox')?.classList.remove('is-open');
        input.setAttribute('aria-expanded', 'false');
        return;
      }
    }
    if (event.key === 'Escape' && ui.drawerNodeId) closeDrawer();
  });

  el.btnReset.addEventListener('click', () => {
    if (!confirm('Xóa toàn bộ dữ liệu demo trên máy này?')) return;
    S.resetAll();
    ui.view = 'dashboard';
    ui.openNodes.clear();
    ui.searchQuery = '';
    ui.statusFilter = 'all';
    ui.page = 1;
    ui.menuFor = null;
    closeDrawer();
    toast('Đã xóa dữ liệu demo.');
    render();
  });

  el.btnGuide.addEventListener('click', () => {
    alert(
      'KỊCH BẢN DEMO ĐỀ XUẤT\n\n'
      + '1. Tạo dự án mới, trả lời 10 câu hỏi. Chưa rõ thì chọn "Chưa xác định".\n\n'
      + '2. Xem quy trình: dự án không GPMB thì nhánh GPMB hiện "Không áp dụng";\n'
      + '   câu chưa trả lời thì hiện "Chưa xác định" chứ không bị ẩn.\n\n'
      + '3. Mở một folder bất kỳ. Khung "Hồ sơ cần có" đang trống — đây là điểm chính.\n\n'
      + '4. Hỏi người dự họp: folder này cần tài liệu gì? Gõ luôn vào khung đề xuất.\n\n'
      + '5. Thử đẩy một file thật lên, khai "đây là tài liệu gì".\n\n'
      + '6. Khi danh sách đã ổn định, bấm "Chốt thành chuẩn". Từ lúc đó folder mới\n'
      + '   bắt đầu báo đủ/thiếu.\n\n'
      + 'Demo không gửi dữ liệu ra ngoài và không lưu nội dung file.'
    );
  });

  /* ------------------------------------------------------------ render */

  function render() {
    renderSidebar();
    renderHeaderMid();
    if (ui.view === 'new') renderNewProject();
    else if (ui.view === 'process' && S.getActiveProject()) renderProcess();
    else if (ui.view === 'projects') renderProjectList();
    else if (ui.view === 'report') renderReport();
    else renderDashboard();
  }

  // Khởi động: luôn vào dashboard; nếu đã có dự án thì chuẩn bị sẵn giai đoạn đầu.
  ui.view = 'dashboard';
  if (S.getActiveProject()) {
    ui.activeStage = D.STAGES[0].id;
    ui.openNodes = new Set(D.STAGES[0].children.slice(0, 2).map((n) => n.id));
  }
  render();
})();
