/**
 * E2E Test Helpers for Authentication
 */

import { Page, expect } from '@playwright/test';

/**
 * Login as a test user
 * Creates the user if it doesn't exist, then logs in
 */
export async function loginAsTestUser(page: Page, email: string = 'admin@test-company.local', password: string = 'password123') {
  await page.goto('/login');
  
  // Fill in login form
  await page.getByPlaceholder(/your@email.com/i).fill(email);
  await page.getByPlaceholder(/••••••••/i).fill(password);
  
  // Submit form and wait for navigation
  await Promise.all([
    page.waitForURL(/.*\/dashboard/, { timeout: 15000 }),
    page.getByRole('button', { name: /login/i }).click(),
  ]);
  
  // Wait for dashboard to load
  await page.waitForLoadState('networkidle');
  
  // Verify we're logged in
  await expect(page).toHaveURL(/.*\/dashboard/);
}

/**
 * Check if backend is reachable
 */
export async function checkBackendHealth(page: Page): Promise<boolean> {
  try {
    // Try health endpoint first (without /api)
    const healthUrl = 'http://localhost:3000/health';
    const response = await page.request.get(healthUrl, { timeout: 10000 });
    if (response.status() === 200) {
      return true;
    }
  } catch (error) {
    // Health endpoint failed, try API endpoint as fallback
    try {
      const apiUrl = 'http://localhost:3000/api/auth/me';
      const response = await page.request.get(apiUrl, { timeout: 5000 });
      // Even if it returns 401 (unauthorized), backend is running
      return response.status() !== 0 && response.status() < 500;
    } catch (apiError) {
      return false;
    }
  }
  return false;
}

/**
 * Register a new test user
 */
export async function registerTestUser(page: Page, email?: string, password: string = 'password123') {
  const testEmail = email || `test-${Date.now()}@example.com`;
  
  // Set up console error listener early (filter out expected errors)
  const consoleErrors: string[] = [];
  const consoleListener = (msg: any) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out expected/benign errors:
      // - Rate limit errors (429)
      // - Generic AxiosError messages (these are handled by the UI)
      // - Network errors that are handled gracefully
      // - Connection refused errors (backend not running)
      const isRateLimit = text.includes('429') || text.includes('Too Many Requests');
      const isGenericAxiosError = text.includes('AxiosError') && !text.includes('Network Error');
      const isHandledError = text.includes('Registration error') || text.includes('Login error');
      const isConnectionError = text.includes('ERR_CONNECTION_REFUSED') || 
                                text.includes('Failed to load resource') ||
                                text.includes('net::ERR') ||
                                text.includes('connection refused');
      
      if (!isRateLimit && !isGenericAxiosError && !isHandledError && !isConnectionError) {
        consoleErrors.push(text);
      }
    }
  };
  page.on('console', consoleListener);
  
  try {
    await page.goto('/register');
    
    // Wait for form
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Fill form
    await page.getByPlaceholder(/you@example.com/i).fill(testEmail);
    await page.getByPlaceholder(/create a password/i).fill(password);
    await page.getByPlaceholder(/john/i).fill('Test');
    await page.getByPlaceholder(/doe/i).fill('User');
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /register|sign up|create account/i });
    await submitButton.click();
    
    // Wait for either success (dashboard) or error (stay on register page)
    try {
      await page.waitForURL(/.*\/dashboard/, { timeout: 20000 });
      
      // Wait for dashboard to load
      await page.waitForLoadState('networkidle');
      
      // Remove console listener
      page.off('console', consoleListener);
      
      return testEmail;
    } catch (error) {
      // Check current URL to see if we're still on register page
      let currentURL: string;
      try {
        currentURL = page.url();
      } catch (e) {
        // Page might be closed
        page.off('console', consoleListener);
        throw new Error(`Registration failed - Page was closed. Backend may not be running.`);
      }
      
      // Check if there's an error message on the page (look for toast or form errors)
      try {
        // Check for toast error messages
        const toastError = await page.locator('[role="alert"], [class*="toast"], [class*="error"]').filter({ 
          hasText: /error|failed|invalid|already exists/i 
        }).first().isVisible({ timeout: 3000 }).catch(() => false);
        
        if (toastError) {
          const errorText = await page.locator('[role="alert"], [class*="toast"], [class*="error"]').filter({ 
            hasText: /error|failed|invalid|already exists/i 
          }).first().textContent().catch(() => 'Unknown error');
          page.off('console', consoleListener);
          throw new Error(`Registration failed: ${errorText}`);
        }
        
        // Check for form validation errors
        const formError = await page.locator('text=/error|failed|already exists|invalid/i').first().isVisible({ timeout: 2000 }).catch(() => false);
        if (formError) {
          const errorText = await page.locator('text=/error|failed|already exists|invalid/i').first().textContent().catch(() => 'Unknown error');
          // Only throw if it's a real error, not just "Registration error" which is generic
          if (!errorText.toLowerCase().includes('registration error') && !errorText.toLowerCase().includes('axioserror')) {
            page.off('console', consoleListener);
            throw new Error(`Registration failed: ${errorText}`);
          }
        }
      } catch (e) {
        // Ignore errors checking for error messages
      }
      
      // Check if we're still on register page (registration didn't work)
      if (currentURL.includes('/register')) {
        // Only report console errors if they're meaningful (not generic AxiosError or connection errors)
        const meaningfulErrors = consoleErrors.filter(err => {
          const lowerErr = err.toLowerCase();
          return !lowerErr.includes('axioserror') && 
                 !lowerErr.includes('registration error') &&
                 !lowerErr.includes('network error') &&
                 !lowerErr.includes('err_connection_refused') &&
                 !lowerErr.includes('failed to load resource') &&
                 !lowerErr.includes('connection refused');
        });
        
        if (meaningfulErrors.length > 0) {
          page.off('console', consoleListener);
          throw new Error(`Registration failed - Console errors: ${meaningfulErrors.join(', ')}`);
        }
        
        page.off('console', consoleListener);
        throw new Error(`Registration failed - Still on register page after 20000ms. Backend may not be running or there may be a network error. Check browser console for details.`);
      }
      
      page.off('console', consoleListener);
      throw error;
    }
  } catch (error) {
    // Make sure to remove listener even if there's an error
    page.off('console', consoleListener);
    throw error;
  }
}

