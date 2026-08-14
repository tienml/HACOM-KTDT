# Backend Python (Flask): serve demo tĩnh + API thu hoạch + chuyển tiếp Telegram.
# Biến môi trường trên Railway: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, ADMIN_PASSWORD,
#                              S3_ENDPOINT_URL, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET.
FROM python:3.12-alpine
WORKDIR /app
RUN pip install --no-cache-dir flask boto3
COPY server.py ./
COPY demo/ ./demo/
EXPOSE 8080
CMD ["python", "server.py"]
