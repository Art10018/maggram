#!/bin/bash
set -e

BRANCH="main"

echo "📥 Updating code..."
git fetch origin
git reset --hard origin/$BRANCH

echo "📦 Installing backend dependencies..."
cd backend
npm ci || npm install

echo "🔄 Restarting backend..."
# ЕСЛИ У ТЕБЯ PM2:
if command -v pm2 &> /dev/null; then
    pm2 restart all
fi

# ЕСЛИ systemd сервис (раскомментируй если нужно)
# sudo systemctl restart maggram-backend

cd ../frontend

echo "📦 Installing frontend dependencies..."
npm ci || npm install

echo "🏗 Building frontend..."
npm run build

echo "🚀 Deploying frontend..."
sudo rsync -av --delete dist/ /var/www/maggram/

echo "🔄 Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ DEPLOY COMPLETE"
