"""Server tĩnh cho demo Hacom AI Invest.

Đã pivot sang "gợi ý quy trình đầu tư": demo chạy hoàn toàn phía trình duyệt
(dữ liệu nhúng trong js/data.js, trạng thái ở localStorage). Server này chỉ
serve thư mục demo/ — không còn thu hoạch file, Telegram, R2 hay trang admin.

Biến môi trường (đặt trên Railway nếu dùng):
  PORT - cổng lắng nghe (Railway tự cấp, mặc định 8080).
"""

import mimetypes
import os
import sys
from urllib.parse import quote

# Console Windows mặc định dùng cp1252, không in được tiếng Việt — chuyển sang UTF-8.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEMO_DIR = os.path.join(BASE_DIR, 'demo')

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

    def log_message(self, fmt, *args):
        sys.stderr.write('[%s] %s\n' % (self.log_date_time_string(), fmt % args))


def main():
    port = int(os.environ.get('PORT', '8080'))
    server = HTTPServer(('0.0.0.0', port), Handler)
    print(f'Hacom AI Invest demo đang chạy tại http://127.0.0.1:{port}/')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
