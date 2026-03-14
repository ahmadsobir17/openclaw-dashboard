FROM node:20-alpine AS base

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    tzdata \
    openssl

ENV TZ=Asia/Jakarta
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN npm install -g pnpm

ENV PNPM_IGNORE_SCRIPTS=false
ENV NPM_CONFIG_IGNORE_SCRIPTS=false

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
RUN pnpm exec prisma generate

COPY . .
RUN pnpm build

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

EXPOSE 4000
CMD ["sh", "-c", "pnpm exec prisma db push && node dist/index.js"]
