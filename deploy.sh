#!/bin/bash
set -e

echo "Set Node Version..."
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # nvm hanya tersedia setelah di-source (bukan di PATH seperti node/npm)
  . "$NVM_DIR/nvm.sh"
  nvm use
else
  echo "⚠️  nvm tidak ada — memakai Node dari PATH: $(node -v 2>/dev/null || echo 'tidak terpasang')"
fi

echo "🔨 Building..."
npm run build

echo "📦 Committing..."
git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M') WIB"
git push origin main

echo "✅ Done! Sekarang di STB jalankan: /home/sidrive/deploy.sh"
