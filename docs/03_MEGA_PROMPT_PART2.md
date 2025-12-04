# MEGA PROMPT DOCUMENT - PART 2
# Flow Builder Frontend, Triggers, & Testing

**Continuation from Part 1**

---

## 🔄 PHASE 3 CONTINUED: FLOW BUILDER FRONTEND (Days 42-56)

### PROMPT 3.3: Flow Builder - Main Component

```
Create Flow Builder in frontend/src/features/flow-builder/:

Files structure:
1. components/FlowBuilder.tsx - Main component
2. components/FlowCanvas.tsx - Visual flow display
3. components/FlowLevel.tsx - Single level card
4. components/FlowList.tsx - List of flows
5. components/BranchingRules.tsx - Branch configuration
6. store/flowBuilderStore.ts - State management
7. services/flow.service.ts - API calls

FlowBuilder.tsx layout:
- Left sidebar: Flow list (20%)
- Center: Flow canvas (60%)
- Right sidebar: Level properties (20% - collapsible)
- Top bar: Save, Test, Triggers, Publish buttons

FlowCanvas.tsx:
- Vertical stack of level cards
- [+ Insert Level] button between levels
- Drag to reorder levels
- Connect lines between levels
- Show branch paths visually

FlowLevel.tsx card:
- Level number + name
- Assigned roles pills
- Tasks list (click to configure)
- [+ Add Task] button
- [+ Add Role] button
- Auto Actions / Triggers section (collapsed)
- Delete level button
- Settings button

State management:
- currentFlow: IFlow
- levels: IFlowLevel[]
- selectedLevel: IFlowLevel | null
- branches: IFlowBranch[]

Use React Flow for visual layout
Style with dark theme
Add animations for level changes
```

**TESTING PROMPT 3.3:**
```bash
# 1. Navigate to /flows/new

# 2. Should see 3-panel layout

# 3. Create flow:
# - Click "New Flow"
# - Enter name
# - Should create empty flow

# 4. Add levels:
# - Click [+ Insert Level]
# - Should add level card
# - Add 3 levels

# 5. Configure level:
# - Click on level card
# - Should highlight
# - Right panel should show properties

# 6. Add task to level:
# - Click [+ Add Task]
# - Select from task list
# - Task should appear in level

# 7. Reorder levels:
# - Drag level card
# - Should reorder smoothly

# 8. Save flow:
# - Click [Save]
# - Should save to backend
# - Refresh - should persist
```

---

### PROMPT 3.4: Trigger Section in Flow Builder

```
Add Trigger Section to FlowLevel.tsx:

Create: components/TriggerSection.tsx

Component structure:
- Collapsible section: "Auto Actions / Triggers"
- Shows trigger count: "(2 triggers)"
- List of trigger cards (collapsed by default)
- [+ Add Trigger] button

TriggerCard.tsx (collapsed):
```
┌────────────────────────────────────────┐
│ ⚡ High-Value Alert         [⚙️] [🗑️] │
│ IF: Amount > 10000 → Email CFO         │
│ Status: ✅ Active                      │
└────────────────────────────────────────┘
```

TriggerCard.tsx (expanded):
```
┌────────────────────────────────────────┐
│ ⚡ High-Value Alert         [⚙️] [🗑️] │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ WHEN: Task completed                   │
│ IF:   Amount > 10000 AND               │
│       Decision = Approved              │
│ THEN: • Send email to CFO              │
│       • Start Executive Approval flow  │
│ Status: ✅ Active                      │
│                                        │
│ Last triggered: 2 hours ago            │
│ Success rate: 98% (47/48)              │
│                                        │
│ [View Execution Logs]                  │
└────────────────────────────────────────┘
```

Click [⚙️] opens TriggerModal (full configuration)
Click [🗑️] deletes trigger (with confirmation)

Connect to triggers API:
- GET /api/triggers?flowId=xxx&levelId=xxx
- POST /api/triggers
- PUT /api/triggers/:id
- DELETE /api/triggers/:id

State in flowBuilderStore:
- triggers per level
- selectedTrigger
```

**TESTING PROMPT 3.4:**
```bash
# 1. In Flow Builder, expand a level

# 2. See "Auto Actions / Triggers" section

# 3. Click [+ Add Trigger]

# 4. Should open Trigger Modal (next prompt)

# 5. After creating trigger:
# - Should appear in list
# - Should show collapsed card

# 6. Click trigger card:
# - Should expand
# - Show WHEN/IF/THEN summary

# 7. Click [⚙️] icon:
# - Should open Trigger Modal for editing

# 8. Click [🗑️] icon:
# - Should show confirmation
# - Delete trigger

# 9. Verify multiple triggers per level
```

