#!/bin/bash
set -e

echo "Set Node Version..."
nvm use

echo "🔨 Building..."
npm run build

echo "📦 Committing..."
git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M') WIB"
git push origin main

echo "✅ Done! Sekarang di STB jalankan: /home/sidrive/deploy.sh"
