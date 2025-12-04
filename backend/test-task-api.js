#!/usr/bin/env node

/**
 * Test script for Task Builder API endpoints
 * Tests all endpoints using Node.js (no bash dependencies)
 * 
 * Run: node test-task-api.js
 * Or: npm run test:api (if added to package.json)
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, url, headers = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  try {
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
    log('Task Builder API Test Script', 'green');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
    console.log('');

    // Step 1: Login
    log('1. Logging in to get authentication token...', 'yellow');
    const loginResponse = await makeRequest('POST', `${API_URL}/auth/login`, {}, {
      email: 'admin@test-company.local',
      password: 'password123',
    });

    if (loginResponse.status !== 200 || !loginResponse.data.success) {
      log('❌ Login failed!', 'red');
      console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
      console.log('');
      log('Please make sure:', 'yellow');
      log('  1. Backend server is running (npm run dev)', 'yellow');
      log('  2. Test user exists (run: npm run create:test-data)', 'yellow');
      process.exit(1);
    }

    const token = loginResponse.data.data.token;
    log('✓ Login successful', 'green');
    console.log(`Token: ${token.substring(0, 50)}...`);
    console.log('');

    // Step 2: Create task
    log('2. Creating task...', 'yellow');
    const createTaskResponse = await makeRequest(
      'POST',
      `${API_URL}/tasks`,
      { Authorization: `Bearer ${token}` },
      { name: 'Test Task', description: 'Test description' }
    );

    if (!createTaskResponse.data.success) {
      log('❌ Failed to create task!', 'red');
      console.log('Response:', JSON.stringify(createTaskResponse.data, null, 2));
      process.exit(1);
    }

    const taskId = createTaskResponse.data.data.id;
    log('✓ Task created', 'green');
    console.log(`Task ID: ${taskId}`);
    console.log('Response:', JSON.stringify(createTaskResponse.data, null, 2));
    console.log('');

    // Step 3: List tasks
    log('3. Listing tasks...', 'yellow');
    const listResponse = await makeRequest('GET', `${API_URL}/tasks`, {
      Authorization: `Bearer ${token}`,
    });
    log('✓ Tasks listed', 'green');
    console.log(JSON.stringify(listResponse.data, null, 2));
    console.log('');

    // Step 4: Get task
    log('4. Getting task by ID...', 'yellow');
    const getTaskResponse = await makeRequest('GET', `${API_URL}/tasks/${taskId}`, {
      Authorization: `Bearer ${token}`,
    });
    log('✓ Task retrieved', 'green');
    console.log(JSON.stringify(getTaskResponse.data, null, 2));
    console.log('');

    // Step 5: Add field
    log('5. Adding field to task...', 'yellow');
    const addFieldResponse = await makeRequest(
      'POST',
      `${API_URL}/tasks/${taskId}/fields`,
      { Authorization: `Bearer ${token}` },
      { type: 'text', label: 'Full Name', required: true }
    );
    log('✓ Field added', 'green');
    console.log(JSON.stringify(addFieldResponse.data, null, 2));
    
    const fieldId = addFieldResponse.data.data?.fields?.[addFieldResponse.data.data.fields.length - 1]?.id;
    console.log('');

    // Step 6: Update field
    if (fieldId) {
      log('6. Updating field...', 'yellow');
      const updateFieldResponse = await makeRequest(
        'PUT',
        `${API_URL}/tasks/${taskId}/fields/${fieldId}`,
        { Authorization: `Bearer ${token}` },
        { label: 'Employee Full Name' }
      );
      log('✓ Field updated', 'green');
      console.log(JSON.stringify(updateFieldResponse.data, null, 2));
      console.log('');
    } else {
      log('⚠ Skipping field update (could not extract field ID)', 'yellow');
      console.log('');
    }

    // Step 7: Get task again to get field IDs
    log('7. Getting task to extract field IDs for reorder...', 'yellow');
    const getTaskAgainResponse = await makeRequest('GET', `${API_URL}/tasks/${taskId}`, {
      Authorization: `Bearer ${token}`,
    });
    const fields = getTaskAgainResponse.data.data?.fields || [];
    const fieldIds = fields.map((f) => f.id).filter(Boolean);

    // Step 8: Reorder fields
    if (fieldIds.length > 0) {
      log('8. Reordering fields...', 'yellow');
      const reorderResponse = await makeRequest(
        'PUT',
        `${API_URL}/tasks/${taskId}/fields/reorder`,
        { Authorization: `Bearer ${token}` },
        { fieldIds: fieldIds.reverse() } // Reverse order for testing
      );
      log('✓ Fields reordered', 'green');
      console.log(JSON.stringify(reorderResponse.data, null, 2));
      console.log('');
    } else {
      log('⚠ Skipping field reorder (no fields found)', 'yellow');
      console.log('');
    }

    // Step 9: Publish task
    log('9. Publishing task...', 'yellow');
    const publishResponse = await makeRequest('POST', `${API_URL}/tasks/${taskId}/publish`, {
      Authorization: `Bearer ${token}`,
    });
    log('✓ Task published', 'green');
    console.log(JSON.stringify(publishResponse.data, null, 2));
    console.log('');

    // Step 10: Duplicate task
    log('10. Duplicating task...', 'yellow');
    const duplicateResponse = await makeRequest(
      'POST',
      `${API_URL}/tasks/${taskId}/duplicate`,
      { Authorization: `Bearer ${token}` },
      { name: 'Copy of Test Task' }
    );
    log('✓ Task duplicated', 'green');
    console.log(JSON.stringify(duplicateResponse.data, null, 2));
    
    const duplicateTaskId = duplicateResponse.data.data?.id;
    console.log('');

    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
    log('✅ All API tests completed!', 'green');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green');
    console.log('');
    console.log(`Created Task ID: ${taskId}`);
    if (duplicateTaskId) {
      console.log(`Duplicated Task ID: ${duplicateTaskId}`);
    }
  } catch (error) {
    log('❌ Test failed with error:', 'red');
    console.error(error);
    process.exit(1);
  }
}

testAPI();

