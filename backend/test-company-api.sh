#!/bin/bash

# Test script for Company Hierarchy API
# This script tests department and hierarchy endpoints

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000/api}"
EMAIL="${TEST_EMAIL:-admin@test-company.local}"
PASSWORD="${TEST_PASSWORD:-password123}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Company Hierarchy API Test Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if backend server is running
echo "Checking backend server connection..."
SERVER_CHECK=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 5 "$API_URL/auth/login" 2>/dev/null || echo "000")

if [ "$SERVER_CHECK" == "000" ] || [ "$SERVER_CHECK" == "" ]; then
  SERVER_CHECK=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 5 "http://localhost:3000/api/auth/login" 2>/dev/null || echo "000")
  
  if [ "$SERVER_CHECK" == "000" ] || [ "$SERVER_CHECK" == "" ]; then
    echo -e "${RED}❌ Cannot connect to backend server${NC}"
    echo ""
    echo "Please ensure:"
    echo "  1. Backend server is running: cd backend && npm run dev"
    echo "  2. Server is listening on port 3000"
    echo ""
    exit 1
  else
    API_URL="http://localhost:3000/api"
    echo -e "${GREEN}✓ Backend server is running on http://localhost:3000${NC}"
  fi
else
  echo -e "${GREEN}✓ Backend server is reachable at $API_URL${NC}"
fi

echo ""

# Function to make API requests
make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local token=$4
  
  local response
  
  if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
    if [ -n "$token" ] && [ "$token" != "null" ]; then
      response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" "$API_URL$endpoint" \
        -H "Authorization: Bearer $token" 2>/dev/null)
    else
      response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" "$API_URL$endpoint" 2>/dev/null)
    fi
  else
    if [ -n "$token" ] && [ "$token" != "null" ]; then
      response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" "$API_URL$endpoint" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d "$data" 2>/dev/null)
    else
      response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" "$API_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data" 2>/dev/null)
    fi
  fi
  
  echo "$response"
}

# Step 1: Login to get token
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(make_request "POST" "/auth/login" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

if command -v jq &> /dev/null; then
  TOKEN=$(echo "$RESPONSE_BODY" | jq -r '.data.token // empty')
else
  TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ] || [ "$TOKEN" == "" ]; then
  echo -e "${RED}❌ Login failed${NC}"
  echo "HTTP Code: $HTTP_CODE"
  echo "Response: $RESPONSE_BODY"
  echo ""
  echo "Please check:"
  echo "  1. Test user exists (cd backend && npm run create:test-data)"
  echo "  2. Login credentials are correct"
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Create root department
echo "Step 2: Creating root department 'Engineering'..."
ROOT_DEP_RESPONSE=$(make_request "POST" "/company/departments" \
  "{\"name\":\"Engineering\",\"description\":\"Engineering team\"}" \
  "$TOKEN")

ROOT_HTTP_CODE=$(echo "$ROOT_DEP_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
ROOT_BODY=$(echo "$ROOT_DEP_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

if command -v jq &> /dev/null; then
  ROOT_DEPT_ID=$(echo "$ROOT_BODY" | jq -r '.data.id // empty')
else
  ROOT_DEPT_ID=$(echo "$ROOT_BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$ROOT_DEPT_ID" ] || [ "$ROOT_DEPT_ID" == "null" ] || [ "$ROOT_DEPT_ID" == "" ]; then
  echo -e "${RED}❌ Failed to create root department${NC}"
  echo "HTTP Code: $ROOT_HTTP_CODE"
  echo "Response: $ROOT_BODY"
  exit 1
fi

echo -e "${GREEN}✓ Root department created${NC}"
echo "Root Department ID: $ROOT_DEPT_ID"

echo ""

# Step 3: Create child department
echo "Step 3: Creating child department 'Frontend Team'..."
CHILD_DEP_RESPONSE=$(make_request "POST" "/company/departments" \
  "{\"name\":\"Frontend Team\",\"description\":\"Frontend developers\",\"parentId\":\"$ROOT_DEPT_ID\"}" \
  "$TOKEN")

CHILD_HTTP_CODE=$(echo "$CHILD_DEP_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
CHILD_BODY=$(echo "$CHILD_DEP_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

if command -v jq &> /dev/null; then
  CHILD_DEPT_ID=$(echo "$CHILD_BODY" | jq -r '.data.id // empty')
else
  CHILD_DEPT_ID=$(echo "$CHILD_BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$CHILD_DEPT_ID" ] || [ "$CHILD_DEPT_ID" == "null" ] || [ "$CHILD_DEPT_ID" == "" ]; then
  echo -e "${RED}❌ Failed to create child department${NC}"
  echo "HTTP Code: $CHILD_HTTP_CODE"
  echo "Response: $CHILD_BODY"
  exit 1
fi

echo -e "${GREEN}✓ Child department created${NC}"
echo "Child Department ID: $CHILD_DEPT_ID"

echo ""

# Step 4: Get hierarchy tree
echo "Step 4: Getting company hierarchy tree..."
HIER_RESPONSE=$(make_request "GET" "/company/hierarchy" "" "$TOKEN")

HIER_HTTP_CODE=$(echo "$HIER_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
HIER_BODY=$(echo "$HIER_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

if echo "$HIER_BODY" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$HIER_BODY" | jq -e '.success == true' > /dev/null 2>&1); then
  echo -e "${GREEN}✓ Hierarchy retrieved${NC}"
  if command -v jq &> /dev/null; then
    echo "$HIER_BODY" | jq '.data' | sed 's/^/  /'
  else
    echo "$HIER_BODY"
  fi
else
  echo -e "${RED}❌ Failed to get hierarchy tree${NC}"
  echo "HTTP Code: $HIER_HTTP_CODE"
  echo "Response: $HIER_BODY"
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Company Hierarchy API Test Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Root Department ID: $ROOT_DEPT_ID"
echo "Child Department ID: $CHILD_DEPT_ID"
echo ""
echo "You can run the raw curl examples from docs:"
echo "  # Create root department"
echo "  curl -X POST \"$API_URL/company/departments\" -H \"Authorization: Bearer $TOKEN\" -H \"Content-Type: application/json\" -d '{\"name\":\"Engineering\",\"description\":\"Engineering team\"}'"
echo ""
echo "  # Create child department"
echo "  curl -X POST \"$API_URL/company/departments\" -H \"Authorization: Bearer $TOKEN\" -H \"Content-Type: application/json\" -d '{\"name\":\"Frontend Team\",\"description\":\"Frontend developers\",\"parentId\":\"$ROOT_DEPT_ID\"}'"
echo ""
echo "  # Get hierarchy tree"
echo "  curl \"$API_URL/company/hierarchy\" -H \"Authorization: Bearer $TOKEN\""
echo ""


