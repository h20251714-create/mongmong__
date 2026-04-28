import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Global error handling for production debugging
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global JS Error:", message, "at", source, lineno, colno, error);
  // Optional: You could show a fallback UI here if desired
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
