/**
 * Filters out browser extension-related console errors during development
 * These errors are harmless and clutter the console
 * 
 * Note: Primary filtering happens in index.html before React loads.
 * This is a backup/secondary filter for any errors that slip through.
 */
export function setupConsoleFilter() {
  if (import.meta.env.DEV) {
    // Check if filter was already set up in index.html
    // If so, don't duplicate the filtering
    const filterAlreadyActive = (window as any).__consoleFilterActive;
    if (filterAlreadyActive) {
      return;
    }
    
    // Mark as active
    (window as any).__consoleFilterActive = true;

    // Store original console methods (may have been overridden by index.html)
    const originalError = console.error;
    const originalWarn = console.warn;

    // Patterns to filter (browser extension errors)
    const extensionErrorPatterns = [
      /chrome-extension:\/\//i,
      /moz-extension:\/\//i,
      /safari-extension:\/\//i,
      /Denying load of/i,
      /web_accessible_resources/i,
      /ERR_FILE_NOT_FOUND.*extension/i,
      /chrome-extension:\/\/invalid/i,
      /extensionState\.js/i,
      /heuristicsRedefinitions\.js/i,
      /translation\.json/i,
      /contentScript\.bundle\.js/i,
      /net::ERR_FAILED.*extension/i,
      /Failed to load resource.*extension/i,
    ];

    // Helper to check if message should be filtered
    const shouldFilter = (message: string): boolean => {
      return extensionErrorPatterns.some((pattern) => pattern.test(message));
    };

    // Override console.error (backup filter)
    const currentError = console.error;
    console.error = function (...args: any[]) {
      const message = args[0]?.toString() || '';
      if (!shouldFilter(message)) {
        currentError.apply(console, args);
      }
    };

    // Override console.warn (backup filter)
    const currentWarn = console.warn;
    console.warn = function (...args: any[]) {
      const message = args[0]?.toString() || '';
      if (!shouldFilter(message)) {
        currentWarn.apply(console, args);
      }
    };
  }
}

