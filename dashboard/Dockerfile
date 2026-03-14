FROM node:20-alpine AS base

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Install OpenSSL for Prisma (required for libssl)
RUN apk add --no-cache openssl

COPY prisma ./prisma
RUN pnpm exec prisma generate

COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
