# Stage 1 — build React frontend
FROM node:20-alpine AS builder
ARG REACT_APP_GOOGLE_CLIENT_ID=
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./frontend/
WORKDIR /app/frontend
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2 — run Express + static build
FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev
COPY backend/ ./
COPY --from=builder /app/frontend/build ./public
ENV NODE_ENV=production
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://127.0.0.1:4000/health || exit 1
CMD ["node", "server.js"]
