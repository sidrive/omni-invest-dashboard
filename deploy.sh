#!/bin/bash
echo "🔨 Building..."
npm run build

echo "📦 Commit & push..."
git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')"
git push origin main

echo "✅ Done! Sekarang di STB jalankan: git pull"