/**
 * Lưu trạng thái demo vào localStorage.
 *
 * LƯU Ý: demo chỉ lưu THÔNG TIN VỀ file (tên, dung lượng, loại tài liệu do người
 * dùng khai), KHÔNG lưu nội dung file. Không có server, không gửi dữ liệu ra ngoài.
 * Vì vậy có thể dùng hồ sơ thật để test mà không lo rò rỉ.
 */

const STORAGE_KEY = 'hacom-ktdt-demo-v1';

/**
 * Chrome chặn localStorage khi mở trực tiếp bằng file:// — khi đó dữ liệu chỉ nằm
 * trong RAM và mất khi tải lại trang. Ta phát hiện sớm để giao diện cảnh báo,
 * thay vì để người dùng mất công nhập rồi mất sạch sau khi refresh.
 */
const storage = (() => {
  try {
    const probe = '__hacom_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return { available: true, get: (k) => localStorage.getItem(k), set: (k, v) => localStorage.setItem(k, v) };
  } catch (err) {
    let memory = null;
    return {
      available: false,
      get: () => memory,
      set: (_key, value) => { memory = value; },
    };
  }
})();

const DEFAULT_STATE = {
  projects: [],
  documents: [],   // file đã đẩy lên (chỉ metadata)
  proposals: [],   // người dùng đề xuất "folder này cần tài liệu gì"
  checklists: [],  // checklist đã được xác nhận cho từng node
  activeProjectId: null,
};

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function loadState() {
  try {
    const raw = storage.get(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STATE), ...parsed };
  } catch (err) {
    console.warn('Không đọc được dữ liệu demo, khởi tạo lại.', err);
    return structuredClone(DEFAULT_STATE);
  }
}

let state = loadState();
const listeners = new Set();

function persist() {
  try {
    storage.set(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Không lưu được dữ liệu demo.', err);
  }
  listeners.forEach((fn) => fn(state));
}

/* ------------------------------------------------------------------ getters */

function getState() {
  return state;
}

function getActiveProject() {
  return state.projects.find((p) => p.id === state.activeProjectId) || null;
}

function getDocuments(projectId, nodeId) {
  return state.documents.filter(
    (doc) => doc.projectId === projectId && (!nodeId || doc.nodeId === nodeId),
  );
}

function getProposals(nodeId) {
  return state.proposals.filter((item) => item.nodeId === nodeId);
}

function getChecklist(nodeId) {
  return state.checklists.find((item) => item.nodeId === nodeId) || null;
}

/** Từ điển loại tài liệu đã từng được khai — dùng cho gợi ý khi upload. */
function getDocTypeDictionary() {
  const counter = new Map();
  state.documents.forEach((doc) => {
    const key = doc.docType.trim();
    if (key) counter.set(key, (counter.get(key) || 0) + 1);
  });
  state.proposals.forEach((item) => {
    const key = item.name.trim();
    if (key && !counter.has(key)) counter.set(key, 0);
  });
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
    .map(([name, count]) => ({ name, count }));
}

/**
 * Tổng hợp checklist đề xuất cho một node từ dữ liệu thực tế.
 * Đây là cơ chế chính: checklist sinh ra từ những gì người dùng đã đẩy lên,
 * không phải từ một biểu mẫu phát ra để mọi người tick.
 */
function harvestNode(nodeId) {
  const byName = new Map();

  const touch = (name) => {
    const key = name.trim();
    if (!key) return null;
    if (!byName.has(key)) {
      byName.set(key, { name: key, uploadCount: 0, projectIds: new Set(), proposedBy: [] });
    }
    return byName.get(key);
  };

  state.documents
    .filter((doc) => doc.nodeId === nodeId)
    .forEach((doc) => {
      const entry = touch(doc.docType);
      if (!entry) return;
      entry.uploadCount += 1;
      entry.projectIds.add(doc.projectId);
    });

  state.proposals
    .filter((item) => item.nodeId === nodeId)
    .forEach((item) => {
      const entry = touch(item.name);
      if (!entry) return;
      if (item.proposedBy && !entry.proposedBy.includes(item.proposedBy)) {
        entry.proposedBy.push(item.proposedBy);
      }
    });

  return [...byName.values()]
    .map((entry) => ({
      name: entry.name,
      uploadCount: entry.uploadCount,
      projectCount: entry.projectIds.size,
      proposedBy: entry.proposedBy,
    }))
    .sort((a, b) => b.projectCount - a.projectCount || b.uploadCount - a.uploadCount);
}

/* ------------------------------------------------------------------ actions */

function createProject(profile) {
  const project = {
    id: uid('PRJ'),
    name: profile.ten_du_an?.trim() || 'Dự án chưa đặt tên',
    profile,
    createdAt: new Date().toISOString(),
  };
  state.projects.push(project);
  state.activeProjectId = project.id;
  persist();
  return project;
}

function setActiveProject(projectId) {
  state.activeProjectId = projectId;
  persist();
}

function updateProfileField(projectId, fieldId, value) {
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) return;
  project.profile[fieldId] = value;
  if (fieldId === 'ten_du_an') project.name = value.trim() || 'Dự án chưa đặt tên';
  persist();
}

