#!/bin/bash

# Exit on error
set -e

###############################################################################
# Testing redeployment script
# - Repo worktree dir:   /home/andresparra/ProfeVision-i18n
# - Static root (nginx): /www/html/testing-profevision/_next/static
# - App port:            3002
# - PM2 process name:    profevision-testing
###############################################################################

PROJECT_DIR="/home/andresparra/ProfeVision-i18n"
NEXT_DIR="$PROJECT_DIR/.next"
NEXT_STATIC_DIR="$NEXT_DIR/static"
NGINX_STATIC_DIR="/var/www/testing-profevision/_next/static"
PM2_NAME="profevision-testing"
APP_PORT=3002

echo "🚀 Starting TESTING redeployment..."

cd "$PROJECT_DIR"

echo "📦 Fetching latest changes..."
git fetch origin
git pull --ff-only || true

echo "🧹 Cleaning previous build (.next)..."
rm -rf "$NEXT_DIR"

echo "📥 Installing dependencies (yarn)..."
yarn install --frozen-lockfile

echo "🏗️  Building the application (production)..."
NODE_ENV=production yarn build

echo "🗂️  Updating static assets for nginx..."
sudo mkdir -p "$NGINX_STATIC_DIR"
sudo rsync -a --delete "$NEXT_STATIC_DIR/" "$NGINX_STATIC_DIR/"
sudo chown -R www-data:www-data "/var/www/testing-profevision"
sudo find "/var/www/testing-profevision" -type d -exec chmod 755 {} \;
sudo find "/var/www/testing-profevision" -type f -exec chmod 644 {} \;

echo "🔎 Verifying CSS files..."
if [ -d "$NEXT_STATIC_DIR/css" ] && [ "$(ls -A "$NEXT_STATIC_DIR/css" 2>/dev/null)" ]; then
  echo "✅ CSS files in build directory:"
  ls -la "$NEXT_STATIC_DIR/css"
  echo "✅ CSS files in nginx directory:"
  ls -la "$NGINX_STATIC_DIR/css" || echo "⚠️ CSS directory not found in nginx path"
else
  echo "⚠️ No CSS files found in build directory (this may be OK depending on build)"
fi

echo "🔁 Restarting testing app with PM2 on port $APP_PORT..."
pm2 delete "$PM2_NAME" || true
PORT=$APP_PORT HOST=0.0.0.0 NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 \
  pm2 start yarn --name "$PM2_NAME" -- start -p "$APP_PORT" -H 0.0.0.0

echo "💾 Saving PM2 process list..."
pm2 save

echo "🩺 Health check on http://localhost:$APP_PORT ..."
sleep 5
if curl -sf "http://localhost:$APP_PORT" > /dev/null; then
  echo "✅ Testing app is running on port $APP_PORT"
  pm2 status "$PM2_NAME"
else
  echo "⚠️ Warning: Testing app may not be running properly."
  echo "   Check logs with: pm2 logs $PM2_NAME"
fi

echo "✨ Testing redeployment completed!"