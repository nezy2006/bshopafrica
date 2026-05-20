#!/bin/bash
echo "Pulling latest code..."
git pull origin main
echo "Installing dependencies..."
npm install --production
echo "Building..."
npm run build
echo "Copying static files..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
echo "Restarting app..."
pkill -f "node .next/standalone/server.js" || true
nohup node .next/standalone/server.js > app.log 2>&1 &
echo "Done! Site is live."
