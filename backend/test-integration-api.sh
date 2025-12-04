#!/bin/bash

# Test script for Integration/Webhook API
# This script tests webhook integration creation, workflow, and webhook execution

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
echo "Integration/Webhook API Test Script"
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

# Step 2: Create webhook integration
echo "Step 2: Creating webhook integration 'Order Notifications'..."
CREATE_INT_RESPONSE=$(make_request "POST" "/integrations" \
  "{\"name\":\"Order Notifications\",\"type\":\"WEBHOOK\"}" \
  "$TOKEN")

INT_HTTP_CODE=$(echo "$CREATE_INT_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
INT_BODY=$(echo "$CREATE_INT_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

if command -v jq &> /dev/null; then
  INTEGRATION_ID=$(echo "$INT_BODY" | jq -r '.data.id // empty')
  WEBHOOK_URL=$(echo "$INT_BODY" | jq -r '.data.webhookUrl // empty')
else
  INTEGRATION_ID=$(echo "$INT_BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  WEBHOOK_URL=$(echo "$INT_BODY" | grep -o '"webhookUrl":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$INTEGRATION_ID" ] || [ "$INTEGRATION_ID" == "null" ] || [ "$INTEGRATION_ID" == "" ]; then
  echo -e "${RED}❌ Failed to create integration${NC}"
  echo "HTTP Code: $INT_HTTP_CODE"
  echo "Response: $INT_BODY"
  exit 1
fi

echo -e "${GREEN}✓ Integration created${NC}"
echo "Integration ID: $INTEGRATION_ID"
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Step 3: Create workflow for integration
echo "Step 3: Creating workflow 'Create Task on Order'..."

WORKFLOW_PAYLOAD='{
  "name": "Create Task on Order",
  "triggerConfig": {
    "event": "webhook_received",
    "filters": { "event_type": "order.created" }
  },
  "actionConfig": {
    "action": "create_task",
    "params": { "taskId": "order_processing_task_id" }
  }
}'

CREATE_WF_RESPONSE=$(make_request "POST" "/integrations/$INTEGRATION_ID/workflows" \
  "$WORKFLOW_PAYLOAD" \
  "$TOKEN")

WF_HTTP_CODE=$(echo "$CREATE_WF_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
WF_BODY=$(echo "$CREATE_WF_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

if command -v jq &> /dev/null; then
  WORKFLOW_ID=$(echo "$WF_BODY" | jq -r '.data.id // empty')
else
  WORKFLOW_ID=$(echo "$WF_BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$WORKFLOW_ID" ] || [ "$WORKFLOW_ID" == "null" ] || [ "$WORKFLOW_ID" == "" ]; then
  echo -e "${RED}❌ Failed to create workflow${NC}"
  echo "HTTP Code: $WF_HTTP_CODE"
  echo "Response: $WF_BODY"
  exit 1
fi

echo -e "${GREEN}✓ Workflow created${NC}"
echo "Workflow ID: $WORKFLOW_ID"
echo ""

# Step 4: Test webhook
if [ -z "$WEBHOOK_URL" ] || [ "$WEBHOOK_URL" == "null" ]; then
  echo -e "${YELLOW}⚠ No webhookUrl returned from API. Cannot test webhook automatically.${NC}"
else
  echo "Step 4: Testing webhook at $WEBHOOK_URL..."

  WEBHOOK_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d '{"event_type":"order.created","order_id":"12345","customer":"John Doe"}' 2>/dev/null)

  WEBHOOK_HTTP_CODE=$(echo "$WEBHOOK_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
  WEBHOOK_BODY=$(echo "$WEBHOOK_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

  if echo "$WEBHOOK_BODY" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$WEBHOOK_BODY" | jq -e '.success == true' > /dev/null 2>&1); then
    echo -e "${GREEN}✓ Webhook call succeeded${NC}"
  else
    echo -e "${YELLOW}⚠ Webhook response did not indicate success${NC}"
    echo "HTTP Code: $WEBHOOK_HTTP_CODE"
    echo "Response: $WEBHOOK_BODY"
  fi
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Integration/Webhook API Test Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Integration ID: $INTEGRATION_ID"
echo "Workflow ID: $WORKFLOW_ID"
echo "Webhook URL: $WEBHOOK_URL"
echo ""
echo "You can replicate these steps manually using the docs curl examples."
echo ""

