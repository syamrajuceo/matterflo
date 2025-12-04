#!/bin/bash

# Test script for Task Builder API endpoints
# This script tests all Task Builder endpoints using curl

BASE_URL="http://localhost:3000"
API_URL="${BASE_URL}/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Task Builder API Test Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Login to get token
echo "1. Logging in to get authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test-company.local",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Login failed!${NC}"
  echo "Response: $LOGIN_RESPONSE"
  echo ""
  echo "Please make sure:"
  echo "  1. Backend server is running (npm run dev)"
  echo "  2. Test user exists (run: npm run create:test-data)"
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Step 2: Create task
echo "2. Creating task..."
CREATE_TASK_RESPONSE=$(curl -s -X POST "${API_URL}/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Task",
    "description": "Test description"
  }')

TASK_ID=$(echo $CREATE_TASK_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$TASK_ID" ]; then
  echo -e "${RED}❌ Failed to create task!${NC}"
  echo "Response: $CREATE_TASK_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Task created${NC}"
echo "Task ID: $TASK_ID"
echo ""

# Step 3: List tasks
echo "3. Listing tasks..."
LIST_RESPONSE=$(curl -s -X GET "${API_URL}/tasks" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Tasks listed${NC}"
echo "$LIST_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LIST_RESPONSE"
echo ""

# Step 4: Get task
echo "4. Getting task by ID..."
GET_TASK_RESPONSE=$(curl -s -X GET "${API_URL}/tasks/${TASK_ID}" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Task retrieved${NC}"
echo "$GET_TASK_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$GET_TASK_RESPONSE"
echo ""

# Step 5: Add field
echo "5. Adding field to task..."
ADD_FIELD_RESPONSE=$(curl -s -X POST "${API_URL}/tasks/${TASK_ID}/fields" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "label": "Full Name",
    "required": true
  }')

FIELD_ID=$(echo $ADD_FIELD_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

# Try to extract field ID from the fields array
if [ -z "$FIELD_ID" ]; then
  # Try a different approach - get the first field ID from the task
  FIELD_ID=$(echo $ADD_FIELD_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('fields', [{}])[0].get('id', ''))" 2>/dev/null)
fi

echo -e "${GREEN}✓ Field added${NC}"
echo "$ADD_FIELD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ADD_FIELD_RESPONSE"
echo ""

# Step 6: Update field (if we have a field ID)
if [ ! -z "$FIELD_ID" ]; then
  echo "6. Updating field..."
  UPDATE_FIELD_RESPONSE=$(curl -s -X PUT "${API_URL}/tasks/${TASK_ID}/fields/${FIELD_ID}" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"label": "Employee Full Name"}')
  
  echo -e "${GREEN}✓ Field updated${NC}"
  echo "$UPDATE_FIELD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UPDATE_FIELD_RESPONSE"
  echo ""
else
  echo -e "${YELLOW}⚠ Skipping field update (could not extract field ID)${NC}"
  echo ""
fi

# Step 7: Get task again to get all field IDs for reorder
echo "7. Getting task to extract field IDs for reorder..."
GET_TASK_AGAIN=$(curl -s -X GET "${API_URL}/tasks/${TASK_ID}" \
  -H "Authorization: Bearer $TOKEN")

# Extract field IDs
FIELD_IDS=$(echo $GET_TASK_AGAIN | python3 -c "import sys, json; data=json.load(sys.stdin); fields=data.get('data', {}).get('fields', []); ids=[f.get('id') for f in fields if f.get('id')]; print(','.join(ids))" 2>/dev/null)

if [ ! -z "$FIELD_IDS" ] && [ "$FIELD_IDS" != "None" ]; then
  # Convert comma-separated to JSON array
  FIELD_IDS_JSON=$(echo $FIELD_IDS | python3 -c "import sys, json; ids=sys.stdin.read().strip().split(','); print(json.dumps(ids))" 2>/dev/null)
  
  echo "8. Reordering fields..."
  REORDER_RESPONSE=$(curl -s -X PUT "${API_URL}/tasks/${TASK_ID}/fields/reorder" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"fieldIds\": $FIELD_IDS_JSON}")
  
  echo -e "${GREEN}✓ Fields reordered${NC}"
  echo "$REORDER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REORDER_RESPONSE"
  echo ""
else
  echo -e "${YELLOW}⚠ Skipping field reorder (no fields found)${NC}"
  echo ""
fi

# Step 9: Publish task
echo "9. Publishing task..."
PUBLISH_RESPONSE=$(curl -s -X POST "${API_URL}/tasks/${TASK_ID}/publish" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Task published${NC}"
echo "$PUBLISH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PUBLISH_RESPONSE"
echo ""

# Step 10: Duplicate task
echo "10. Duplicating task..."
DUPLICATE_RESPONSE=$(curl -s -X POST "${API_URL}/tasks/${TASK_ID}/duplicate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Copy of Test Task"}')

DUPLICATE_TASK_ID=$(echo $DUPLICATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

echo -e "${GREEN}✓ Task duplicated${NC}"
echo "$DUPLICATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DUPLICATE_RESPONSE"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ All API tests completed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Created Task ID: $TASK_ID"
if [ ! -z "$DUPLICATE_TASK_ID" ]; then
  echo "Duplicated Task ID: $DUPLICATE_TASK_ID"
fi

