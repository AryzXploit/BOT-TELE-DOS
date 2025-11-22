#!/bin/bash

# Test C2 API Script
# Author: Aryzz-Dev

API_URL="http://localhost:8080/api"
API_KEY="aryzz-c2-api-key-2024"

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              🧪 C2 API TEST SCRIPT 🧪                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test health endpoint
echo -e "${CYAN}[TEST 1]${NC} Health Check"
curl -s "$API_URL/health" | jq '.'
echo ""

# Test stats
echo -e "${CYAN}[TEST 2]${NC} Get Overview Stats"
curl -s -H "X-API-Key: $API_KEY" "$API_URL/stats/overview" | jq '.'
echo ""

# Test bots list
echo -e "${CYAN}[TEST 3]${NC} List Bots"
curl -s -H "X-API-Key: $API_KEY" "$API_URL/bots" | jq '.'
echo ""

# Test attacks list
echo -e "${CYAN}[TEST 4]${NC} List Attacks"
curl -s -H "X-API-Key: $API_KEY" "$API_URL/attacks?limit=10" | jq '.'
echo ""

# Test start attack (commented out for safety)
echo -e "${YELLOW}[TEST 5]${NC} Start Attack (Example - Commented)"
echo "curl -X POST -H 'X-API-Key: $API_KEY' -H 'Content-Type: application/json' \\"
echo "  -d '{\"target\":\"https://example.com\",\"method\":\"GET\",\"threads\":100,\"duration\":60,\"rpc\":10}' \\"
echo "  $API_URL/attack/start"
echo ""

echo -e "${GREEN}✅ API Tests Completed${NC}"
echo ""
echo "To start an attack, uncomment the last curl command or use the dashboard:"
echo "http://localhost:8080/dashboard"
