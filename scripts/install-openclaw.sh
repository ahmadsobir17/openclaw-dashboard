#!/bin/bash
set -e

echo ">>> Cloning OpenClaw..."
git clone https://github.com/openclaw/openclaw.git .openclaw-setup

echo ">>> Running OpenClaw docker-setup..."
cd .openclaw-setup
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
export OPENCLAW_EXTRA_MOUNTS="$(pwd)/../config/instagram_cookies.json:/home/node/config/instagram_cookies.json:ro,$(pwd)/../config/accounts.json:/home/node/config/accounts.json:ro"
./docker-setup.sh

echo ">>> OpenClaw setup complete."
cd ..
echo ">>> Run: docker compose up -d --build"
