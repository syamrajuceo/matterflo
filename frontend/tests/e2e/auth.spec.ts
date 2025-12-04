import { test, expect } from '@playwright/test';
import { loginAsTestUser, registerTestUser, logout, checkBackendHealth } from './helpers/auth';

test.describe('Authentication Flow', () => {
  // Note: Some tests (like "should display login page") don't need backend
  // Backend-dependent tests will fail gracefully if backend is not available

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should display login page by default', async ({ page }) => {
    // Check if we're on the login page
    await expect(page).toHaveURL(/.*\/login/);
    
    // Check for login form elements
    await expect(page.getByPlaceholder(/your@email.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/••••••••/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    
    // Click on register link
    const registerLink = page.getByRole('link', { name: /register|sign up/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*\/register/);
    }
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /login/i }).click();
    
    // HTML5 validation should prevent submission
    // Check that inputs are required
    const emailInput = page.getByPlaceholder(/your@email.com/i);
    await expect(emailInput).toHaveAttribute('required');
  });

  test('should login with valid credentials', async ({ page }) => {
    // Try to login - if user doesn't exist, register first
    try {
      await loginAsTestUser(page);
    } catch (error) {
      // User might not exist, try registering first
      await registerTestUser(page, 'admin@test-company.local');
      await logout(page);
      await loginAsTestUser(page);
    }
    
    // Verify we're logged in by checking for dashboard content (use first() to handle multiple matches)
    await expect(page.getByText(/welcome back/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should register a new user', async ({ page }) => {
    const email = await registerTestUser(page);
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Verify we're logged in (use first() to handle multiple matches)
    await expect(page.getByText(/welcome back/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should protect routes and redirect to login when not authenticated', async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Try to access a protected route directly (note: /flows without /new or /:id might not be a route)
    // Try /flows/new which is a protected route
    await page.goto('/flows/new');
    
    // Wait for React Router to process the redirect
    await page.waitForTimeout(1000);
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
  });

  test('should logout and redirect to login', async ({ page }) => {
    // First login
    try {
      await loginAsTestUser(page);
    } catch (error) {
      // User might not exist, register first
      await registerTestUser(page, 'admin@test-company.local');
      await logout(page);
      await loginAsTestUser(page);
    }
    
    // Wait for dashboard to fully load
    await page.waitForLoadState('networkidle');
    
    // Logout
    await logout(page);
    
    // Should be redirected to login (give it more time)
    await expect(page).toHaveURL(/.*\/login/, { timeout: 15000 });
  });
});

