# syntax=docker/dockerfile:1

FROM nginx:1.27-alpine

COPY landing.html login.html register.html prototype.html privacy.html terms.html /usr/share/nginx/html/
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