---

## ⚡ PHASE 4: TRIGGER BUILDER (Days 57-77)

### PROMPT 4.1: Trigger Module - Backend

```
Create Trigger module in backend/src/modules/triggers/:

Files:
1. trigger.types.ts - All interfaces
2. trigger.validation.ts - Zod schemas
3. trigger.service.ts - CRUD operations
4. trigger.evaluator.ts - Condition evaluation logic
5. trigger.executor.ts - Action execution logic
6. trigger.controller.ts - Route handlers
7. trigger.routes.ts - Express router

trigger.service.ts:
- createTrigger(data)
- updateTrigger(id, data)
- getTrigger(id)
- listTriggers(filters)
- deleteTrigger(id)
- testTrigger(id, sampleData) - Test mode

trigger.evaluator.ts:
Class: TriggerEvaluator

Methods:
1. evaluate(trigger, eventData):
   - Parse conditions JSON
   - Evaluate each condition
   - Handle AND/OR logic
   - Return boolean + evaluation details

2. evaluateCondition(condition, data):
   - Get field value from data
   - Compare with condition value
   - Handle operators: =, !=, >, <, contains, in
   - Return boolean

3. evaluateGroup(group, data):
   - Evaluate all conditions in group
   - Apply AND or OR operator
   - Return boolean

Logic:
- Support nested conditions (groups)
- Handle missing fields gracefully
- Type coercion (string to number, etc.)
- Null/undefined handling
- Circular reference detection

trigger.executor.ts:
Class: TriggerExecutor

Methods:
1. execute(trigger, eventData):
   - Get actions array
   - Execute each action
   - Handle failures (continue or stop)
   - Log execution
   - Return results

2. executeAction(action, context):
   - Switch on action type
   - Call appropriate handler
   - Return result

Action handlers (in actions/ folder):
- email.action.ts: sendEmail()
- flow.action.ts: startFlow()
- database.action.ts: updateDatabase()
- webhook.action.ts: callWebhook()
- task.action.ts: assignTask()

Requirements:
- Async action execution
- Error handling per action
- Rollback on critical failures
- Action timeout (30 seconds)
- Execution logging to database
```

**TESTING PROMPT 4.1:**
```bash
# 1. Create trigger via API
curl -X POST http://localhost:3000/api/triggers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Trigger",
    "eventType": "TASK_COMPLETED",
    "taskId": "task_id",
    "conditions": {
      "operator": "AND",
      "rules": [
        {
          "field": "amount",
          "operator": "greater_than",
          "value": 1000
        }
      ]
    },
    "actions": [
      {
        "type": "send_email",
        "config": {
          "to": "test@example.com",
          "subject": "Test",
          "body": "Test email"
        }
      }
    ]
  }'

# 2. Test trigger evaluation
curl -X POST http://localhost:3000/api/triggers/<id>/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventData": {
      "amount": 1500,
      "category": "Travel"
    }
  }'

# Expected: Evaluation results showing conditions met

# 3. Check trigger execution logs
curl http://localhost:3000/api/triggers/<id>/executions \
  -H "Authorization: Bearer $TOKEN"

# Expected: List of executions with status
```

---

### PROMPT 4.2: Event Bus & Consumer

```
Create Event Bus system in backend/src/modules/triggers/events/:

Files:
1. event.bus.ts - Redis Streams wrapper
2. event.publisher.ts - Publish events
3. event.consumer.ts - Consume events
4. event.types.ts - Event type definitions

event.bus.ts:
Class: EventBus (Singleton)

Methods:
- publish(channel, eventType, data):
  - Use Redis XADD
  - Add to stream
  - Return message ID

- subscribe(channel, handler):
  - Use Redis XREAD
  - Process messages
  - Call handler for each event
  - ACK processed messages

- createConsumerGroup(channel, group):
  - Use Redis XGROUP CREATE
  - Handle already exists error

event.publisher.ts:
Functions for each event type:
- publishTaskCompleted(taskId, data)
- publishTaskUpdated(taskId, data)
- publishFieldChanged(taskId, fieldId, oldValue, newValue)
- publishFlowStarted(flowId, instanceId)
- publishDatabaseRowCreated(tableId, rowId, data)

event.consumer.ts:
Class: TriggerEventConsumer

Methods:
- start():
  - Subscribe to events channel
  - Process events in loop
  - Never stop (long-running process)

- handleEvent(event):
  - Find relevant triggers
  - For each trigger:
    - Evaluate conditions
    - If met: execute actions
    - Log execution

- findTriggersForEvent(eventType, sourceId):
  - Query database
  - Return matching triggers

Integration:
- Start consumer on server start
- Publish events after task/flow operations
- Graceful shutdown on process exit

Error handling:
- Consumer crash recovery
- Failed event retry (3 times)
- Dead letter queue for failed events
```

