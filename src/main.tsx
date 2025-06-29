import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Font } from '@react-pdf/renderer';
import App from './App.tsx';
import './index.css';

// Register PDF fonts once at application startup
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
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