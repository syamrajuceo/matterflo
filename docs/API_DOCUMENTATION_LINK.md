# API Documentation Access

## Swagger UI Link

The API documentation is available at:

**http://localhost:3000/api-docs**

## Access Instructions

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Open in Browser:**
   - Navigate to: `http://localhost:3000/api-docs`
   - The Swagger UI will display all available API endpoints

## API Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://api.erpbuilder.com/api`

## Available Endpoints

The Swagger documentation includes all endpoints for:

1. **Authentication** (`/api/auth`)
   - Register, Login, Get Current User

2. **Tasks** (`/api/tasks`)
   - CRUD operations, Field management, Publish, Duplicate

3. **Flows** (`/api/flows`)
   - CRUD operations, Level management, Branch management, Task/Role assignment

4. **Triggers** (`/api/triggers`)
   - CRUD operations, Test trigger, Get executions

5. **Execution** (`/api/executions`)
   - Task execution, Flow instance management

6. **Database** (`/api/database`)
   - Custom table management, Field operations, Record CRUD, CSV import/export

7. **Datasets** (`/api/datasets`)
   - Dataset CRUD, Section management, Publish, Get with data

8. **Company** (`/api/company`)
   - Hierarchy, Departments, Roles, Users

9. **Integrations** (`/api/integrations`)
   - Integration CRUD, Workflow management

10. **Audit** (`/api/audit`)
    - Get logs, Export CSV

11. **Client Portal** (`/api/client`)
    - Dashboard, Tasks, Flows

## Authentication

Most endpoints require authentication. Use the `/api/auth/login` endpoint to get a JWT token, then include it in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Testing Endpoints

You can test endpoints directly from the Swagger UI:
1. Click "Authorize" button at the top
2. Enter your JWT token: `Bearer <your-token>`
3. Try any endpoint - it will use the token automatically

## Frontend API Clients

All endpoints have corresponding TypeScript API clients in:
- `frontend/src/lib/api-client.ts` - Base client configuration
- `frontend/src/features/*/api/*Api.ts` - Feature-specific clients

## Recent Updates

The following endpoints were added to Swagger:
- `/triggers/{id}/executions` - Get trigger executions
- `/datasets/{id}/publish` - Publish dataset
- `/company/roles/{roleId}/assign/{userId}` - Assign user to role
- `/company/departments/{id}/roles` - Get roles by department
- `/client/tasks/pending` - Get pending tasks
- `/client/tasks/{id}/submit` - Submit task

## Schemas Added

- `TaskExecution` - Task execution schema
- `FlowInstance` - Flow instance schema
- `Dataset` - Dataset schema