**TESTING PROMPT 4.2:**
```bash
# Create test script: backend/test-event-bus.ts

import { EventBus } from './events/event.bus';
import { publishTaskCompleted } from './events/event.publisher';
import { TriggerEventConsumer } from './events/event.consumer';

async function test() {
  // Start consumer
  const consumer = new TriggerEventConsumer();
  await consumer.start();
  
  // Publish event
  await publishTaskCompleted('task_123', {
    amount: 15000,
    category: 'Travel'
  });
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check trigger execution logs
  // Should see execution in database
}

test();

# Run: ts-node backend/test-event-bus.ts
# Check database: should see trigger execution logged
```

---

### PROMPT 4.3: Trigger Modal - Frontend

```
Create Trigger Modal in frontend/src/features/trigger-builder/:

Main file: components/TriggerModal.tsx

Props:
- isOpen: boolean
- onClose: () => void
- trigger?: ITrigger (for editing)
- flowId?: string
- levelId?: string
- taskId?: string

Modal sections (use tabs or accordion):
1. Trigger Name & Description
2. WHEN (Event Selection)
3. IF (Conditions Builder)
4. THEN (Actions Builder)
5. Advanced Settings

Use react-hook-form for state management
Use zod for validation

Section 1: Basic Info
- Trigger Name (required)
- Description (optional)

Section 2: WHEN
- Event Type dropdown:
  - Task Completed
  - Task Started
  - Field Changed
  - Database Row Created
  - Scheduled
  - Webhook Received
- Additional config based on event type

Section 3: IF (Conditions)
- Import ConditionBuilder component (next prompt)
- Toggle: "Add conditions" or "Always trigger"

Section 4: THEN (Actions)
- Import ActionBuilder component (prompt 4.5)
- List of actions
- [+ Add Action] button

Section 5: Advanced
- Delay execution
- Prevent duplicates
- Business hours only
- Logging

Footer:
- [Test Trigger] button
- [Cancel] button
- [Save Trigger] button

Styling:
- Right-side drawer (600px width)
- Full height
- Dark theme
- Smooth slide-in animation
- Scrollable content
```

**TESTING PROMPT 4.3:**
```bash
# 1. In Flow Builder, click [+ Add Trigger]

# 2. Modal should slide in from right

# 3. See all sections

# 4. Fill trigger name

# 5. Select event type

# 6. Toggle "Add conditions"

# 7. See conditions builder (empty initially)

# 8. Click [+ Add Action]

# 9. See action configuration

# 10. Fill all required fields

# 11. Click [Save Trigger]

# 12. Modal should close

# 13. Trigger should appear in list
```

---

### PROMPT 4.4: Condition Builder Component

```
Create Condition Builder in frontend/src/features/trigger-builder/components/:

Main component: ConditionBuilder.tsx

Props:
- value: ICondition (current conditions)
- onChange: (conditions: ICondition) => void
- availableFields: IField[] (from task/flow context)

Structure:
- Condition groups (AND/OR)
- Each group contains conditions
- [+ Add Condition] button
- [+ Add OR Group] button

Condition row:
[⋮ Drag] [Field ▼] [Operator ▼] [Value Input] [🗑️ Delete]

Example:
```
┌────────────────────────────────────────┐
│ AND Group 1                            │
│ ┌──────────────────────────────────┐  │
│ │ [Amount ▼] [>] [10000_______]    │  │
│ └──────────────────────────────────┘  │
│ ┌──────────────────────────────────┐  │
│ │ [Status ▼] [=] [Approved ▼]      │  │
│ └──────────────────────────────────┘  │
│ [+ Add AND Condition]                  │
└────────────────────────────────────────┘

[+ Add OR Group]

