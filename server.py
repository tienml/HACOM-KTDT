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

# Đề xuất bảng quy trình: trả về JSON thuần để frontend dựng bảng. Trạng thái tuân theo quy tắc ba mức.
PROPOSE_PROMPT = (
    'Bạn là trợ lý AI của Hacom AI Invest, am hiểu quy trình đầu tư dự án tại Việt Nam. '
    'Nhiệm vụ: dựa trên ngữ cảnh cho sẵn (loại dự án, câu trả lời khảo sát, cấu trúc các giai đoạn/bước '
    'và trạng thái tham khảo), hãy đề xuất bảng quy trình đầu tư ở cấp GIAI ĐOẠN. '
    'Trả về CHỈ MỘT object JSON hợp lệ, không kèm markdown, không code fence, không lời giải thích: '
    '{"stages":[{"id":"S01","status":"apply","desc":"...","note":"..."}, ...]} đủ 8 phần tử theo đúng thứ tự id S01..S08 có trong ngữ cảnh. '
    'Quy tắc bắt buộc: '
    '(1) status chỉ nhận đúng một trong ba giá trị "apply" | "unknown" | "na"; khi dữ liệu/khảo sát chưa đủ căn cứ PHẢI để "unknown", '
    'chỉ dùng "na" khi ngữ cảnh ghi rõ giai đoạn đó không áp dụng cho loại dự án này; '
    '(2) desc là mô tả ngắn 1-2 câu bằng tiếng Việt, phản ánh đúng nội dung các nhóm bước đã cho, không bịa thủ tục ngoài ngữ cảnh; '
    '(3) note là một câu tư vấn ngắn gọn cho nhà đầu tư về lưu ý/trọng tâm của giai đoạn đó (có thể để chuỗi rỗng nếu không cần); '
    '(4) tôn trọng trạng thái tham khảo và câu trả lời khảo sát trong ngữ cảnh; nếu điều chỉnh khác thì phải nêu lý do ngắn trong note.'
)

# Chatbot tổng quát: trả lời tự nhiên về mọi chủ đề, nhưng với câu hỏi quy trình đầu tư thì DỰA CHẶT ngữ cảnh.
CHAT_PROMPT = (
    'Bạn là trợ lý AI thân thiện của Hacom AI Invest — ứng dụng gợi ý quy trình đầu tư dự án bất động sản tại Việt Nam. '
    'Trách nhiệm kép: '
    '(a) Với câu hỏi về quy trình đầu tư, thủ tục, giai đoạn, hồ sơ, giấy phép, môi trường, PCCC, đất đai… '
    'PHẢI DỰA CHẶT vào NGỮ CẢNH hệ thống cung cấp; không bịa thủ tục/con số ngoài ngữ cảnh; thiếu dữ liệu nói "chưa xác định", '
    'không được khẳng định "không áp dụng" nếu ngữ cảnh không ghi rõ; ngắn gọn tối đa ~200 từ, gạch đầu dòng khi liệt kê, '
    'không dùng heading markdown. '
    '(b) Với câu hỏi xã giao (xin chào, cảm ơn…), hoặc câu hỏi tổng quát ngoài phạm vi dữ liệu, '
    'trả lời tự nhiên, ngắn gọn, thân thiện như một chatbot thực thụ; vẫn giữ vai trò trợ lý đầu tư BĐS; '
    'khéo léo gợi về chủ đề đầu tư/quy trình khi hợp lý, nhưng KHÔNG ép buộc. '
    'Luôn dùng tiếng Việt.'
)

