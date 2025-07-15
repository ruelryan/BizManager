import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { fetchExchangeRates } from './utils/currency';

// Fetch latest exchange rates
fetchExchangeRates().catch(error => {
  console.error('Failed to fetch exchange rates:', error);
});

// Only register service worker if supported (not in StackBlitz environment)
if ('serviceWorker' in navigator && !window.location.hostname.includes('webcontainer')) {
  import('workbox-window').then(({ Workbox }) => {
    const wb = new Workbox('/service-worker.js');
    
    wb.addEventListener('controlling', () => {
      window.location.reload();
    });

    wb.addEventListener('waiting', () => {
      // Show update available notification
      if (confirm('New version available! Click OK to update.')) {
        wb.messageSkipWaiting();
      }
    });

    wb.register().catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  }).catch((error) => {
    console.log('Service worker not available:', error);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);