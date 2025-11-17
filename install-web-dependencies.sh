#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     📦 Installing Web Dashboard Dependencies 📦          ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "🔧 Installing backend dependencies..."
npm install express@4.18.2 \
    express-session@1.17.3 \
    express-validator@7.0.1 \
    express-rate-limit@7.1.5 \
    cookie-parser@1.4.6 \
    bcrypt@5.1.1 \
    jsonwebtoken@9.0.2 \
    ejs@3.1.9 \
    multer@1.4.5-lts.1 \
    socket.io@4.6.1 \
    sqlite@5.1.1 \
    sqlite3@5.1.7

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "🚀 You can now start the web dashboard with:"
echo "   npm run web"
echo ""
echo "   Or:"
echo "   node index.js web-dashboard"
echo ""
echo "🌐 Access at: http://localhost:3000"
echo "👤 Default admin: admin / admin123"
echo ""
