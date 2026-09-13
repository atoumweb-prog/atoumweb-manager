import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './crm.css';
import './crm-extras.css';
import './prospect-detail.css';
import './client-detail.css';
import './search-extra.css';
import './detail-layout-overrides.css';
import './prospect-workflow.css';
import './commercial.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Élément racine introuvable.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
