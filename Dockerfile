# Serve demo tĩnh bằng nginx cho Railway
FROM nginx:1.27-alpine
COPY demo/ /usr/share/nginx/html/
EXPOSE 80
