"""Server tĩnh + proxy LLM cho demo Hacom AI Invest.

Demo chạy gần như hoàn toàn phía trình duyệt (dữ liệu nhúng trong js/data.js,
trạng thái ở localStorage). Server serve thư mục demo/ và thêm endpoint
POST /api/ask để gọi LLM (Google Gemini — gói miễn phí) giúp phân tích
câu hỏi bằng ngôn ngữ tự nhiên. Khóa API KHÔNG nằm trong code: đọc từ
biến môi trường, đặt trên Railway (Variables):

  PORT           - cổng lắng nghe (Railway tự cấp, mặc định 8080).
  GEMINI_API_KEY - khóa lấy miễn phí tại https://aistudio.google.com/apikey
  GEMINI_MODEL   - tùy chọn, mặc định gemini-3.5-flash
"""

import json
import mimetypes
import os
import sys
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

# Console Windows mặc định dùng cp1252, không in được tiếng Việt — chuyển sang UTF-8.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEMO_DIR = os.path.join(BASE_DIR, 'demo')

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
# Dòng model hiện hành (8/2026): gemini-3.x-flash. Dòng 2.5 cũ có thể bị Google từ chối -> lỗi 404.
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-3.5-flash')

SYSTEM_PROMPT = (
    'Bạn là trợ lý AI của Hacom AI Invest, am hiểu quy trình đầu tư dự án tại Việt Nam. '
    'Trả lời câu hỏi của người dùng bằng tiếng Việt, DỰA CHẶT vào NGỮ CẢNH do hệ thống cung cấp '
    '(cấu trúc quy trình và trạng thái từng giai đoạn đã tính sẵn). Quy tắc: '
    '(1) không bịa thủ tục, giấy tờ hay thời gian ngoài ngữ cảnh; '
    '(2) với mục thiếu dữ liệu phải nói "chưa xác định", không được khẳng định "không áp dụng" nếu ngữ cảnh không ghi rõ; '
    '(3) ngắn gọn tối đa 200-250 từ, dùng gạch đầu dòng, không dùng heading markdown; '
    '(4) kết bằng một câu gợi ý xem bảng chi tiết bên dưới.'
)

# Tránh phụ thuộc Flask ở môi trường tối giản — dùng http.server chuẩn.
from http.server import HTTPServer, SimpleHTTPRequestHandler

mimetypes.add_type('application/javascript', '.js')


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DEMO_DIR, **kwargs)

    def translate_path(self, path):
        # Giữ nguyên cách map của SimpleHTTPRequestHandler nhưng chặn path traversal.
        result = super().translate_path(path)
        if not os.path.abspath(result).startswith(os.path.abspath(DEMO_DIR)):
            return os.path.join(DEMO_DIR, 'index.html')
        return result

    def do_POST(self):
        if self.path.split('?')[0] != '/api/ask':
            self._json(404, {'error': 'not-found'})
            return
        try:
            length = int(self.headers.get('Content-Length') or 0)
            body = json.loads(self.rfile.read(length).decode('utf-8') or '{}')
        except Exception:
            self._json(400, {'error': 'bad-request'})
            return
        if not GEMINI_API_KEY:
            self._json(503, {'error': 'missing-key'})
            return
        prompt = f"Câu hỏi: {body.get('question', '')}\n\nNGỮ CẢNH:\n{body.get('context', '')}"
        payload = json.dumps({
            'system_instruction': {'parts': [{'text': SYSTEM_PROMPT}]},
            'contents': [{'role': 'user', 'parts': [{'text': prompt}]}],
        }).encode('utf-8')
        req = Request(
            f'https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent',
            data=payload,
            method='POST',
            headers={'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY},
        )
        try:
            with urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            text = data['candidates'][0]['content']['parts'][0]['text']
            self._json(200, {'answer': text})
        except HTTPError as e:
            raw = e.read().decode('utf-8', 'replace')[:400]
            sys.stderr.write(f'[gemini] HTTP {e.code}: {raw}\n')
            # Trả kèm lý do rút gọn để UI chẩn đoán nhanh (không lộ toàn bộ payload).
            detail = self._short_reason(raw) or f'HTTP {e.code}'
            self._json(e.code if e.code == 429 else 502, {'error': 'upstream', 'detail': detail})
        except Exception as e:
            sys.stderr.write(f'[gemini] lỗi: {e}\n')
            self._json(502, {'error': 'upstream', 'detail': str(e)[:160]})

    @staticmethod
    def _short_reason(raw):
        # Rút message ngắn từ JSON lỗi của Google, ví dụ "...is not found for API version..." hoặc "API key not valid".
        try:
            obj = json.loads(raw)
            msg = obj.get('error', {}).get('message', '')
            return msg[:160] if msg else ''
        except Exception:
            return raw[:160].replace('\n', ' ')

    def _json(self, code, obj):
        data = json.dumps(obj).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        sys.stderr.write('[%s] %s\n' % (self.log_date_time_string(), fmt % args))


def main():
    port = int(os.environ.get('PORT', '8080'))
    server = HTTPServer(('0.0.0.0', port), Handler)
    print(f'Hacom AI Invest demo đang chạy tại http://127.0.0.1:{port}/')
    if not GEMINI_API_KEY:
        print('Lưu ý: thiếu GEMINI_API_KEY — /api/ask sẽ trả 503, UI dùng kết quả quy tắc.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
