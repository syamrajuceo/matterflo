import * as React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

export type ToastStatus = 'default' | 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  title?: string;
  description?: string;
  status?: ToastStatus;
  duration?: number; // Auto-dismiss duration in ms (default: 5000)
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

const getStatusStyles = (status: ToastStatus = 'default') => {
  switch (status) {
    case 'success':
      return {
        border: 'border-green-500/50',
        bg: 'bg-green-50 dark:bg-green-950',
        icon: <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />,
        titleColor: 'text-green-800 dark:text-green-300',
      };
    case 'error':
      return {
        border: 'border-red-500/50',
        bg: 'bg-red-50 dark:bg-red-950',
        icon: <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />,
        titleColor: 'text-red-800 dark:text-red-300',
      };
    case 'warning':
      return {
        border: 'border-yellow-500/50',
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        icon: <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />,
        titleColor: 'text-yellow-800 dark:text-yellow-300',
      };
    default:
      return {
        border: 'border-border',
        bg: 'bg-card',
        icon: <Info className="h-3 w-3 text-muted-foreground" />,
        titleColor: 'text-foreground',
      };
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now();
    const toastWithId = { id, duration: 5000, ...toast };
    setToasts((prev) => [...prev, toastWithId]);

    // Auto-dismiss after duration
    if (toastWithId.duration && toastWithId.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toastWithId.duration);
    }
  }, []);

  const dismissToast = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toastContainer = React.useMemo(() => {
    if (typeof document === 'undefined') return null;
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.position = 'fixed';
      container.style.bottom = '1rem';
      container.style.right = '1rem';
      container.style.zIndex = '100';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }
    return container;
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      {toastContainer &&
        createPortal(
          <div className="pointer-events-none flex w-auto max-w-sm flex-col gap-2 items-end">
            {toasts.map((toast) => {
              const styles = getStatusStyles(toast.status);
              return (
                <div
                  key={toast.id}
                  className={`pointer-events-auto flex items-start gap-2 rounded-md border ${styles.border} px-3 py-2 text-xs shadow-lg transition-all w-auto max-w-xs animate-in slide-in-from-right-full data-[swipe=end]:animate-out data-[swipe=end]:fade-out-80 data-[swipe=end]:slide-out-to-right-full`}
                  style={{
                    backgroundColor: document.documentElement.classList.contains('dark') 
                      ? (toast.status === 'success' ? 'rgb(5 46 22)' : toast.status === 'error' ? 'rgb(69 10 10)' : toast.status === 'warning' ? 'rgb(66 32 6)' : 'hsl(var(--card))')
                      : (toast.status === 'success' ? 'rgb(240 253 244)' : toast.status === 'error' ? 'rgb(254 242 242)' : toast.status === 'warning' ? 'rgb(254 252 232)' : 'hsl(var(--card))'),
                    opacity: 1,
                    backdropFilter: 'none',
                  }}
                >
                  <div className="flex-shrink-0 pt-0.5">{styles.icon}</div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    {toast.title && (
                      <p className={`font-medium text-[11px] leading-tight ${styles.titleColor}`}>
                        {toast.title}
                      </p>
                    )}
                    {toast.description && (
                      <p className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
                        {toast.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="flex-shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Dismiss"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>,
          toastContainer
        )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};


