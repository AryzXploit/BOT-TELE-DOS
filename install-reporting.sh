#!/bin/bash

echo "📦 Installing Advanced Reporting Dependencies..."

npm install --save puppeteer chart.js chartjs-node-canvas

echo "✅ Dependencies installed!"
echo ""
echo "Installed packages:"
echo "  - puppeteer (PDF generation)"
echo "  - chart.js (Charts)"
echo "  - chartjs-node-canvas (Server-side charts)"