# Gợi ý danh mục: so sánh các loại hình dự án, trả về JSON thuần để frontend dựng bảng + gợi ý AI.
PORTFOLIO_PROMPT = (
    'Bạn là cố vấn đầu tư bất động sản của Hacom AI Invest, am hiểu quy trình đầu tư dự án tại Việt Nam. '
    'Nhiệm vụ: dựa trên dữ liệu QUY TRÌNH THỰC cho sẵn của từng loại hình (số bước áp dụng/chưa xác định/không áp dụng, '
    'thời lượng tham khảo mỗi giai đoạn) và câu trả lời khảo sát của nhà đầu tư, hãy đề xuất thứ tự ưu tiên / phân bổ danh mục đầu tư. '
    'Trả về CHỈ MỘT object JSON hợp lệ, không kèm markdown, không code fence, không lời giải thích: '
    '{"ranks":[{"id":"noxa","rank":1,"reason":"..."}, ...]} đủ 5 phần tử, mỗi id đúng một lần, rank là số nguyên 1..5 không trùng. '
    'Quy tắc bắt buộc: '
    '(1) sắp xếp theo mức độ phù hợp với nhà đầu tư dựa trên dữ liệu thực đã cho và khảo sát — KHÔNG bịa con số hay thủ tục ngoài ngữ cảnh; '
    '(2) reason là một câu tiếng Việt ngắn gọn giải thích vì sao xếp hạng đó, phải bám vào dữ liệu cụ thể (ví dụ ít bước chưa xác định hơn, thời gian ngắn hơn, ít ràng buộc PCCC/đất đai hơn...); '
    '(3) với loại hình thiếu dữ liệu nhiều (nhiều "chưa xác định") phải nói rõ điều đó trong reason, không được khẳng định chắc chắn; '
    '(4) tôn trọng khảo sát: nếu nhà đầu tư thiên về an toàn/pháp lý rõ ràng thì ưu tiên loại ít rủi ro thủ tục.'
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
        path = self.path.split('?')[0]
        if path not in ('/api/ask', '/api/propose', '/api/portfolio', '/api/chat'):
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
        if path == '/api/ask':
            system = SYSTEM_PROMPT
            user_text = f"Câu hỏi: {body.get('question', '')}\n\nNGỮ CẢNH:\n{body.get('context', '')}"
        elif path == '/api/chat':
            system = CHAT_PROMPT
            user_text = f"Câu hỏi: {body.get('question', '')}\n\nNGỮ CẢNH:\n{body.get('context', '')}"
        elif path == '/api/portfolio':
            system = PORTFOLIO_PROMPT
            user_text = body.get('context', '')
        else:
            system = PROPOSE_PROMPT
            user_text = body.get('context', '')
        payload = json.dumps({
            'system_instruction': {'parts': [{'text': system}]},
            'contents': [{'role': 'user', 'parts': [{'text': user_text}]}],
        }).encode('utf-8')
        is_stream = (path == '/api/chat')
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}'
        url += ':streamGenerateContent?alt=sse' if is_stream else ':generateContent'
        req = Request(
            url,
            data=payload,
            method='POST',
            headers={'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY},
        )
        try:
            resp = urlopen(req, timeout=60)
        except HTTPError as e:
            raw = e.read().decode('utf-8', 'replace')[:400]
            sys.stderr.write(f'[gemini] HTTP {e.code}: {raw}\n')
            detail = self._short_reason(raw) or f'HTTP {e.code}'
            self._json(e.code if e.code == 429 else 502, {'error': 'upstream', 'detail': detail})
            return
        except Exception as e:
            sys.stderr.write(f'[gemini] lỗi: {e}\n')
            self._json(502, {'error': 'upstream', 'detail': str(e)[:160]})
            return
        if is_stream:
            # Streaming SSE — trả từng dòng ngay khi Google gửi đến để giảm cảm giác chậm.
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            try:
                with resp:
                    for line in resp:
                        if line[:5] == b'data:':
                            # Gemini gửi dạng "data: {...}\r\n"; chuẩn hóa về \n cho trình duyệt.
                            stripped = line.rstrip(b'\r\n') + b'\n'
                            self.wfile.write(stripped)
                            self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass
            return
        with resp:
            data = json.loads(resp.read().decode('utf-8'))
        text = data['candidates'][0]['content']['parts'][0]['text']
        self._json(200, {'answer': text})

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
