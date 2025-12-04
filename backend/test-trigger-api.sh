#!/bin/bash

# Test Trigger API endpoints
# Usage: ./test-trigger-api.sh [TOKEN]
# If TOKEN is not provided, it will login automatically

BASE_URL="http://localhost:3000"
API_URL="${BASE_URL}/api/triggers"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Trigger API Test Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Get token (if not provided)
if [ -z "$1" ]; then
  echo "No token provided. Logging in to get token..."
  LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@test-company.local",
      "password": "password123"
    }')
  
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')
  
  if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo -e "${RED}❌ Failed to get token${NC}"
    echo ""
    echo "Please check:"
    echo "  1. Backend server is running (cd backend && npm run dev)"
    echo "  2. Test user exists (cd backend && npm run create:test-data)"
    echo "  3. Login credentials are correct"
    echo ""
    echo "Login response:"
    echo "$LOGIN_RESPONSE" | jq '.'
    exit 1
  fi
  
  echo -e "${GREEN}✅ Token obtained${NC}"
  echo ""
else
  TOKEN=$1
  echo "Using provided token"
  echo ""
fi

# 1. Create a trigger
echo "1. Creating trigger..."
TRIGGER_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Trigger",
    "description": "Test trigger for API testing",
    "eventType": "TASK_COMPLETED",
    "conditions": {
      "operator": "AND",
      "conditions": [
        {
          "field": "amount",
          "operator": ">",
          "value": 1000
        }
      ]
    },
    "actions": [
      {
        "type": "email",
        "to": "test@example.com",
        "subject": "High Amount Alert",
        "body": "Task completed with amount: {{amount}}"
      }
    ],
    "settings": {
      "stopOnError": false,
      "timeout": 30000
    }
  }')

echo "$TRIGGER_RESPONSE" | jq '.'
TRIGGER_ID=$(echo "$TRIGGER_RESPONSE" | jq -r '.data.id // empty')

if [ -z "$TRIGGER_ID" ] || [ "$TRIGGER_ID" == "null" ]; then
  echo "❌ Failed to create trigger"
  exit 1
fi

echo -e "${GREEN}✅ Trigger created with ID: $TRIGGER_ID${NC}"
echo ""

# 2. Get the trigger
echo "2. Getting trigger..."
curl -s -X GET "$API_URL/$TRIGGER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# 3. Test trigger evaluation
echo "3. Testing trigger evaluation..."
TEST_RESPONSE=$(curl -s -X POST "$API_URL/$TRIGGER_ID/test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sampleData": {
      "amount": 1500,
      "category": "Travel"
    }
  }')

echo "$TEST_RESPONSE" | jq '.'
CONDITIONS_MET=$(echo "$TEST_RESPONSE" | jq -r '.data.conditionsMet // false')

if [ "$CONDITIONS_MET" == "true" ]; then
  echo -e "${GREEN}✅ Conditions met - trigger would execute${NC}"
else
  echo -e "${YELLOW}ℹ️  Conditions not met - trigger would not execute${NC}"
fi
echo ""

# 4. Test with eventData (alternative format)
echo "4. Testing trigger with eventData format..."
curl -s -X POST "$API_URL/$TRIGGER_ID/test" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventData": {
      "amount": 500,
      "category": "Travel"
    }
  }' | jq '.'
echo ""

# 5. List triggers
echo "5. Listing triggers..."
TRIGGER_COUNT=$(curl -s -X GET "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq -r '.data.triggers | length')
echo "Found $TRIGGER_COUNT trigger(s)"
echo ""

# 6. Get trigger executions (should be empty initially)
echo "6. Getting trigger executions..."
curl -s -X GET "$API_URL/$TRIGGER_ID/executions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# 7. Update trigger
echo "7. Updating trigger..."
curl -s -X PUT "$API_URL/$TRIGGER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false,
    "description": "Updated test trigger"
  }' | jq '.'
echo ""

# 8. Delete trigger
echo "8. Deleting trigger..."
curl -s -X DELETE "$API_URL/$TRIGGER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ All tests completed${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

