"""Backend thu hoạch dữ liệu cho demo Hacom-KTDT.

Nhiệm vụ:
  - Serve demo tĩnh (thư mục demo/) để Railway chạy một service duy nhất.
  - Nhận sự kiện thu hoạch từ trình duyệt: /api/upload (file + metadata) và /api/event (metadata).
  - Metadata lưu vào SQLite (harvest.db) để tổng hợp; xem và tải về tại /admin.
  - Bản file KHÔNG lưu trên server:
      • File ≤ 50MB: chuyển tiếp sang Telegram rồi bỏ.
      • File > 50MB: nếu đã cấu hình lưu trữ S3-compatible (Cloudflare R2, Backblaze B2...)
        thì stream lên bucket và gửi link xem tạm qua Telegram; nếu chưa cấu hình thì chỉ log.

Biến môi trường (đặt trên Railway):
  PORT                 - cổng lắng nghe (Railway tự cấp)
  TELEGRAM_BOT_TOKEN   - token bot Telegram (để trống thì chỉ lưu metadata)
  TELEGRAM_CHAT_ID     - chat nhận file/link
  ADMIN_PASSWORD       - mật khẩu trang /admin (mặc định "hacom-admin" nếu chưa đặt)
  HARVEST_DB           - đường dẫn file SQLite (mặc định harvest.db cạnh server.py)
  S3_ENDPOINT_URL      - endpoint của dịch vụ S3-compatible (ví dụ https://<account>.r2.cloudflarestorage.com)
  S3_ACCESS_KEY_ID     - access key
  S3_SECRET_ACCESS_KEY - secret key
  S3_BUCKET            - tên bucket
"""

import csv
import io
import json
import os
import sqlite3
import sys
import uuid
from datetime import datetime, timezone
from urllib import request as urlrequest

# Console Windows mặc định dùng cp1252, không in được tiếng Việt — chuyển sang UTF-8.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

from flask import Flask, Response, jsonify, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEMO_DIR = os.path.join(BASE_DIR, 'demo')
DB_PATH = os.environ.get('HARVEST_DB', os.path.join(BASE_DIR, 'harvest.db'))
TG_LIMIT = 50 * 1024 * 1024  # giới hạn sendDocument của Bot API bản cloud

app = Flask(__name__)

# ------------------------------------------------------------------ storage

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with db() as conn:
        conn.execute(
            'CREATE TABLE IF NOT EXISTS events ('
            ' id TEXT PRIMARY KEY, at TEXT NOT NULL, type TEXT NOT NULL, payload TEXT NOT NULL)'
        )

def insert_event(event_type, payload):
    event_id = uuid.uuid4().hex[:12]
    at = datetime.now(timezone.utc).isoformat()
    with db() as conn:
        conn.execute(
            'INSERT INTO events (id, at, type, payload) VALUES (?, ?, ?, ?)',
            (event_id, at, event_type, json.dumps(payload, ensure_ascii=False)),
        )
    return event_id, at

# ------------------------------------------------------------------ telegram

def telegram_configured():
    return bool(os.environ.get('TELEGRAM_BOT_TOKEN', '').strip()
                and os.environ.get('TELEGRAM_CHAT_ID', '').strip())

def telegram_send_document(filename, data, caption):
    """Gửi file tới Telegram bằng Bot API (urllib thuần, không cần thư viện)."""
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '').strip()
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '').strip()
    if not token or not chat_id:
        return 'chưa cấu hình Telegram'

    boundary = uuid.uuid4().hex
    parts = [
        f'--{boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n{chat_id}\r\n',
        f'--{boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n{caption}\r\n',
        f'--{boundary}\r\nContent-Disposition: form-data; name="document"; filename="{filename}"\r\n'
        f'Content-Type: application/octet-stream\r\n\r\n',
    ]
    body = parts[0].encode() + parts[1].encode() + parts[2].encode() + data + f'\r\n--{boundary}--\r\n'.encode()
    req = urlrequest.Request(
        f'https://api.telegram.org/bot{token}/sendDocument',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'},
    )
    try:
        with urlrequest.urlopen(req, timeout=90) as res:
            result = json.loads(res.read())
        return 'ok' if result.get('ok') else f'lỗi Telegram: {result.get("description")}'
    except Exception as err:  # mạng, timeout, token sai...
        return f'lỗi Telegram: {err}'

def telegram_send_message(text):
    """Gửi tin nhắn văn bản tới Telegram (cho trường hợp file lớn gửi qua link)."""
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '').strip()
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '').strip()
    if not token or not chat_id:
        return 'chưa cấu hình Telegram'
    payload = json.dumps({'chat_id': chat_id, 'text': text[:4096]}).encode()
    req = urlrequest.Request(
        f'https://api.telegram.org/bot{token}/sendMessage',
        data=payload, headers={'Content-Type': 'application/json'})
    try:
        with urlrequest.urlopen(req, timeout=30) as res:
            result = json.loads(res.read())
        return 'ok' if result.get('ok') else f'lỗi Telegram: {result.get("description")}'
    except Exception as err:
        return f'lỗi Telegram: {err}'

