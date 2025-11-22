#!/bin/bash

# Aryzz C2 Quick Start Script
# Author: Aryzz-Dev

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          🎯 ARYZZ C2 QUICK START SCRIPT 🎯               ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored text
print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if node is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    print_info "Please install Node.js 18+ first"
    exit 1
fi

print_success "Node.js $(node -v) detected"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_warning "Dependencies not found. Installing..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
fi

# Menu
echo ""
echo "Select mode:"
echo "1) Start C2 Server"
echo "2) Start C2 Agent (Bot)"
echo "3) Start Both (Server + Agent)"
echo "4) View C2 Guide"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        print_info "Starting C2 Server..."
        echo ""
        read -p "Enter port (default 8080): " port
        port=${port:-8080}
        
        read -p "Enter API key (default: aryzz-c2-api-key-2024): " apikey
        apikey=${apikey:-aryzz-c2-api-key-2024}
        
        print_success "Starting C2 Server on port $port"
        print_info "Dashboard: http://localhost:$port/dashboard"
        print_info "API: http://localhost:$port/api"
        print_info "API Key: $apikey"
        echo ""
        
        node index.js c2-server -p $port --api-key "$apikey"
        ;;
        
    2)
        print_info "Starting C2 Agent..."
        echo ""
        read -p "Enter C2 server URL (default: http://localhost:8080): " c2url
        c2url=${c2url:-http://localhost:8080}
        
        read -p "Enter API key (default: aryzz-c2-api-key-2024): " apikey
        apikey=${apikey:-aryzz-c2-api-key-2024}
        
        print_success "Connecting to C2 Server: $c2url"
        print_info "API Key: $apikey"
        echo ""
        
        node index.js c2-agent --c2-url "$c2url" --api-key "$apikey"
        ;;
        
    3)
        print_info "Starting C2 Server and Agent..."
        echo ""
        
        # Start server in background
        print_info "Starting C2 Server on port 8080..."
        node index.js c2-server -p 8080 &
        SERVER_PID=$!
        
        # Wait for server to start
        sleep 3
        
        # Start agent
        print_info "Starting C2 Agent..."
        node index.js c2-agent --c2-url http://localhost:8080 &
        AGENT_PID=$!
        
        print_success "C2 Server PID: $SERVER_PID"
        print_success "C2 Agent PID: $AGENT_PID"
        print_info "Dashboard: http://localhost:8080/dashboard"
        echo ""
        print_warning "Press Ctrl+C to stop both processes"
        
        # Wait for both processes
        wait $SERVER_PID $AGENT_PID
        ;;
        
    4)
        print_info "Opening C2 Guide..."
        if [ -f "C2-GUIDE.md" ]; then
            cat C2-GUIDE.md | less
        else
            print_error "C2-GUIDE.md not found!"
        fi
        ;;
        
    *)
        print_error "Invalid choice!"
        exit 1
        ;;
esac
