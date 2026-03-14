#!/bin/bash
set -e

echo ">>> Installing Playwright Chromium in Agent container..."
docker compose exec agent \
  node /app/node_modules/playwright-core/cli.js install chromium

echo ">>> Installing system deps (if not already)..."
docker compose exec agent \
  apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont || true

echo ">>> Playwright ready inside Agent container."
