import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

// Load App in a separate chunk so module init order is safe (avoids "Cannot access before initialization" in prod).
const rootEl = document.getElementById('root');
import('./App.jsx').then(({ default: App }) => {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}).catch((err) => {
  console.error('Failed to load app', err);
  if (rootEl) rootEl.innerHTML = '<p style="padding:1rem;color:#c00;">Failed to load app. Check the console.</p>';
});