function deleteProject(projectId) {
  state.projects = state.projects.filter((p) => p.id !== projectId);
  state.documents = state.documents.filter((d) => d.projectId !== projectId);
  if (state.activeProjectId === projectId) {
    state.activeProjectId = state.projects[0]?.id || null;
  }
  persist();
}

function addDocuments(projectId, nodeId, files, docType, uploader) {
  files.forEach((file) => {
    state.documents.push({
      id: uid('DOC'),
      projectId,
      nodeId,
      docType: docType.trim() || 'Chưa phân loại',
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      uploader: uploader?.trim() || 'Người dùng demo',
    });
  });
  persist();
}

function removeDocument(docId) {
  state.documents = state.documents.filter((doc) => doc.id !== docId);
  persist();
}

function retypeDocument(docId, docType) {
  const doc = state.documents.find((item) => item.id === docId);
  if (!doc) return;
  doc.docType = docType.trim() || 'Chưa phân loại';
  persist();
}

function addProposal(nodeId, name, level, proposedBy) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const duplicate = state.proposals.find(
    (item) => item.nodeId === nodeId && item.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (duplicate) return;
  state.proposals.push({
    id: uid('PRP'),
    nodeId,
    name: trimmed,
    level: level || 'chua_xac_dinh',
    proposedBy: proposedBy?.trim() || 'Người dùng demo',
    createdAt: new Date().toISOString(),
  });
  persist();
}

function removeProposal(proposalId) {
  state.proposals = state.proposals.filter((item) => item.id !== proposalId);
  persist();
}

/** SME chốt checklist cho node: từ lúc này folder mới báo đủ/thiếu. */
function confirmChecklist(nodeId, items, confirmedBy) {
  const payload = {
    nodeId,
    items: items.map((item) => ({ name: item.name, level: item.level || 'bat_buoc' })),
    confirmedBy: confirmedBy?.trim() || 'SME demo',
    confirmedAt: new Date().toISOString(),
  };
  const index = state.checklists.findIndex((item) => item.nodeId === nodeId);
  if (index >= 0) state.checklists[index] = payload;
  else state.checklists.push(payload);
  persist();
}

function revokeChecklist(nodeId) {
  state.checklists = state.checklists.filter((item) => item.nodeId !== nodeId);
  persist();
}

function resetAll() {
  state = structuredClone(DEFAULT_STATE);
  persist();
}

function isPersistent() {
  return storage.available;
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

window.HacomStore = {
  getState,
  getActiveProject,
  getDocuments,
  getProposals,
  getChecklist,
  getDocTypeDictionary,
  harvestNode,
  createProject,
  setActiveProject,
  updateProfileField,
  deleteProject,
  addDocuments,
  removeDocument,
  retypeDocument,
  addProposal,
  removeProposal,
  confirmChecklist,
  revokeChecklist,
  resetAll,
  isPersistent,
  subscribe,
};
