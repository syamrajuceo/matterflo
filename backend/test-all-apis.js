/**
 * Comprehensive API Testing Script
 * Tests all endpoints from Swagger documentation
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  skipped: [],
  total: 0,
};

let authToken = null;
let testUserId = null;
let testCompanyId = null;
let testTaskId = null;
let testFlowId = null;
let testTriggerId = null;
let testTableId = null;
let testDatasetId = null;
let testDepartmentId = null;
let testRoleId = null;
let testIntegrationId = null;
let testTaskExecutionId = null;
let testFlowInstanceId = null;

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, requireAuth = true) {
  // Add small delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (requireAuth && authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.response?.data || error.message,
    };
  }
}

// Test result logging
function logTest(name, result, details = '') {
  testResults.total++;
  if (result.success) {
    testResults.passed.push({ name, status: result.status, details });
    console.log(`✅ ${name} - Status: ${result.status}`);
  } else {
    const errorStr = result.error ? JSON.stringify(result.error) : String(result.error || 'Unknown error');
    testResults.failed.push({
      name,
      status: result.status,
      error: result.error,
      details,
    });
    console.log(`❌ ${name} - Status: ${result.status} - Error: ${errorStr.substring(0, 100)}`);
  }
}

// Authentication Tests
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication APIs...\n');

  // Test Register
  const registerResult = await apiCall('POST', '/auth/register', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    firstName: 'Test',
    lastName: 'User',
  }, false);
  logTest('POST /auth/register', registerResult);

  if (registerResult.success && registerResult.data?.data?.token) {
    authToken = registerResult.data.data.token;
    testUserId = registerResult.data.data.user?.id;
    testCompanyId = registerResult.data.data.user?.companyId;
  } else {
    // Try login if register fails (user might already exist)
    const loginResult = await apiCall('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }, false);
    logTest('POST /auth/login', loginResult);
    if (loginResult.success && loginResult.data?.data?.token) {
      authToken = loginResult.data.data.token;
      testUserId = loginResult.data.data.user?.id;
      testCompanyId = loginResult.data.data.user?.companyId;
    }
  }

  // Test Get Current User
  if (authToken) {
    const meResult = await apiCall('GET', '/auth/me');
    logTest('GET /auth/me', meResult);
    if (meResult.success && meResult.data?.data) {
      testUserId = meResult.data.data.id;
      testCompanyId = meResult.data.data.companyId;
    }
  }
}

// Task Tests
async function testTasks() {
  console.log('\n📋 Testing Task APIs...\n');

  if (!authToken) {
    console.log('⚠️  Skipping task tests - no auth token');
    return;
  }

  // Create Task
  const createTaskResult = await apiCall('POST', '/tasks', {
    name: 'Test Task ' + Date.now(),
    description: 'Test task description',
  });
  logTest('POST /tasks', createTaskResult);
  if (createTaskResult.success && createTaskResult.data?.data?.id) {
    testTaskId = createTaskResult.data.data.id;
  }

  // List Tasks
  const listTasksResult = await apiCall('GET', '/tasks?page=1&limit=10');
  logTest('GET /tasks (list)', listTasksResult);

  // Get Task by ID
  if (testTaskId) {
    const getTaskResult = await apiCall('GET', `/tasks/${testTaskId}`);
    logTest('GET /tasks/:id', getTaskResult);

    // Update Task
    const updateTaskResult = await apiCall('PUT', `/tasks/${testTaskId}`, {
      name: 'Updated Test Task',
      description: 'Updated description',
    });
    logTest('PUT /tasks/:id', updateTaskResult);

    // Add Field to Task
    const addFieldResult = await apiCall('POST', `/tasks/${testTaskId}/fields`, {
      type: 'text',
      label: 'Test Field',
      placeholder: 'Enter text',
      required: true,
    });
    logTest('POST /tasks/:id/fields', addFieldResult);

    // Publish Task
    const publishTaskResult = await apiCall('POST', `/tasks/${testTaskId}/publish`);
    logTest('POST /tasks/:id/publish', publishTaskResult);

    // Duplicate Task
    const duplicateTaskResult = await apiCall('POST', `/tasks/${testTaskId}/duplicate`, {
      name: 'Duplicated Task ' + Date.now(),
    });
    logTest('POST /tasks/:id/duplicate', duplicateTaskResult);
  }
}

// Flow Tests
async function testFlows() {
  console.log('\n🔄 Testing Flow APIs...\n');

  if (!authToken) {
    console.log('⚠️  Skipping flow tests - no auth token');
    return;
  }

  // Create Flow
  const createFlowResult = await apiCall('POST', '/flows', {
    name: 'Test Flow ' + Date.now(),
    description: 'Test flow description',
  });
  logTest('POST /flows', createFlowResult);
  if (createFlowResult.success && createFlowResult.data?.data?.id) {
    testFlowId = createFlowResult.data.data.id;
  }

  // List Flows
  const listFlowsResult = await apiCall('GET', '/flows?page=1&limit=10');
  logTest('GET /flows (list)', listFlowsResult);

  // Get Flow by ID
  if (testFlowId) {
    const getFlowResult = await apiCall('GET', `/flows/${testFlowId}`);
    logTest('GET /flows/:id', getFlowResult);

    // Update Flow
    const updateFlowResult = await apiCall('PUT', `/flows/${testFlowId}`, {
      name: 'Updated Test Flow',
      description: 'Updated description',
    });
    logTest('PUT /flows/:id', updateFlowResult);

    // Add Level to Flow
    const addLevelResult = await apiCall('POST', `/flows/${testFlowId}/levels`, {
      name: 'Level 1',
      description: 'First level',
    });
    logTest('POST /flows/:id/levels', addLevelResult);

    // Publish Flow
    const publishFlowResult = await apiCall('POST', `/flows/${testFlowId}/publish`);
    logTest('POST /flows/:id/publish', publishFlowResult);
  }
}

// Trigger Tests
async function testTriggers() {
  console.log('\n⚡ Testing Trigger APIs...\n');

  if (!authToken) {
    console.log('⚠️  Skipping trigger tests - no auth token');
    return;
  }

  // Create Trigger
  const createTriggerResult = await apiCall('POST', '/triggers', {
    name: 'Test Trigger ' + Date.now(),
    description: 'Test trigger',
    eventType: 'TASK_COMPLETED',
    eventConfig: {},
    actions: [
      {
        type: 'email',
        to: 'test@example.com',
        subject: 'Task Completed',
        body: 'A task has been completed',
      },
    ],
    isActive: true,
  });
  logTest('POST /triggers', createTriggerResult);
  if (createTriggerResult.success && createTriggerResult.data?.data?.id) {
    testTriggerId = createTriggerResult.data.data.id;
  }

  // List Triggers
  const listTriggersResult = await apiCall('GET', '/triggers');
  logTest('GET /triggers (list)', listTriggersResult);

  // Get Trigger by ID
  if (testTriggerId) {
    const getTriggerResult = await apiCall('GET', `/triggers/${testTriggerId}`);
    logTest('GET /triggers/:id', getTriggerResult);

    // Update Trigger
    const updateTriggerResult = await apiCall('PUT', `/triggers/${testTriggerId}`, {
      name: 'Updated Trigger',
      isActive: false,
    });
    logTest('PUT /triggers/:id', updateTriggerResult);

    // Test Trigger
    const testTriggerResult = await apiCall('POST', `/triggers/${testTriggerId}/test`, {
      testData: { taskId: testTaskId },
    });
    logTest('POST /triggers/:id/test', testTriggerResult);

    // Get Trigger Executions
    const getExecutionsResult = await apiCall('GET', `/triggers/${testTriggerId}/executions`);
    logTest('GET /triggers/:id/executions', getExecutionsResult);
  }
}

// Execution Tests
async function testExecution() {
  console.log('\n▶️  Testing Execution APIs...\n');

  if (!authToken || !testTaskId || !testUserId) {
    console.log('⚠️  Skipping execution tests - missing prerequisites');
    return;
  }

  // Create Task Execution
  const createTaskExecResult = await apiCall('POST', '/executions/tasks', {
    taskId: testTaskId,
    executorId: testUserId,
  });
  logTest('POST /executions/tasks', createTaskExecResult);
  if (createTaskExecResult.success && createTaskExecResult.data?.data?.id) {
    testTaskExecutionId = createTaskExecResult.data.data.id;
  }

  // Get My Tasks
  const getMyTasksResult = await apiCall('GET', '/executions/tasks/my-tasks');
  logTest('GET /executions/tasks/my-tasks', getMyTasksResult);

  // Get Task Execution by ID
  if (testTaskExecutionId) {
    const getTaskExecResult = await apiCall('GET', `/executions/tasks/${testTaskExecutionId}`);
    logTest('GET /executions/tasks/:id', getTaskExecResult);

    // Update Task Execution
    const updateTaskExecResult = await apiCall('PUT', `/executions/tasks/${testTaskExecutionId}`, {
      data: { field1: 'value1' },
      status: 'COMPLETED',
    });
    logTest('PUT /executions/tasks/:id', updateTaskExecResult);
  }

  // Create Flow Instance
  if (testFlowId) {
    const createFlowInstanceResult = await apiCall('POST', '/executions/flows', {
      flowId: testFlowId,
      contextData: { key: 'value' },
    });
    logTest('POST /executions/flows', createFlowInstanceResult);
    if (createFlowInstanceResult.success && createFlowInstanceResult.data?.data?.id) {
      testFlowInstanceId = createFlowInstanceResult.data.data.id;
    }

    // Get My Flows
    const getMyFlowsResult = await apiCall('GET', '/executions/flows/my-flows');
    logTest('GET /executions/flows/my-flows', getMyFlowsResult);

    // Get Flow Instance by ID
    if (testFlowInstanceId) {
      const getFlowInstanceResult = await apiCall('GET', `/executions/flows/${testFlowInstanceId}`);
      logTest('GET /executions/flows/:id', getFlowInstanceResult);
    }
  }
}

// Database Tests
async function testDatabase() {
  console.log('\n💾 Testing Database APIs...\n');

  if (!authToken) {
    console.log('⚠️  Skipping database tests - no auth token');
    return;
  }

  // Create Table
  const createTableResult = await apiCall('POST', '/database', {
    name: 'test_table_' + Date.now(),
    displayName: 'Test Table',
    description: 'Test table description',
  });
  logTest('POST /database', createTableResult);
  if (createTableResult.success && createTableResult.data?.data?.id) {
    testTableId = createTableResult.data.data.id;
  }

  // List Tables
  const listTablesResult = await apiCall('GET', '/database');
  logTest('GET /database (list)', listTablesResult);

  // Get Table by ID
  if (testTableId) {
    const getTableResult = await apiCall('GET', `/database/${testTableId}`);
    logTest('GET /database/:id', getTableResult);

    // Update Table
    const updateTableResult = await apiCall('PUT', `/database/${testTableId}`, {
      displayName: 'Updated Test Table',
    });
    logTest('PUT /database/:id', updateTableResult);

    // Add Field to Table
    const addFieldResult = await apiCall('POST', `/database/${testTableId}/fields`, {
      name: 'test_field',
      displayName: 'Test Field',
      type: 'TEXT',
      required: true,
    });
    logTest('POST /database/:id/fields', addFieldResult);

    // Query Records
    const queryRecordsResult = await apiCall('GET', `/database/${testTableId}/records?page=1&limit=10`);
    logTest('GET /database/:id/records', queryRecordsResult);

    // Insert Record
    const insertRecordResult = await apiCall('POST', `/database/${testTableId}/records`, {
      test_field: 'test value',
    });
    logTest('POST /database/:id/records', insertRecordResult);
  }
}

// Dataset Tests
async function testDatasets() {
  console.log('\n📊 Testing Dataset APIs...\n');

  if (!authToken) {
    console.log('⚠️  Skipping dataset tests - no auth token');
    return;
  }

  // Create Dataset
  const createDatasetResult = await apiCall('POST', '/datasets', {
    name: 'Test Dataset ' + Date.now(),
    description: 'Test dataset',
  });
  logTest('POST /datasets', createDatasetResult);
  if (createDatasetResult.success && createDatasetResult.data?.data?.id) {
    testDatasetId = createDatasetResult.data.data.id;
  }

  // List Datasets
  const listDatasetsResult = await apiCall('GET', '/datasets');
  logTest('GET /datasets (list)', listDatasetsResult);

  // Get Dataset by ID
  if (testDatasetId) {
    const getDatasetResult = await apiCall('GET', `/datasets/${testDatasetId}`);
    logTest('GET /datasets/:id', getDatasetResult);

    // Update Dataset
    const updateDatasetResult = await apiCall('PUT', `/datasets/${testDatasetId}`, {
      name: 'Updated Dataset',
    });
    logTest('PUT /datasets/:id', updateDatasetResult);

    // Add Section
    const addSectionResult = await apiCall('POST', `/datasets/${testDatasetId}/sections`, {
      type: 'data-cards',
      title: 'Test Section',
      config: {},
    });
    logTest('POST /datasets/:id/sections', addSectionResult);

    // Get Dataset with Data
    const getDataResult = await apiCall('GET', `/datasets/${testDatasetId}/data`);
    logTest('GET /datasets/:id/data', getDataResult);

    // Publish Dataset
    const publishResult = await apiCall('POST', `/datasets/${testDatasetId}/publish`);
    logTest('POST /datasets/:id/publish', publishResult);
  }
}

// Company Tests
async function testCompany() {
  console.log('\n🏢 Testing Company APIs...\n');

  if (!authToken) {
    console.log('⚠️  Skipping company tests - no auth token');
    return;
  }

  // Get Hierarchy
  const getHierarchyResult = await apiCall('GET', '/company/hierarchy');
  logTest('GET /company/hierarchy', getHierarchyResult);

  // Create Department
  const createDeptResult = await apiCall('POST', '/company/departments', {
    name: 'Test Department ' + Date.now(),
    description: 'Test department',
  });
  logTest('POST /company/departments', createDeptResult);
  if (createDeptResult.success && createDeptResult.data?.data?.id) {
    testDepartmentId = createDeptResult.data.data.id;
  }

  // Create Role
  const createRoleResult = await apiCall('POST', '/company/roles', {
    name: 'Test Role ' + Date.now(),
    description: 'Test role',
    permissions: {},
  });
  logTest('POST /company/roles', createRoleResult);
  if (createRoleResult.success && createRoleResult.data?.data?.id) {
    testRoleId = createRoleResult.data.data.id;
  }

  // List Roles
  const listRolesResult = await apiCall('GET', '/company/roles');
  logTest('GET /company/roles', listRolesResult);

  // Get Roles by Department
  if (testDepartmentId) {
    const getRolesByDeptResult = await apiCall('GET', `/company/departments/${testDepartmentId}/roles`);
    logTest('GET /company/departments/:id/roles', getRolesByDeptResult);
  }

  // Get Users
  const getUsersResult = await apiCall('GET', '/company/users');
  logTest('GET /company/users', getUsersResult);

  // Assign User to Role
  if (testRoleId && testUserId) {
    const assignRoleResult = await apiCall('POST', `/company/roles/${testRoleId}/assign/${testUserId}`);
    logTest('POST /company/roles/:roleId/assign/:userId', assignRoleResult);
  }
}

// Integration Tests
async function testIntegrations() {
  console.log('\n🔌 Testing Integration APIs...\n');

  if (!authToken) {
    console.log('⚠️  Skipping integration tests - no auth token');
    return;
  }

  // Create Integration
  const createIntegrationResult = await apiCall('POST', '/integrations', {
    name: 'Test Integration ' + Date.now(),
    type: 'WEBHOOK',
    config: {
      url: 'https://example.com/webhook',
    },
    isActive: true,
  });
  logTest('POST /integrations', createIntegrationResult);
  if (createIntegrationResult.success && createIntegrationResult.data?.data?.id) {
    testIntegrationId = createIntegrationResult.data.data.id;
  }

  // List Integrations
  const listIntegrationsResult = await apiCall('GET', '/integrations');
  logTest('GET /integrations (list)', listIntegrationsResult);

  // Get Integration by ID
  if (testIntegrationId) {
    const getIntegrationResult = await apiCall('GET', `/integrations/${testIntegrationId}`);
    logTest('GET /integrations/:id', getIntegrationResult);

    // Create Workflow
    const createWorkflowResult = await apiCall('POST', `/integrations/${testIntegrationId}/workflows`, {
      name: 'Test Workflow',
      triggerConfig: { event: 'WEBHOOK_RECEIVED' },
      actionConfig: { action: 'send_email', params: {} },
      isActive: true,
    });
    logTest('POST /integrations/:id/workflows', createWorkflowResult);
  }
}

// Audit Tests
async function testAudit() {
  console.log('\n📝 Testing Audit APIs...\n');

  if (!authToken) {
    console.log('⚠️  Skipping audit tests - no auth token');
    return;
  }

  // Get Audit Logs
  const getLogsResult = await apiCall('GET', '/audit/logs?page=1&limit=10');
  logTest('GET /audit/logs', getLogsResult);

  // Export Audit Logs
  const exportLogsResult = await apiCall('GET', '/audit/logs/export', null, true);
  logTest('GET /audit/logs/export', exportLogsResult);
}

// Client Portal Tests
async function testClientPortal() {
  console.log('\n👤 Testing Client Portal APIs...\n');

  if (!authToken) {
    console.log('⚠️  Skipping client portal tests - no auth token');
    return;
  }

  // Get Client Dashboard
  const getDashboardResult = await apiCall('GET', '/client/dashboard');
  logTest('GET /client/dashboard', getDashboardResult);

  // Get Pending Tasks
  const getPendingTasksResult = await apiCall('GET', '/client/tasks/pending');
  logTest('GET /client/tasks/pending', getPendingTasksResult);

  // Get All Tasks
  const getTasksResult = await apiCall('GET', '/client/tasks');
  logTest('GET /client/tasks', getTasksResult);

  // Get Flows
  const getFlowsResult = await apiCall('GET', '/client/flows');
  logTest('GET /client/flows', getFlowsResult);
}

// Analytics Tests
async function testAnalytics() {
  console.log('\n📈 Testing Analytics APIs...\n');

  if (!authToken) {
    console.log('⚠️  Skipping analytics tests - no auth token');
    return;
  }

  // Get Dashboard Stats
  const getDashboardStatsResult = await apiCall('GET', '/analytics/dashboard');
  logTest('GET /analytics/dashboard', getDashboardStatsResult);

  // Get Dashboard Stats with filters
  const getDashboardStatsFilteredResult = await apiCall('GET', '/analytics/dashboard?startDate=2024-01-01&endDate=2024-12-31');
  logTest('GET /analytics/dashboard (with filters)', getDashboardStatsFilteredResult);

  // Get Task Analytics
  const getTaskAnalyticsResult = await apiCall('GET', '/analytics/tasks');
  logTest('GET /analytics/tasks', getTaskAnalyticsResult);

  // Get Flow Analytics
  const getFlowAnalyticsResult = await apiCall('GET', '/analytics/flows');
  logTest('GET /analytics/flows', getFlowAnalyticsResult);

  // Get User Activity Analytics
  const getUserActivityResult = await apiCall('GET', '/analytics/users');
  logTest('GET /analytics/users', getUserActivityResult);

  // Get Company Analytics
  const getCompanyAnalyticsResult = await apiCall('GET', '/analytics/company');
  logTest('GET /analytics/company', getCompanyAnalyticsResult);

  // Get Performance Metrics
  const getPerformanceResult = await apiCall('GET', '/analytics/performance');
  logTest('GET /analytics/performance', getPerformanceResult);
}

// Error Case Tests
async function testErrorCases() {
  console.log('\n❌ Testing Error Cases...\n');

  if (!authToken) {
    console.log('⚠️  Skipping error case tests - no auth token');
    return;
  }

  // Test 404 - Non-existent resource
  const notFoundResult = await apiCall('GET', '/tasks/00000000-0000-0000-0000-000000000000');
  if (!notFoundResult.success && notFoundResult.status === 404) {
    logTest('GET /tasks/:id (404 error)', { success: true, status: 404 }, 'Correctly returns 404');
  } else {
    logTest('GET /tasks/:id (404 error)', { success: false, status: notFoundResult.status }, 'Expected 404');
  }

  // Test 400 - Invalid data
  const invalidDataResult = await apiCall('POST', '/tasks', {
    // Missing required 'name' field
    description: 'Invalid task',
  });
  if (!invalidDataResult.success && (invalidDataResult.status === 400 || invalidDataResult.status === 422)) {
    logTest('POST /tasks (400 error)', { success: true, status: invalidDataResult.status }, 'Correctly validates input');
  } else {
    logTest('POST /tasks (400 error)', { success: false, status: invalidDataResult.status }, 'Expected validation error');
  }

  // Test Unauthorized - Request without token
  const unauthorizedResult = await apiCall('GET', '/tasks', null, false);
  if (!unauthorizedResult.success && unauthorizedResult.status === 401) {
    logTest('GET /tasks (401 error)', { success: true, status: 401 }, 'Correctly requires authentication');
  } else {
    logTest('GET /tasks (401 error)', { success: false, status: unauthorizedResult.status }, 'Expected 401');
  }
}

// Main test runner
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('           🧪 COMPREHENSIVE API TESTING');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`\nAPI Base URL: ${API_BASE_URL}\n`);

  try {
    // Run all test suites
    await testAuthentication();
    await testTasks();
    await testFlows();
    await testTriggers();
    await testExecution();
    await testDatabase();
    await testDatasets();
    await testCompany();
    await testIntegrations();
    await testAudit();
    await testClientPortal();
    await testAnalytics();
    await testErrorCases();

    // Print summary
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('                      📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⏭️  Skipped: ${testResults.skipped.length}\n`);

    if (testResults.failed.length > 0) {
      console.log('Failed Tests:');
      testResults.failed.forEach((test) => {
        console.log(`  ❌ ${test.name} - Status: ${test.status}`);
        if (test.error) {
          console.log(`     Error: ${JSON.stringify(test.error).substring(0, 150)}`);
        }
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════════════\n');

    // Exit with appropriate code
    process.exit(testResults.failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error during testing:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();

