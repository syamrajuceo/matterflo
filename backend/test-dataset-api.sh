#!/bin/bash

# Test script for Dataset Builder API
# This script tests all Dataset Builder endpoints

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
echo "Dataset Builder API Test Script"
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

# Step 2: Create a dataset
echo "Step 2: Creating dataset 'Sales Dashboard'..."
CREATE_DATASET_RESPONSE=$(make_request "POST" "/datasets" \
  "{\"name\":\"Sales Dashboard\",\"description\":\"Sales metrics and reports\",\"category\":\"Sales\"}" \
  "$TOKEN")

CREATE_HTTP_CODE=$(echo "$CREATE_DATASET_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
CREATE_RESPONSE_BODY=$(echo "$CREATE_DATASET_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

if command -v jq &> /dev/null; then
  DATASET_ID=$(echo "$CREATE_RESPONSE_BODY" | jq -r '.data.id // empty')
else
  DATASET_ID=$(echo "$CREATE_RESPONSE_BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$DATASET_ID" ] || [ "$DATASET_ID" == "null" ] || [ "$DATASET_ID" == "" ]; then
  echo -e "${RED}❌ Failed to create dataset${NC}"
  echo "HTTP Code: $CREATE_HTTP_CODE"
  echo "Response: $CREATE_RESPONSE_BODY"
  exit 1
fi

echo -e "${GREEN}✓ Dataset created${NC}"
echo "Dataset ID: $DATASET_ID"
echo ""

# Step 3: Add sections to dataset
echo "Step 3: Adding sections to dataset..."

# Add text section
echo "  Adding 'text' section..."
TEXT_SECTION_RESPONSE=$(make_request "POST" "/datasets/$DATASET_ID/sections" \
  "{\"type\":\"text\",\"title\":\"Introduction\",\"config\":{\"content\":\"# Sales Dashboard\\n\\nWelcome to the Sales Dashboard. This dashboard provides insights into sales performance.\"}}" \
  "$TOKEN")

if echo "$TEXT_SECTION_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$TEXT_SECTION_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  echo -e "  ${GREEN}✓ Text section added${NC}"
else
  echo -e "  ${RED}❌ Failed to add text section${NC}"
  echo "  Response: $TEXT_SECTION_RESPONSE"
fi

# Add tasks section
echo "  Adding 'tasks' section..."
TASKS_SECTION_RESPONSE=$(make_request "POST" "/datasets/$DATASET_ID/sections" \
  "{\"type\":\"tasks\",\"title\":\"Sales Tasks\",\"config\":{\"layout\":\"list\",\"filters\":{\"status\":\"IN_PROGRESS\"}}}" \
  "$TOKEN")

if echo "$TASKS_SECTION_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$TASKS_SECTION_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  echo -e "  ${GREEN}✓ Tasks section added${NC}"
else
  echo -e "  ${RED}❌ Failed to add tasks section${NC}"
  echo "  Response: $TASKS_SECTION_RESPONSE"
fi

# Try to get a table ID for data-table and chart sections
echo "  Checking for existing tables..."
LIST_TABLES_RESPONSE=$(make_request "GET" "/database" "" "$TOKEN")
TABLE_ID=""

if command -v jq &> /dev/null; then
  TABLE_ID=$(echo "$LIST_TABLES_RESPONSE" | jq -r '.data[0].id // empty' 2>/dev/null)
else
  TABLE_ID=$(echo "$LIST_TABLES_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
fi

if [ -n "$TABLE_ID" ] && [ "$TABLE_ID" != "null" ]; then
  echo "  Found table ID: $TABLE_ID"
  
  # Add data-table section
  echo "  Adding 'data-table' section..."
  TABLE_SECTION_RESPONSE=$(make_request "POST" "/datasets/$DATASET_ID/sections" \
    "{\"type\":\"data-table\",\"title\":\"Recent Orders\",\"config\":{\"tableId\":\"$TABLE_ID\",\"columns\":[],\"sortBy\":{\"field\":\"createdAt\",\"order\":\"desc\"}}}" \
    "$TOKEN")

  if echo "$TABLE_SECTION_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$TABLE_SECTION_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
    echo -e "  ${GREEN}✓ Data table section added${NC}"
  else
    echo -e "  ${YELLOW}⚠ Failed to add data table section (table may not have fields)${NC}"
  fi

  # Add chart section
  echo "  Adding 'data-chart' section..."
  CHART_SECTION_RESPONSE=$(make_request "POST" "/datasets/$DATASET_ID/sections" \
    "{\"type\":\"data-chart\",\"title\":\"Sales Chart\",\"config\":{\"chartType\":\"bar\",\"dataSource\":{\"tableId\":\"$TABLE_ID\",\"xAxis\":\"createdAt\",\"yAxis\":\"id\",\"aggregation\":\"count\"}}}" \
    "$TOKEN")

  if echo "$CHART_SECTION_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$CHART_SECTION_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
    echo -e "  ${GREEN}✓ Chart section added${NC}"
  else
    echo -e "  ${YELLOW}⚠ Failed to add chart section${NC}"
  fi

  # Add data-cards section
  echo "  Adding 'data-cards' section..."
  CARDS_SECTION_RESPONSE=$(make_request "POST" "/datasets/$DATASET_ID/sections" \
    "{\"type\":\"data-cards\",\"title\":\"Order Cards\",\"config\":{\"tableId\":\"$TABLE_ID\",\"template\":\"{{name}} - {{amount}}\",\"columns\":2,\"limit\":10}}" \
    "$TOKEN")

  if echo "$CARDS_SECTION_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$CARDS_SECTION_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
    echo -e "  ${GREEN}✓ Data cards section added${NC}"
  else
    echo -e "  ${YELLOW}⚠ Failed to add data cards section${NC}"
  fi
else
  echo -e "  ${YELLOW}⚠ No tables found. Skipping data-table, chart, and cards sections.${NC}"
  echo "  Create a table first using: npm run test:database-api"
fi

echo ""

# Step 4: Get dataset to verify sections
echo "Step 4: Getting dataset details..."
GET_DATASET_RESPONSE=$(make_request "GET" "/datasets/$DATASET_ID" "" "$TOKEN")

if echo "$GET_DATASET_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$GET_DATASET_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  echo -e "${GREEN}✓ Dataset retrieved${NC}"
  if command -v jq &> /dev/null; then
    SECTION_COUNT=$(echo "$GET_DATASET_RESPONSE" | jq '.data.sections | length' 2>/dev/null || echo "0")
  else
    SECTION_COUNT=$(echo "$GET_DATASET_RESPONSE" | grep -o '"sections":\[[^]]*\]' | grep -o '{"id"' | wc -l)
  fi
  echo "  Sections count: $SECTION_COUNT"
else
  echo -e "${RED}❌ Failed to get dataset${NC}"
  echo "Response: $GET_DATASET_RESPONSE"
fi

echo ""

# Step 5: Get dataset with data
echo "Step 5: Getting dataset with populated data..."
GET_DATA_RESPONSE=$(make_request "GET" "/datasets/$DATASET_ID/data" "" "$TOKEN")

if echo "$GET_DATA_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$GET_DATA_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  echo -e "${GREEN}✓ Dataset data retrieved${NC}"
  if command -v jq &> /dev/null; then
    DATA_KEYS=$(echo "$GET_DATA_RESPONSE" | jq '.data.data | keys | length' 2>/dev/null || echo "0")
    echo "  Data sections: $DATA_KEYS"
  fi
else
  echo -e "${RED}❌ Failed to get dataset data${NC}"
  echo "Response: $GET_DATA_RESPONSE"
fi

echo ""

# Step 6: Update dataset
echo "Step 6: Updating dataset..."
UPDATE_RESPONSE=$(make_request "PUT" "/datasets/$DATASET_ID" \
  "{\"description\":\"Updated Sales Dashboard with comprehensive metrics\"}" \
  "$TOKEN")

if echo "$UPDATE_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$UPDATE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  echo -e "${GREEN}✓ Dataset updated${NC}"
else
  echo -e "${RED}❌ Failed to update dataset${NC}"
  echo "Response: $UPDATE_RESPONSE"
fi

echo ""

# Step 7: Get section IDs for reordering
echo "Step 7: Getting section IDs for reordering..."
if command -v jq &> /dev/null; then
  SECTION_IDS=$(echo "$GET_DATASET_RESPONSE" | jq -r '.data.sections[].id' 2>/dev/null | tr '\n' ' ')
  SECTION_IDS_ARRAY=$(echo "$GET_DATASET_RESPONSE" | jq -r '[.data.sections[].id]' 2>/dev/null)
else
  SECTION_IDS=$(echo "$GET_DATASET_RESPONSE" | grep -o '"id":"[^"]*' | grep -v "$DATASET_ID" | cut -d'"' -f4 | tr '\n' ' ')
fi

if [ -n "$SECTION_IDS" ] && [ "$SECTION_IDS" != "null" ] && [ "$SECTION_IDS" != "" ]; then
  echo "  Reordering sections..."
  if command -v jq &> /dev/null; then
    REORDER_RESPONSE=$(make_request "PUT" "/datasets/$DATASET_ID/sections/reorder" \
      "{\"sectionIds\":$SECTION_IDS_ARRAY}" \
      "$TOKEN")
  else
    # Build JSON array manually
    SECTION_IDS_JSON="["
    FIRST=true
    for id in $SECTION_IDS; do
      if [ "$FIRST" = true ]; then
        SECTION_IDS_JSON="$SECTION_IDS_JSON\"$id\""
        FIRST=false
      else
        SECTION_IDS_JSON="$SECTION_IDS_JSON,\"$id\""
      fi
    done
    SECTION_IDS_JSON="$SECTION_IDS_JSON]"
    
    REORDER_RESPONSE=$(make_request "PUT" "/datasets/$DATASET_ID/sections/reorder" \
      "{\"sectionIds\":$SECTION_IDS_JSON}" \
      "$TOKEN")
  fi

  if echo "$REORDER_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$REORDER_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
    echo -e "  ${GREEN}✓ Sections reordered${NC}"
  else
    echo -e "  ${YELLOW}⚠ Failed to reorder sections${NC}"
    echo "  Response: $REORDER_RESPONSE"
  fi
else
  echo -e "  ${YELLOW}⚠ No sections found to reorder${NC}"
fi

echo ""

# Step 8: Publish dataset
echo "Step 8: Publishing dataset..."
PUBLISH_RESPONSE=$(make_request "POST" "/datasets/$DATASET_ID/publish" "" "$TOKEN")

if echo "$PUBLISH_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$PUBLISH_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  echo -e "${GREEN}✓ Dataset published${NC}"
  if command -v jq &> /dev/null; then
    STATUS=$(echo "$PUBLISH_RESPONSE" | jq -r '.data.status' 2>/dev/null)
    echo "  Status: $STATUS"
  fi
else
  echo -e "${RED}❌ Failed to publish dataset${NC}"
  echo "Response: $PUBLISH_RESPONSE"
fi

echo ""

# Step 9: List all datasets
echo "Step 9: Listing all datasets..."
LIST_RESPONSE=$(make_request "GET" "/datasets" "" "$TOKEN")

if echo "$LIST_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$LIST_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  if command -v jq &> /dev/null; then
    DATASET_COUNT=$(echo "$LIST_RESPONSE" | jq '.data | length' 2>/dev/null || echo "0")
  else
    DATASET_COUNT=$(echo "$LIST_RESPONSE" | grep -o '"id":"[^"]*' | wc -l)
  fi
  echo -e "${GREEN}✓ Datasets listed${NC}"
  echo "  Total datasets: $DATASET_COUNT"
else
  echo -e "${RED}❌ Failed to list datasets${NC}"
  echo "Response: $LIST_RESPONSE"
fi

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Dataset Builder API Test Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Created dataset ID: $DATASET_ID"
echo "You can use this ID to test additional operations:"
echo ""
echo "  # Get dataset details:"
echo "  curl \"$API_URL/datasets/$DATASET_ID\" \\"
echo "    -H \"Authorization: Bearer $TOKEN\""
echo ""
echo "  # Get dataset with data:"
echo "  curl \"$API_URL/datasets/$DATASET_ID/data\" \\"
echo "    -H \"Authorization: Bearer $TOKEN\""
echo ""
echo "  # Update dataset:"
echo "  curl -X PUT \"$API_URL/datasets/$DATASET_ID\" \\"
echo "    -H \"Authorization: Bearer $TOKEN\" \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -d '{\"description\":\"Updated description\"}'"
echo ""

