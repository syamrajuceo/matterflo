/**
 * Extracts a user-friendly error message from an axios error response
 */
export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Check if it's an axios error with response data
    const axiosError = error as {
      response?: {
        data?: {
          error?: {
            message?: string;
            code?: string;
          };
          message?: string;
        };
      };
      message?: string;
    };

    if (axiosError.response?.data) {
      const errorData = axiosError.response.data;
      
      // Try error.message first (standard API format)
      if (errorData.error?.message) {
        return errorData.error.message;
      }
      
      // Try top-level message
      if (errorData.message) {
        return errorData.message;
      }
    }

    // Fall back to error message
    if (error.message) {
      return error.message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
};

/**
 * Extracts error title from error response
 */
export const extractErrorTitle = (error: unknown, defaultTitle: string): string => {
  if (error instanceof Error) {
    const axiosError = error as {
      response?: {
        data?: {
          error?: {
            code?: string;
            message?: string;
          };
        };
      };
    };

    if (axiosError.response?.data?.error?.code) {
      const code = axiosError.response.data.error.code;
      
      switch (code) {
        case 'VALIDATION_ERROR':
          return 'Validation Error';
        case 'NOT_FOUND':
          return 'Not Found';
        case 'AUTH_ERROR':
          return 'Authentication Error';
        case 'FORBIDDEN':
          return 'Access Denied';
        default:
          return defaultTitle;
      }
    }
  }

  return defaultTitle;
};

