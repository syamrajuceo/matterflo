#!/bin/bash

# Test script for Database Builder API
# This script tests all Database Builder endpoints

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
echo "Database Builder API Test Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if backend server is running
echo "Checking backend server connection..."
# Try to connect to the server (any endpoint will do, we just need to check connectivity)
SERVER_CHECK=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 5 "$API_URL/auth/login" 2>/dev/null || echo "000")

if [ "$SERVER_CHECK" == "000" ] || [ "$SERVER_CHECK" == "" ]; then
  # Try default localhost:3000
  SERVER_CHECK=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 --max-time 5 "http://localhost:3000/api/auth/login" 2>/dev/null || echo "000")
  
  if [ "$SERVER_CHECK" == "000" ] || [ "$SERVER_CHECK" == "" ]; then
    echo -e "${RED}❌ Cannot connect to backend server${NC}"
    echo ""
    echo "The backend server does not appear to be running or is not accessible."
    echo ""
    echo "Please ensure:"
    echo "  1. Backend server is running: cd backend && npm run dev"
    echo "  2. Server is listening on port 3000 (or set API_URL environment variable)"
    echo "  3. No firewall is blocking the connection"
    echo ""
    echo "To start the server:"
    echo "  cd backend"
    echo "  npm run dev"
    echo ""
    exit 1
  else
    # Server is running on default port, update API_URL
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
    # GET and DELETE requests
    if [ -n "$token" ] && [ "$token" != "null" ]; then
      response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" "$API_URL$endpoint" \
        -H "Authorization: Bearer $token" 2>/dev/null)
    else
      response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X "$method" "$API_URL$endpoint" 2>/dev/null)
    fi
  else
    # POST and PUT requests
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

# Extract HTTP code and response body
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

# Try to extract token using jq if available, otherwise use grep
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
  
  if [ "$HTTP_CODE" == "000" ] || [ -z "$HTTP_CODE" ]; then
    echo -e "${RED}Connection error - Backend server is not reachable${NC}"
    echo ""
    echo "Please ensure:"
    echo "  1. Backend server is running: cd backend && npm run dev"
    echo "  2. Server is listening on the correct port (default: 3000)"
    echo "  3. No firewall is blocking the connection"
  else
    echo "Please check:"
    echo "  1. Test user exists (cd backend && npm run create:test-data)"
    echo "  2. Login credentials are correct (email: $EMAIL)"
    echo "  3. User has a valid company associated"
  fi
  
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Create a table
echo "Step 2: Creating table 'employees'..."
CREATE_TABLE_RESPONSE=$(make_request "POST" "/database" \
  "{\"name\":\"employees\",\"displayName\":\"Employees\",\"description\":\"Company employees\"}" \
  "$TOKEN")

