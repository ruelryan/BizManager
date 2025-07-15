import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('main.tsx loaded');

// Simple fallback content
const FallbackApp = () => (
  <div style={{ 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }}>
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ color: '#111827', marginBottom: '1rem' }}>BizManager</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Business Management System</p>
      <div style={{ marginBottom: '2rem' }}>
        <a href="/landing" style={{ color: '#3b82f6', textDecoration: 'none', marginRight: '1rem' }}>Landing</a>
        <a href="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>Login</a>
      </div>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
        If you see this, the React app failed to load properly.
      </p>
    </div>
  </div>
);

try {
  console.log('Creating root element');
  
  // Get root element
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  // Create root
  const root = createRoot(rootElement);
  console.log('Root created successfully');
  
  // Render app
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  console.log('App rendered successfully');
  
  // Fetch exchange rates after app is rendered
  import('./utils/currency').then(({ fetchExchangeRates }) => {
    fetchExchangeRates().catch(error => {
      console.error('Failed to fetch exchange rates:', error);
    });
  }).catch(error => {
    console.error('Failed to load currency utils:', error);
  });
  
} catch (error) {
  console.error('Failed to render React app:', error);
  
  // Fallback to simple HTML
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #f9fafb; font-family: system-ui, -apple-system, sans-serif;">
        <div style="text-align: center; padding: 2rem;">
          <h1 style="color: #111827; margin-bottom: 1rem;">BizManager</h1>
          <p style="color: #6b7280; margin-bottom: 2rem;">Business Management System</p>
          <div style="margin-bottom: 2rem;">
            <a href="/landing" style="color: #3b82f6; text-decoration: none; margin-right: 1rem;">Landing</a>
            <a href="/login" style="color: #3b82f6; text-decoration: none;">Login</a>
          </div>
          <p style="color: #9ca3af; font-size: 0.875rem;">
            React app failed to load. Error: ${error.message}
          </p>
        </div>
      </div>
    `;
  }
}