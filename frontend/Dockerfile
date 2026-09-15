FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN corepack pnpm install --frozen-lockfile
COPY frontend/ ./
ARG VITE_API_BASE_URL=
RUN VITE_API_BASE_URL="$VITE_API_BASE_URL" corepack pnpm build
FROM nginx:alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