Preview: (Amount > 10000 AND Status = Approved)
```

Components to create:
1. ConditionGroup.tsx - Group wrapper
2. Condition.tsx - Single condition row
3. FieldSelector.tsx - Field dropdown with types
4. OperatorSelector.tsx - Operator based on field type
5. ValueInput.tsx - Input based on field type

Field types and operators:
- Text: equals, not_equals, contains, starts_with, ends_with
- Number: equals, not_equals, greater_than, less_than, between
- Date: equals, before, after, between
- Boolean: is_true, is_false
- Dropdown: equals, not_equals, in_list

Value input types:
- Text: <Input />
- Number: <Input type="number" />
- Date: <DatePicker />
- Boolean: <Checkbox />
- Dropdown: <Select /> (show options)

Drag & Drop:
- Use @dnd-kit/sortable
- Drag handle [⋮]
- Reorder conditions
- Reorder groups

State management:
- Nested structure
- Add/remove conditions
- Add/remove groups
- Update on change

Preview box:
- Show human-readable condition
- Update in real-time
- Use parentheses for grouping
```

**TESTING PROMPT 4.4:**
```bash
# 1. In Trigger Modal, toggle "Add conditions"

# 2. Should see empty condition builder

# 3. Click [+ Add Condition]

# 4. Should see condition row

# 5. Select field (e.g., "Amount")

# 6. Should show appropriate operators

# 7. Select operator (e.g., "greater than")

# 8. Should show number input

# 9. Enter value (e.g., 10000)

# 10. Click [+ Add AND Condition]

# 11. Add second condition

# 12. Preview should show: (Amount > 10000 AND ...)

# 13. Click [+ Add OR Group]

# 14. Add condition in new group

# 15. Preview should show: (...) OR (...)

# 16. Drag condition to reorder

# 17. Should reorder smoothly

# 18. Delete condition

# 19. Should remove from preview
```

---

### PROMPT 4.5: Action Builder Component

```
Create Action Builder in frontend/src/features/trigger-builder/components/:

Main component: ActionBuilder.tsx

Props:
- value: IAction[] (current actions)
- onChange: (actions: IAction[]) => void

Structure:
- List of action cards (expanded/collapsed)
- [+ Add Action] dropdown
- Drag to reorder
- Delete button per action

Action types:
1. Send Email
2. Start Flow
3. Update Database
4. Assign Task
5. Call Webhook

Action card (collapsed):
```
┌──────────────────────────────────────┐
│ ✉️ Send Email              [▼] [🗑️] │
│ To: CFO • Subject: High-value alert  │
└──────────────────────────────────────┘
```

Action card (expanded):
```
┌──────────────────────────────────────┐
│ ✉️ Send Email              [▲] [🗑️] │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Send To                              │
│ ⦿ Role  ○ User  ○ Email Address     │
│                                      │
│ Recipient                            │
│ [CFO                            ▼]  │
│                                      │
│ Subject                              │
│ [High-value purchase alert______]   │
│                                      │
│ Template                             │
│ [Approval Request             ▼]   │
│                                      │
│ ☑ Include task details              │
│ ☐ Attach files                      │
└──────────────────────────────────────┘
```

Components:
1. ActionList.tsx - List wrapper
2. ActionCard.tsx - Single action card
3. actions/EmailAction.tsx - Email configuration
4. actions/FlowAction.tsx - Flow configuration
5. actions/DatabaseAction.tsx - Database update config
6. actions/WebhookAction.tsx - Webhook config
7. actions/TaskAction.tsx - Task assignment config

EmailAction config:
- Send to: Radio (Role / User / Email / Dynamic)
- Recipient: Dropdown/input based on send to
- Subject: Text with variables
- Template: Dropdown (email templates)
- Options: Checkboxes (include details, attach files)

FlowAction config:
- Flow: Dropdown (available flows)
- Assign to: Dropdown (users/roles)
- Pass data: Radio (all / specific fields)
- Priority: Dropdown

DatabaseAction config:
- Table: Dropdown (custom tables)
- Set fields: Key-value pairs
- Where: Condition builder (reuse)

WebhookAction config:
- URL: Text input
- Method: Radio (POST / PUT / PATCH)
- Headers: Key-value pairs
- Body: JSON editor
- Auth: Dropdown (None / Bearer / API Key)

TaskAction config:
- Assign to: Dropdown (users/roles)
- Task: Dropdown (available tasks)
- Due date: Date picker or relative
- Priority: Dropdown

Each action type has its own form
Use react-hook-form for validation
Show errors per field
```