# ------------------------------------------------------- object storage (S3-compatible)

STORAGE_KEYS = ('S3_ENDPOINT_URL', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET')

def storage_configured():
    return all(os.environ.get(k, '').strip() for k in STORAGE_KEYS)

def storage_put_and_link(fileobj, filename):
    """Stream file lên bucket S3-compatible và trả link xem tạm (7 ngày)."""
    import boto3  # noqa: lazy import — server vẫn chạy nếu chưa cài boto3
    endpoint = os.environ['S3_ENDPOINT_URL'].strip()
    bucket = os.environ['S3_BUCKET'].strip()
    client = boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=os.environ['S3_ACCESS_KEY_ID'].strip(),
        aws_secret_access_key=os.environ['S3_SECRET_ACCESS_KEY'].strip(),
    )
    stamp = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    safe_name = filename.replace('\\', '_').replace('/', '_')
    key = f'hacom-ktdt/{stamp}/{uuid.uuid4().hex[:8]}-{safe_name}'
    client.upload_fileobj(fileobj, bucket, key)
    url = client.generate_presigned_url(
        'get_object', Params={'Bucket': bucket, 'Key': key}, ExpiresIn=7 * 86400)
    return url

def format_size(num):
    for unit in ('B', 'KB', 'MB', 'GB'):
        if num < 1024 or unit == 'GB':
            return f'{num:.0f} {unit}' if unit == 'B' else f'{num:.1f} {unit}'
        num /= 1024
    return f'{num:.1f} GB'

# ------------------------------------------------------------------ api

@app.get('/api/health')
def health():
    return jsonify(ok=True, telegram=telegram_configured(), storage=storage_configured())

@app.post('/api/upload')
def upload():
    """Nhận một file tải lên: lưu metadata; bản file gửi qua Telegram (≤50MB) hoặc
    stream lên lưu trữ thứ ba rồi gửi link (>50MB). Server không giữ bản file."""
    meta = {key: (request.form.get(key) or '').strip()
            for key in ('projectName', 'nodePath', 'docType', 'uploader')}
    upload_file = request.files.get('file')
    telegram = None
    if upload_file and upload_file.filename:
        # Lấy size mà không đọc hết vào bộ nhớ (werkzeug đã buffer sang temp file).
        upload_file.seek(0, os.SEEK_END)
        size = upload_file.tell()
        upload_file.seek(0)
        meta['fileName'] = upload_file.filename
        meta['fileSize'] = size
        caption = (
            f'UPLOAD | Dự án: {meta.get("projectName") or "-"}\n'
            f'Bước: {meta.get("nodePath") or "-"}\n'
            f'Loại tài liệu: {meta.get("docType") or "-"}\n'
            f'Người đẩy: {meta.get("uploader") or "-"} | {format_size(size)}'
        )[:1024]
        if size <= TG_LIMIT:
            data = upload_file.read()
            telegram = telegram_send_document(upload_file.filename, data, caption)
        else:
            # File > 50MB: Bot API không gửi được — chuyển qua lưu trữ S3-compatible.
            if storage_configured():
                try:
                    url = storage_put_and_link(upload_file, upload_file.filename)
                    msg = f'{caption}\n\nFile lớn ({format_size(size)}), tải về tại:\n{url}\n(Link xem được 7 ngày)'
                    result = telegram_send_message(msg)
                    telegram = result if result == 'ok' else result
                    meta['storageUrl'] = url
                except Exception as err:
                    telegram = f'lỗi lưu trữ file lớn: {err}'
            else:
                telegram = 'file quá 50MB, chưa cấu hình lưu trữ thứ ba (S3/R2) để gửi'
    else:
        meta['fileName'] = meta.get('fileName', '')
    event_id, at = insert_event('upload', meta)
    return jsonify(ok=True, id=event_id, at=at, telegram=telegram)

@app.post('/api/event')
def event():
    """Nhận sự kiện chỉ-metadata (xác nhận checklist, đề xuất, hoặc upload gửi bù khi mất mạng)."""
    body = request.get_json(silent=True) or {}
    event_type = str(body.get('type') or 'other')[:40]
    payload = {k: v for k, v in body.items() if k != 'type'}
    event_id, at = insert_event(event_type, payload)
    return jsonify(ok=True, id=event_id, at=at)

# ------------------------------------------------------------------ admin

def admin_password():
    return os.environ.get('ADMIN_PASSWORD', '').strip() or 'hacom-admin'

def admin_ok():
    return request.cookies.get('hk_admin') == admin_password()

