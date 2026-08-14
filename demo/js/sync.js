/**
 * Đồng bộ dữ liệu thu hoạch về server (server.py).
 *
 * Khi demo chạy qua http(s)://.../ (trên Railway hoặc máy chủ nội bộ), mỗi lần người
 * dùng đẩy tài liệu / xác nhận checklist, bản ghi được gửi về server để tổng hợp và
 * bản file được chuyển tiếp sang Telegram của người phụ trách. Server KHÔNG lưu nội
 * dung file — chỉ giữ metadata. Khi mở bằng file:// thì lớp này tự tắt (demo thuần tĩnh).
 *
 * Hàng đợi store-and-forward: nếu lúc gửi bị lỗi mạng, sự kiện được xếp vào localStorage
 * và tự gửi bù khi trang tải lại hoặc khi có mạng trở lại. Riêng bản file không được lưu
 * cục bộ (tôn trọng "không lưu nội dung"), nên nếu mất mạng đúng lúc gửi file thì chỉ còn
 * metadata được gửi bù, kèm ghi chú "file chưa gửi được".
 */

window.HacomSync = (() => {
  const QUEUE_KEY = 'hacom-ktdt-sync-queue-v1';
  const enabled = location.protocol === 'http:' || location.protocol === 'https:';
  let flushing = false;

  function loadQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; }
  }

  function saveQueue(queue) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch {}
  }

  async function postJson(url, payload) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function postForm(url, formData) {
    const res = await fetch(url, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /** Gửi một sự kiện chỉ-metadata (xác nhận, đề xuất, hoặc upload gửi bù). */
  function sendEvent(type, payload) {
    if (!enabled) return;
    const event = { type, ...payload };
    postJson('/api/event', event).catch(() => {
      const queue = loadQueue();
      queue.push(event);
      saveQueue(queue);
    });
  }

  /** Gửi một file tải lên kèm metadata. Mất mạng thì gửi bù phần metadata. */
  function sendUpload(file, meta) {
    if (!enabled) return;
    const form = new FormData();
    form.append('file', file, file.name);
    Object.entries(meta).forEach(([key, value]) => form.append(key, value ?? ''));

    postForm('/api/upload', form).catch(() => {
      // Bản file không lưu cục bộ; chỉ gửi bù metadata kèm ghi chú để không mất thông tin.
      const queue = loadQueue();
      queue.push({
        type: 'upload',
        fileName: file.name,
        fileSize: file.size,
        note: 'file chưa gửi được (lỗi mạng khi đẩy), chỉ còn metadata',
        ...meta,
      });
      saveQueue(queue);
    });
  }

  /** Gửi bù các sự kiện đang nằm trong hàng đợi. */
  async function flush() {
    if (!enabled || flushing) return;
    const queue = loadQueue();
    if (!queue.length) return;
    flushing = true;
    const remaining = [];
    for (const event of queue) {
      try {
        await postJson('/api/event', event);
      } catch {
        remaining.push(event);
      }
    }
    saveQueue(remaining);
    flushing = false;
  }

  if (enabled) {
    window.addEventListener('load', flush);
    window.addEventListener('online', flush);
    setInterval(flush, 60000);
  }

  return { sendEvent, sendUpload, flush, enabled };
})();
