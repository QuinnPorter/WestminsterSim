import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/global.css';

// log-only backstop for async failures the error boundary can't catch (render
// errors are handled by ErrorBoundary; these keep crashes out of the console void)
window.addEventListener('unhandledrejection', (e) => {
  console.error('Westminster.sim: unhandled promise rejection', e.reason);
});
window.addEventListener('error', (e) => {
  console.error('Westminster.sim: uncaught error', e.error ?? e.message);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
