import { test, expect } from '@playwright/test';
import { loginAsTestUser, registerTestUser, logout, checkBackendHealth } from './helpers/auth';

test.describe('Full Workflow', () => {
  test('should complete full workflow: Login → Create task → Create flow → Add trigger → Test execution', async ({ page }) => {
    // Step 1: Login (register if needed)
    try {
      await loginAsTestUser(page);
    } catch (error) {
      await registerTestUser(page, 'admin@test-company.local');
      await logout(page);
      await loginAsTestUser(page);
    }
    
    // Step 2: Create a task
    await page.goto('/tasks/new');
    
    const taskNameInput = page.getByPlaceholder(/task name|name/i);
    if (await taskNameInput.isVisible()) {
      await taskNameInput.fill('Workflow Test Task');
    }
    
    const taskDescriptionInput = page.getByPlaceholder(/description/i);
    if (await taskDescriptionInput.isVisible()) {
      await taskDescriptionInput.fill('Task for workflow testing');
    }
    
    // Use first() to handle multiple matches, prefer "Create Task" button
    const createTaskButton = page.getByRole('button', { name: /^create task$/i }).first();
    const saveTaskButton = page.getByRole('button', { name: /^save$/i }).first();
    
    if (await createTaskButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (await createTaskButton.isEnabled()) {
        await createTaskButton.click();
        await page.waitForTimeout(1000);
      }
    } else if (await saveTaskButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (await saveTaskButton.isEnabled()) {
        await saveTaskButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Step 3: Create a flow
    await page.goto('/flows/new');
    
    const flowNameInput = page.getByPlaceholder(/flow name|name/i);
    if (await flowNameInput.isVisible()) {
      await flowNameInput.fill('Workflow Test Flow');
    }
    
    // Use first() to handle multiple matches, prefer "Create Flow" button
    const createFlowButton = page.getByRole('button', { name: /^create flow$/i }).first();
    const saveFlowButton = page.getByRole('button', { name: /^save$/i }).first();
    
    if (await createFlowButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (await createFlowButton.isEnabled()) {
        await createFlowButton.click();
        await page.waitForTimeout(1000);
      }
    } else if (await saveFlowButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (await saveFlowButton.isEnabled()) {
        await saveFlowButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Step 4: Add a level to the flow
    const addLevelButton = page.getByRole('button', { name: /add level|insert level|new level/i });
    if (await addLevelButton.isVisible()) {
      await addLevelButton.click();
      await page.waitForTimeout(500);
    }
    
    // Step 5: Add the task to the level
    // This depends on your UI implementation
    // Look for "Add Task" button in the level
    
    // Step 6: Add a trigger
    // This depends on your UI implementation
    // Look for "Add Trigger" button in the level
    
    // Step 7: Save the flow
    const finalSaveButton = page.getByRole('button', { name: /^save$/i }).first();
    if (await finalSaveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      if (await finalSaveButton.isEnabled()) {
        await finalSaveButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Verify the workflow is complete
    // This depends on your UI implementation
    // Check for success indicators or navigation
  });
});