ADMIN_LOGIN = '''<!doctype html><meta charset="utf-8"><title>Đăng nhập admin</title>
<form method="post" action="/admin/login" style="font-family:sans-serif;max-width:320px;margin:80px auto">
<h3>Admin Hacom-KTDT</h3>
<input type="password" name="password" placeholder="Mật khẩu" autofocus
       style="width:100%;padding:8px;margin:8px 0;box-sizing:border-box">
<button style="padding:8px 16px">Vào</button></form>'''

@app.get('/admin')
def admin():
    if not admin_ok():
        return Response(ADMIN_LOGIN, content_type='text/html; charset=utf-8')
    with db() as conn:
        rows = conn.execute('SELECT * FROM events ORDER BY at DESC LIMIT 500').fetchall()
    counts = {}
    for row in rows:
        counts[row['type']] = counts.get(row['type'], 0) + 1
    summary = ', '.join(f'{t}: {n}' for t, n in sorted(counts.items())) or 'chưa có sự kiện'
    body_rows = []
    for row in rows:
        p = json.loads(row['payload'])
        detail = (p.get('nodePath') or p.get('projectName') or '')
        if p.get('docType'):
            detail += f' | {p["docType"]}'
        if p.get('fileName'):
            detail += f' | {p["fileName"]}'
        if p.get('confirmedBy'):
            detail += f' | xác nhận: {p["confirmedBy"]}'
        if p.get('note'):
            detail += f' | {p["note"]}'
        if p.get('storageUrl'):
            detail += ' | file lớn → lưu trữ thứ ba (link 7 ngày)'
        tg = p.get('telegram')
        body_rows.append(
            f'<tr><td>{row["at"][5:16].replace("T", " ")}</td><td>{row["type"]}</td>'
            f'<td>{detail}</td><td>{tg if tg else ""}</td></tr>'
        )
    html = f'''<!doctype html><meta charset="utf-8"><title>Dữ liệu thu hoạch</title>
<style>body{{font:13px/1.5 sans-serif;margin:24px}}table{{border-collapse:collapse;width:100%}}
td,th{{border:1px solid #ccc;padding:5px 8px;text-align:left;vertical-align:top}}
a{{margin-right:12px}}</style>
<h3>Dữ liệu thu hoạch ({summary})</h3>
<p><a href="/admin/export.json">Tải JSON</a><a href="/admin/export.csv">Tải CSV</a>
<a href="/admin/logout">Đăng xuất</a></p>
<table><tr><th>Thời gian</th><th>Loại</th><th>Chi tiết</th><th>Telegram</th></tr>
{''.join(body_rows)}</table>'''
    return Response(html, content_type='text/html; charset=utf-8')

@app.post('/admin/login')
def admin_login():
    if request.form.get('password') == admin_password():
        res = Response('', status=302)
        res.set_cookie('hk_admin', admin_password(), max_age=7 * 86400)
        res.headers['Location'] = '/admin'
        return res
    return Response('Sai mật khẩu. <a href="/admin">Thử lại</a>',
                    content_type='text/html; charset=utf-8', status=401)

@app.get('/admin/logout')
def admin_logout():
    res = Response('', status=302)
    res.delete_cookie('hk_admin')
    res.headers['Location'] = '/admin'
    return res

def all_events():
    with db() as conn:
        rows = conn.execute('SELECT * FROM events ORDER BY at ASC').fetchall()
    return [
        {'id': r['id'], 'at': r['at'], 'type': r['type'], **json.loads(r['payload'])}
        for r in rows
    ]

@app.get('/admin/export.json')
def export_json():
    if not admin_ok():
        return Response('Chưa đăng nhập', status=401)
    return Response(json.dumps(all_events(), ensure_ascii=False, indent=2),
                    mimetype='application/json',
                    headers={'Content-Disposition': 'attachment; filename=harvest.json'})

@app.get('/admin/export.csv')
def export_csv():
    if not admin_ok():
        return Response('Chưa đăng nhập', status=401)
    events = all_events()
    fields = ['id', 'at', 'type']
    for ev in events:  # union các key payload, giữ thứ tự xuất hiện
        for key in ev:
            if key not in fields:
                fields.append(key)
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=fields, extrasaction='ignore')
    writer.writeheader()
    for ev in events:
        writer.writerow({k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v)
                         for k, v in ev.items()})
    return Response('﻿' + buf.getvalue(), mimetype='text/csv',
                    headers={'Content-Disposition': 'attachment; filename=harvest.csv'})

# ------------------------------------------------------------------ static

@app.get('/')
def index():
    return send_from_directory(DEMO_DIR, 'index.html')

@app.get('/<path:path>')
def static_files(path):
    return send_from_directory(DEMO_DIR, path)

init_db()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8080'))
    if not os.environ.get('ADMIN_PASSWORD'):
        print('CẢNH BÁO: chưa đặt ADMIN_PASSWORD, /admin dùng mật khẩu mặc định "hacom-admin".')
    app.run(host='0.0.0.0', port=port)
