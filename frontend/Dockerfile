FROM alpine:3.20 AS assets
WORKDIR /src
COPY . .

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=assets /src /usr/share/nginx/html
USER nginx
EXPOSE 8080
