import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ToastProvider } from './components/ui/use-toast';
import { setupConsoleFilter } from './utils/console-filter';

// Filter out browser extension console errors in development
setupConsoleFilter();

// Light theme by default (remove dark mode)
// document.documentElement.classList.add('dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>
);
