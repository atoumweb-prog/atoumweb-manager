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
import './prospect-recipe.css';
import './commercial.css';
import './quote-line-editor.css';
import './quote-client-preview.css';
import './projects.css';
import './project-resources.css';
import './project-technical-library.css';
import './project-completion.css';
import './time.css';
import './time-recovery.css';
import './operations.css';
import './workflow.css';
import './display-density.css';
import './prospect-workflow-v2.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Élément racine introuvable.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