**TESTING PROMPT 4.5:**
```bash
# 1. In Trigger Modal THEN section

# 2. Click [+ Add Action]

# 3. Should show dropdown with action types

# 4. Select "Send Email"

# 5. Should add email action card (expanded)

# 6. Configure email:
# - Select "Role" for send to
# - Choose "CFO" from dropdown
# - Enter subject
# - Select template

# 7. Click card header

# 8. Should collapse

# 9. Add another action (Start Flow)

# 10. Configure flow action

# 11. Drag action to reorder

# 12. Should reorder

# 13. Click [🗑️] on action

# 14. Should show confirmation

# 15. Confirm - action removed

# 16. Test all action types:
# - Email ✓
# - Start Flow ✓
# - Update Database ✓
# - Assign Task ✓
# - Call Webhook ✓
```

---

## 🧪 TESTING PHASE (Days 78-90)

### PROMPT 5.1: Unit Tests Setup

```
Set up testing infrastructure:

Backend:
1. Install: jest, @types/jest, ts-jest, supertest, @types/supertest

2. Create jest.config.js:
   - Use ts-jest preset
   - Test files: **/*.test.ts
   - Coverage thresholds: 80%

3. Create test utilities:
   - tests/helpers/db.helper.ts (test database setup)
   - tests/helpers/auth.helper.ts (generate test tokens)
   - tests/helpers/seed.helper.ts (seed test data)

4. Create tests:
   - modules/auth/auth.service.test.ts
   - modules/tasks/task.service.test.ts
   - modules/flows/flow.engine.test.ts
   - modules/triggers/trigger.evaluator.test.ts

Frontend:
1. Install: vitest, @testing-library/react, @testing-library/jest-dom

2. Create vitest.config.ts

3. Create test utilities:
   - tests/helpers/render.tsx (render with providers)
   - tests/helpers/mocks.ts (API mocks)

4. Create tests:
   - features/auth/components/LoginForm.test.tsx
   - features/task-builder/components/TaskBuilder.test.tsx
   - features/flow-builder/components/FlowBuilder.test.tsx

Write tests for:
- All service methods
- All API endpoints
- All React components
- Trigger evaluation logic
- Flow execution logic

Test coverage goal: 80%+
```

**TESTING PROMPT 5.1:**
```bash
# Backend tests
cd backend
npm test

# Should run all tests
# Should show coverage report
# Coverage should be > 80%

# Frontend tests
cd frontend
npm test

# Should run all tests
# Should show coverage report
```

---

### PROMPT 5.2: Integration Tests

```
Create integration tests:

Backend: tests/integration/

1. auth.integration.test.ts:
   - Register → Login → Access protected route
   - Invalid credentials
   - Token expiry

2. task-flow.integration.test.ts:
   - Create task
   - Create flow with task
   - Start flow instance
   - Complete task
   - Flow moves to next level

3. trigger.integration.test.ts:
   - Create trigger
   - Complete task
   - Trigger evaluates
   - Actions execute
   - Check execution logs

4. end-to-end.test.ts:
   - Full workflow: Create task → Create flow → Add trigger → Execute flow → Trigger fires

Frontend: (using Playwright)

1. auth.spec.ts:
   - Login flow
   - Register flow
   - Protected routes

2. task-builder.spec.ts:
   - Create task
   - Add fields
   - Configure fields
   - Save task
   - Preview task

3. flow-builder.spec.ts:
   - Create flow
   - Add levels
   - Add tasks
   - Add branches
   - Add triggers
   - Save flow

4. full-workflow.spec.ts:
   - Login
   - Create task
   - Create flow
   - Add trigger
   - Test execution

Run integration tests before each release
Require all tests passing before merge
```

**TESTING PROMPT 5.2:**
```bash
# Backend integration tests
npm run test:integration

# Should test full workflows
# Should test API endpoints together
# Should test database operations

# Frontend E2E tests
npm run test:e2e

# Should open browser
# Should run user scenarios
# Should test complete workflows
```

---

This is Part 2 of the Mega Prompt document. Part 3 will continue with Database Builder, Datasets, and remaining features.

**Current Progress:**
✅ Project Setup
✅ Authentication
✅ Task Builder
✅ Flow Builder
✅ Trigger System
✅ Testing Setup

**Remaining (Part 3):**
- Database Builder
- Dataset Builder
- Company Hierarchy
- Integrations
- Audit Logs
- Client Portal
- Deployment