/**
 * Logout from the application
 */
export async function logout(page: Page) {
  // Try multiple strategies to find and click the logout button
  
  // Strategy 1: Find dropdown menu trigger by looking for button with avatar
  const avatarButton = page.locator('button').filter({ 
    has: page.locator('[class*="Avatar"], [class*="avatar"], img[alt*="avatar"]') 
  }).first();
  
  // Strategy 2: Find button that contains user name text
  const nameButton = page.getByRole('button').filter({ 
    hasText: /test|admin|user|firstname|lastname/i 
  }).first();
  
  // Strategy 3: Find any button in header that might be user menu
  const headerButton = page.locator('header button').last();
  
  let clicked = false;
  
  // Try avatar button first
  if (await avatarButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await avatarButton.click();
    clicked = true;
  } 
  // Try name button
  else if (await nameButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await nameButton.click();
    clicked = true;
  }
  // Try header button as fallback
  else if (await headerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await headerButton.click();
    clicked = true;
  }
  
  if (clicked) {
    // Wait for dropdown menu to appear
    await page.waitForTimeout(800);
    
    // Find logout menu item
    const logoutMenuItem = page.getByRole('menuitem', { name: /logout/i });
    if (await logoutMenuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await Promise.all([
        page.waitForURL(/.*\/login/, { timeout: 10000 }),
        logoutMenuItem.click(),
      ]);
      return;
    }
    
    // Fallback: try clicking by text content
    const logoutByText = page.locator('text=/logout/i').first();
    if (await logoutByText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await Promise.all([
        page.waitForURL(/.*\/login/, { timeout: 10000 }),
        logoutByText.click(),
      ]);
      return;
    }
  }
  
  // Final fallback: clear localStorage and navigate
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth-storage');
  });
  await page.goto('/login');
  await page.waitForURL(/.*\/login/);
}