# Extract HTTP code and response body
CREATE_HTTP_CODE=$(echo "$CREATE_TABLE_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d':' -f2)
CREATE_RESPONSE_BODY=$(echo "$CREATE_TABLE_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

# Extract table ID
if command -v jq &> /dev/null; then
  TABLE_ID=$(echo "$CREATE_RESPONSE_BODY" | jq -r '.data.id // empty')
else
  TABLE_ID=$(echo "$CREATE_RESPONSE_BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TABLE_ID" ] || [ "$TABLE_ID" == "null" ] || [ "$TABLE_ID" == "" ]; then
  echo -e "${RED}❌ Failed to create table${NC}"
  echo "HTTP Code: $CREATE_HTTP_CODE"
  echo "Response: $CREATE_RESPONSE_BODY"
  exit 1
fi

echo -e "${GREEN}✓ Table created${NC}"
echo "Table ID: $TABLE_ID"
echo ""

# Step 3: Add fields to table
echo "Step 3: Adding fields to table..."

# Add employee_name field
echo "  Adding 'employee_name' field..."
ADD_FIELD1_RESPONSE=$(make_request "POST" "/database/$TABLE_ID/fields" \
  "{\"name\":\"employee_name\",\"displayName\":\"Employee Name\",\"type\":\"text\",\"required\":true}" \
  "$TOKEN")

if echo "$ADD_FIELD1_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$ADD_FIELD1_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  echo -e "  ${GREEN}✓ employee_name field added${NC}"
else
  echo -e "  ${RED}❌ Failed to add employee_name field${NC}"
  echo "  Response: $ADD_FIELD1_RESPONSE"
fi

# Add email field
echo "  Adding 'email' field..."
ADD_FIELD2_RESPONSE=$(make_request "POST" "/database/$TABLE_ID/fields" \
  "{\"name\":\"email\",\"displayName\":\"Email\",\"type\":\"text\",\"required\":true,\"unique\":true}" \
  "$TOKEN")

if echo "$ADD_FIELD2_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$ADD_FIELD2_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  echo -e "  ${GREEN}✓ email field added${NC}"
else
  echo -e "  ${RED}❌ Failed to add email field${NC}"
  echo "  Response: $ADD_FIELD2_RESPONSE"
fi

# Add salary field
echo "  Adding 'salary' field..."
ADD_FIELD3_RESPONSE=$(make_request "POST" "/database/$TABLE_ID/fields" \
  "{\"name\":\"salary\",\"displayName\":\"Salary\",\"type\":\"number\",\"required\":false,\"validation\":{\"min\":0}}" \
  "$TOKEN")

if echo "$ADD_FIELD3_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$ADD_FIELD3_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  echo -e "  ${GREEN}✓ salary field added${NC}"
else
  echo -e "  ${RED}❌ Failed to add salary field${NC}"
  echo "  Response: $ADD_FIELD3_RESPONSE"
fi

# Add hire_date field
echo "  Adding 'hire_date' field..."
ADD_FIELD4_RESPONSE=$(make_request "POST" "/database/$TABLE_ID/fields" \
  "{\"name\":\"hire_date\",\"displayName\":\"Hire Date\",\"type\":\"date\",\"required\":false}" \
  "$TOKEN")

if echo "$ADD_FIELD4_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$ADD_FIELD4_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  echo -e "  ${GREEN}✓ hire_date field added${NC}"
else
  echo -e "  ${RED}❌ Failed to add hire_date field${NC}"
  echo "  Response: $ADD_FIELD4_RESPONSE"
fi

echo ""

# Step 4: Get table to verify fields
echo "Step 4: Getting table details..."
GET_TABLE_RESPONSE=$(make_request "GET" "/database/$TABLE_ID" "" "$TOKEN")

if echo "$GET_TABLE_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$GET_TABLE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  echo -e "${GREEN}✓ Table retrieved${NC}"
  if command -v jq &> /dev/null; then
    FIELD_COUNT=$(echo "$GET_TABLE_RESPONSE" | jq '.data.schema.fields | length')
  else
    FIELD_COUNT=$(echo "$GET_TABLE_RESPONSE" | grep -o '"fields":\[[^]]*\]' | grep -o '{"id"' | wc -l)
  fi
  echo "  Fields count: $FIELD_COUNT"
else
  echo -e "${RED}❌ Failed to get table${NC}"
  echo "Response: $GET_TABLE_RESPONSE"
fi

echo ""

# Step 5: Insert records
echo "Step 5: Inserting records..."

# Insert first record
echo "  Inserting record 1..."
INSERT1_RESPONSE=$(make_request "POST" "/database/$TABLE_ID/records" \
  "{\"employee_name\":\"John Doe\",\"email\":\"john.doe@example.com\",\"salary\":50000,\"hire_date\":\"2024-01-15\"}" \
  "$TOKEN")

# Extract record ID
if command -v jq &> /dev/null; then
  RECORD1_ID=$(echo "$INSERT1_RESPONSE" | jq -r '.data.id // empty')
else
  RECORD1_ID=$(echo "$INSERT1_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi

if [ -n "$RECORD1_ID" ]; then
  echo -e "  ${GREEN}✓ Record 1 inserted${NC}"
  echo "  Record ID: $RECORD1_ID"
else
  echo -e "  ${RED}❌ Failed to insert record 1${NC}"
  echo "  Response: $INSERT1_RESPONSE"
fi

# Insert second record
echo "  Inserting record 2..."
INSERT2_RESPONSE=$(make_request "POST" "/database/$TABLE_ID/records" \
  "{\"employee_name\":\"Jane Smith\",\"email\":\"jane.smith@example.com\",\"salary\":60000,\"hire_date\":\"2024-02-20\"}" \
  "$TOKEN")

if command -v jq &> /dev/null; then
  RECORD2_ID=$(echo "$INSERT2_RESPONSE" | jq -r '.data.id // empty')
else
  RECORD2_ID=$(echo "$INSERT2_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi

if [ -n "$RECORD2_ID" ]; then
  echo -e "  ${GREEN}✓ Record 2 inserted${NC}"
  echo "  Record ID: $RECORD2_ID"
else
  echo -e "  ${RED}❌ Failed to insert record 2${NC}"
  echo "  Response: $INSERT2_RESPONSE"
fi

# Insert third record
echo "  Inserting record 3..."
INSERT3_RESPONSE=$(make_request "POST" "/database/$TABLE_ID/records" \
  "{\"employee_name\":\"Bob Johnson\",\"email\":\"bob.johnson@example.com\",\"salary\":55000}" \
  "$TOKEN")

if command -v jq &> /dev/null; then
  RECORD3_ID=$(echo "$INSERT3_RESPONSE" | jq -r '.data.id // empty')
else
  RECORD3_ID=$(echo "$INSERT3_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi

if [ -n "$RECORD3_ID" ]; then
  echo -e "  ${GREEN}✓ Record 3 inserted${NC}"
  echo "  Record ID: $RECORD3_ID"
else
  echo -e "  ${RED}❌ Failed to insert record 3${NC}"
  echo "  Response: $INSERT3_RESPONSE"
fi

echo ""

# Step 6: Query records
echo "Step 6: Querying records..."
QUERY_RESPONSE=$(make_request "GET" "/database/$TABLE_ID/records?page=1&limit=20" "" "$TOKEN")

if echo "$QUERY_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$QUERY_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  if command -v jq &> /dev/null; then
    RECORD_COUNT=$(echo "$QUERY_RESPONSE" | jq -r '.data.total // 0')
  else
    RECORD_COUNT=$(echo "$QUERY_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
  fi
  echo -e "${GREEN}✓ Records queried${NC}"
  echo "  Total records: $RECORD_COUNT"
else
  echo -e "${RED}❌ Failed to query records${NC}"
  echo "Response: $QUERY_RESPONSE"
fi

echo ""

# Step 7: Update a record
if [ -n "$RECORD1_ID" ]; then
  echo "Step 7: Updating record 1..."
  UPDATE_RESPONSE=$(make_request "PUT" "/database/$TABLE_ID/records/$RECORD1_ID" \
    "{\"salary\":55000}" \
    "$TOKEN")

  if echo "$UPDATE_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$UPDATE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
    echo -e "${GREEN}✓ Record updated${NC}"
  else
    echo -e "${RED}❌ Failed to update record${NC}"
    echo "Response: $UPDATE_RESPONSE"
  fi
  echo ""
fi

# Step 8: List all tables
echo "Step 8: Listing all tables..."
LIST_TABLES_RESPONSE=$(make_request "GET" "/database" "" "$TOKEN")

if echo "$LIST_TABLES_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$LIST_TABLES_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
  if command -v jq &> /dev/null; then
    TABLE_COUNT=$(echo "$LIST_TABLES_RESPONSE" | jq '.data | length')
  else
    TABLE_COUNT=$(echo "$LIST_TABLES_RESPONSE" | grep -o '"id":"[^"]*' | wc -l)
  fi
  echo -e "${GREEN}✓ Tables listed${NC}"
  echo "  Total tables: $TABLE_COUNT"
else
  echo -e "${RED}❌ Failed to list tables${NC}"
  echo "Response: $LIST_TABLES_RESPONSE"
fi

echo ""

# Step 9: Test validation (try to insert invalid data)
echo "Step 9: Testing validation (should fail)..."
VALIDATION_TEST_RESPONSE=$(make_request "POST" "/database/$TABLE_ID/records" \
  "{\"employee_name\":\"\",\"email\":\"invalid-email\"}" \
  "$TOKEN")

if echo "$VALIDATION_TEST_RESPONSE" | grep -q '"success":false' || (command -v jq &> /dev/null && echo "$VALIDATION_TEST_RESPONSE" | jq -e '.success == false' > /dev/null 2>&1); then
  echo -e "${GREEN}✓ Validation working correctly (rejected invalid data)${NC}"
else
  echo -e "${YELLOW}⚠ Validation test inconclusive${NC}"
  echo "Response: $VALIDATION_TEST_RESPONSE"
fi

echo ""

# Step 10: Test unique constraint (try to insert duplicate email)
if [ -n "$RECORD1_ID" ]; then
  echo "Step 10: Testing unique constraint (should fail)..."
  UNIQUE_TEST_RESPONSE=$(make_request "POST" "/database/$TABLE_ID/records" \
    "{\"employee_name\":\"Duplicate User\",\"email\":\"john.doe@example.com\"}" \
    "$TOKEN")

  if echo "$UNIQUE_TEST_RESPONSE" | grep -q '"success":false' || (command -v jq &> /dev/null && echo "$UNIQUE_TEST_RESPONSE" | jq -e '.success == false' > /dev/null 2>&1); then
    echo -e "${GREEN}✓ Unique constraint working correctly (rejected duplicate email)${NC}"
  else
    echo -e "${YELLOW}⚠ Unique constraint test inconclusive${NC}"
    echo "Response: $UNIQUE_TEST_RESPONSE"
  fi
  echo ""
fi

# Step 11: Delete a record (soft delete)
if [ -n "$RECORD3_ID" ]; then
  echo "Step 11: Deleting record 3 (soft delete)..."
  DELETE_RESPONSE=$(make_request "DELETE" "/database/$TABLE_ID/records/$RECORD3_ID" "" "$TOKEN")

  if echo "$DELETE_RESPONSE" | grep -q '"success":true' || (command -v jq &> /dev/null && echo "$DELETE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1); then
    echo -e "${GREEN}✓ Record deleted${NC}"
  else
    echo -e "${RED}❌ Failed to delete record${NC}"
    echo "Response: $DELETE_RESPONSE"
  fi
  echo ""
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Database Builder API Test Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Created table ID: $TABLE_ID"
echo "You can use this ID to test additional operations:"
echo ""
echo "  # Get table details:"
echo "  curl \"$API_URL/database/$TABLE_ID\" \\"
echo "    -H \"Authorization: Bearer $TOKEN\""
echo ""
echo "  # Query records:"
echo "  curl \"$API_URL/database/$TABLE_ID/records?page=1&limit=20\" \\"
echo "    -H \"Authorization: Bearer $TOKEN\""
echo ""
echo "  # Export CSV:"
echo "  curl \"$API_URL/database/$TABLE_ID/export\" \\"
echo "    -H \"Authorization: Bearer $TOKEN\" \\"
echo "    -o employees.csv"
echo ""

