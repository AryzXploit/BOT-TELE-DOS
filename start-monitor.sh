#!/bin/bash

# Start Real-time Attack Monitor
# Usage: ./start-monitor.sh [interval_ms]

INTERVAL=${1:-2000}

echo "🔥 Starting Aryzz-Stresser Real-time Monitor..."
echo "Update interval: ${INTERVAL}ms"
echo ""

node monitor.js --interval $INTERVAL
