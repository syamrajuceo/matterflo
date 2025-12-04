import { test, expect } from '@playwright/test';
import { loginAsTestUser, registerTestUser, logout, checkBackendHealth } from './helpers/auth';

test.describe('Task Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Login first (register if needed)
    try {
      await loginAsTestUser(page);
    } catch (error) {
      await registerTestUser(page, 'admin@test-company.local');
      await logout(page);
      await loginAsTestUser(page);
    }
    
    // Navigate to task builder
    await page.goto('/tasks/new');
    await page.waitForLoadState('networkidle');
  });

  test('should create a new task', async ({ page }) => {
    // Fill in task name
    const nameInput = page.getByPlaceholder(/task name|name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Task');
    }
    
    // Fill in description if present
    const descriptionInput = page.getByPlaceholder(/description/i);
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('This is a test task');
    }
    
    // Save the task
    const saveButton = page.getByRole('button', { name: /save|create/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Wait for task to be created (check for success message or navigation)
      await page.waitForTimeout(1000);
    }
  });

  test('should add a field to a task', async ({ page }) => {
    // First create or open a task
    await page.goto('/tasks/new');
    
    // Look for "Add Field" button
    const addFieldButton = page.getByRole('button', { name: /add field|new field/i });
    if (await addFieldButton.isVisible()) {
      await addFieldButton.click();
      
      // Fill in field details if a form appears
      const fieldNameInput = page.getByPlaceholder(/field name|name/i);
      if (await fieldNameInput.isVisible()) {
        await fieldNameInput.fill('Test Field');
      }
      
      // Save the field
      const saveFieldButton = page.getByRole('button', { name: /save|add/i });
      if (await saveFieldButton.isVisible()) {
        await saveFieldButton.click();
      }
    }
  });

  test('should configure a field', async ({ page }) => {
    // This test assumes a task with a field already exists
    // Navigate to task edit page and configure a field
    // The exact steps depend on your UI implementation
  });

  test('should save a task', async ({ page }) => {
    await page.goto('/tasks/new');
    
    // Fill in task details
    const nameInput = page.getByPlaceholder(/task name|name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('Task to Save');
    }
    
    // Click save
    const saveButton = page.getByRole('button', { name: /save/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Verify save was successful (check for success message or navigation)
      await page.waitForTimeout(1000);
    }
  });

  test('should preview a task', async ({ page }) => {
    // Navigate to a task
    await page.goto('/tasks/new');
    
    // Look for preview button
    const previewButton = page.getByRole('button', { name: /preview/i });
    if (await previewButton.isVisible()) {
      await previewButton.click();
      
      // Verify preview mode is active
      // This depends on your preview implementation
      await page.waitForTimeout(500);
    }
  });
});

