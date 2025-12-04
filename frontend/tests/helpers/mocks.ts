/**
 * API mocks for testing
 */

import { vi } from 'vitest';

export const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
  interceptors: {
    request: {
      use: vi.fn(),
      eject: vi.fn(),
    },
    response: {
      use: vi.fn(),
      eject: vi.fn(),
    },
  },
};

/**
 * Mock successful API response
 */
export function mockSuccessResponse<T>(data: T) {
  return {
    data: {
      success: true,
      data,
    },
    status: 200,
    statusText: 'OK',
  };
}

/**
 * Mock error API response
 */
export function mockErrorResponse(status: number, message: string) {
  return {
    response: {
      data: {
        success: false,
        error: {
          code: 'ERROR',
          message,
        },
      },
      status,
      statusText: 'Error',
    },
  };
}

/**
 * Mock localStorage
 */
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

/**
 * Setup localStorage mock
 */
export function setupLocalStorageMock() {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
}

