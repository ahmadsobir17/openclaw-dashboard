#!/bin/bash
set -e

echo ">>> Setting up Telegram channel on OpenClaw..."
# Use the claw CLI inside the openclaw container
docker compose exec openclaw claw channels add --channel telegram --token "${TELEGRAM_BOT_TOKEN}"

echo ">>> Channel setup complete."
