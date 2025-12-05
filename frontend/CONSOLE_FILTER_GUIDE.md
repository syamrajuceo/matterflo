# Console Error Filtering Guide

## Browser Extension Errors

Some console errors you see are from browser extensions (translation tools, code completion, etc.) and are harmless. They don't affect your application's functionality.

## Automatic Filtering

The application includes an automatic console filter that runs in development mode to filter out browser extension errors. However, some errors logged directly by Chrome's browser engine cannot be filtered via JavaScript.

## Manual Filtering in Chrome DevTools

If you still see extension-related errors, you can use Chrome DevTools' built-in filter:

### Method 1: Console Filter (Recommended)

1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Go to the **Console** tab
3. Click the **Filter** icon (funnel icon) in the console toolbar
4. Add a negative filter: `-chrome-extension` or `-extension`
5. This will hide all messages containing "chrome-extension" or "extension"

### Method 2: Hide Extension Errors

1. Open Chrome DevTools
2. Click the **Settings** icon (gear icon) in DevTools
3. Go to **Console** section
4. Check **"Hide extension errors"** (if available in your Chrome version)

### Method 3: Filter by Text

1. In the Console tab, use the filter box
2. Type: `-chrome-extension -Denying -ERR_FILE_NOT_FOUND`
3. This hides messages containing any of these terms

## Common Extension Error Patterns

These errors are safe to ignore:
- `chrome-extension://...` URLs
- `Denying load of...`
- `web_accessible_resources`
- `ERR_FILE_NOT_FOUND` (when related to extensions)
- `extensionState.js`, `heuristicsRedefinitions.js`
- `translation.json` (from translation extensions)

## Disabling Extensions (Alternative)

If the errors are too distracting, you can:

1. Open Chrome in Incognito mode (extensions are usually disabled)
2. Or disable specific extensions:
   - Go to `chrome://extensions/`
   - Disable translation or code completion extensions temporarily

## Verifying Filter is Active

When the application loads, you should see a message in the console:
```
🔇 Console filter active - Browser extension errors are being filtered
```

If you don't see this message, the filter may not be active. Check that you're running in development mode (localhost).

