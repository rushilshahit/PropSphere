import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { App } from './App';
import { initAnalytics } from './lib/analytics';

const phKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const phHost = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://app.posthog.com';
if (phKey) initAnalytics(phKey, phHost);

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
