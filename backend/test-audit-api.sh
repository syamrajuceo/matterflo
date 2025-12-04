#!/bin/bash

# Test script for Audit Logs API
# This script performs some actions and then verifies audit logs + CSV export

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
echo "Audit Logs API Test Script"
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

# Step 2: Perform some actions to generate audit logs
echo "Step 2: Creating a test task to generate audit logs..."
CREATE_TASK_RESPONSE=$(make_request "POST" "/tasks" \
  "{\"name\":\"Audit Test Task\",\"description\":\"Task to generate audit logs\",\"status\":\"DRAFT\"}" \
  "$TOKEN")

CREATE_TASK_HTTP_CODE=$(echo "$CREATE_TASK_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
CREATE_TASK_BODY=$(echo "$CREATE_TASK_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

if [ "$CREATE_TASK_HTTP_CODE" != "200" ] && [ "$CREATE_TASK_HTTP_CODE" != "201" ]; then
  echo -e "${YELLOW}⚠️  Task creation may have failed (HTTP $CREATE_TASK_HTTP_CODE)${NC}"
  echo "Response: $CREATE_TASK_BODY"
else
  echo -e "${GREEN}✓ Task created (likely logged in audit)${NC}"
fi

echo ""

# Step 3: Get audit logs with pagination
echo "Step 3: Fetching audit logs (page=1, limit=20)..."
LOGS_RESPONSE=$(make_request "GET" "/audit/logs?page=1&limit=20" "" "$TOKEN")

LOGS_HTTP_CODE=$(echo "$LOGS_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
LOGS_BODY=$(echo "$LOGS_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

echo "HTTP Code: $LOGS_HTTP_CODE"

if command -v jq &> \&> /dev/null; then
  TOTAL_LOGS=$(echo "$LOGS_BODY" | jq -r '.data.total // empty')
  FIRST_ACTION=$(echo "$LOGS_BODY" | jq -r '.data.logs[0].action // empty')
else
  TOTAL_LOGS=$(echo "$LOGS_BODY" | grep -o '"total":[0-9]*' | head -n1 | cut -d':' -f2)
  FIRST_ACTION=$(echo "$LOGS_BODY" | grep -o '"action":"[^"]*' | head -n1 | cut -d'"' -f4)
fi

if [ "$LOGS_HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✓ Successfully fetched audit logs${NC}"
  echo "Total logs (from response): ${TOTAL_LOGS:-unknown}"
  echo "First log action: ${FIRST_ACTION:-unknown}"
else
  echo -e "${RED}❌ Failed to fetch audit logs${NC}"
  echo "Response: $LOGS_BODY"
fi

echo ""

# Step 4: Filter by entity (Task)
echo "Step 4: Fetching audit logs filtered by entity=Task..."
FILTER_RESPONSE=$(make_request "GET" "/audit/logs?entity=Task&action=task.created" "" "$TOKEN")

FILTER_HTTP_CODE=$(echo "$FILTER_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
FILTER_BODY=$(echo "$FILTER_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

echo "HTTP Code: $FILTER_HTTP_CODE"

if command -v jq &> /dev/null; then
  FILTER_COUNT=$(echo "$FILTER_BODY" | jq -r '.data.total // empty')
else
  FILTER_COUNT=$(echo "$FILTER_BODY" | grep -o '"total":[0-9]*' | head -n1 | cut -d':' -f2)
fi

if [ "$FILTER_HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✓ Successfully fetched filtered audit logs${NC}"
  echo "Filtered logs count (from response): ${FILTER_COUNT:-unknown}"
else
  echo -e "${RED}❌ Failed to fetch filtered audit logs${NC}"
  echo "Response: $FILTER_BODY"
fi

echo ""

# Step 5: Export logs as CSV
echo "Step 5: Exporting audit logs as CSV..."
EXPORT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$API_URL/audit/logs/export" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)

EXPORT_HTTP_CODE=$(echo "$EXPORT_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
EXPORT_BODY=$(echo "$EXPORT_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')

if [ "$EXPORT_HTTP_CODE" == "200" ]; then
  echo "$EXPORT_BODY" > audit-logs.csv
  echo -e "${GREEN}✓ Audit logs exported to audit-logs.csv${NC}"
else
  echo -e "${RED}❌ Failed to export audit logs${NC}"
  echo "HTTP Code: $EXPORT_HTTP_CODE"
  echo "Response: $EXPORT_BODY"
fi

echo ""
echo -e "${GREEN}Done. Audit logs API test completed.${NC}"


