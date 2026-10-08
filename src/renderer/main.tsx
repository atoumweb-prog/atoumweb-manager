import {OperationalRecipePage} from './projects/recipe/OperationalRecipePage';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './crm.css';
import './crm-extras.css';
import './crm-identity.css';
import './prospect-detail.css';
import './client-detail.css';
import './search-extra.css';
import './detail-layout-overrides.css';
import './prospect-workflow.css';
import './prospect-recipe.css';
import './commercial.css';
import './billing.css';
import './expenses.css';
import './quote-line-editor.css';
import './quote-client-preview.css';
import './projects.css';
import './project-resources.css';
import './project-technical-library.css';
import './project-completion.css';
import './time.css';
import './time-recovery.css';
import './operations.css';
import './analytics.css';
import './workflow.css';
import './display-density.css';
import './prospect-workflow-v2.css';
import './prospect-recipe-fixes.css';
import './pre-phase5-commercial-ux.css';
import './prospection-commercial-v2.css';
import './ui-typography-consistency.css';
import './ui-consistency-v2.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Élément racine introuvable.');
}
const rendererRoot = rootElement;

let fatalRendererShown = false;

function rendererErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.stack || error.message;
  if (typeof error === 'string') return error;
  try { return JSON.stringify(error); } catch { return String(error); }
}

function showRendererFailure(error: unknown): void {
  if (fatalRendererShown) return;
  fatalRendererShown = true;
  const message = rendererErrorMessage(error);
  console.error('Erreur renderer AtoumWeb Manager', error);
  rendererRoot.innerHTML = '';
  const shell = document.createElement('div');
  shell.className = 'renderer-fatal-shell';
  const card = document.createElement('div');
  card.className = 'renderer-fatal-card';
  const eyebrow = document.createElement('span');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'AtoumWeb Manager';
  const title = document.createElement('h1');
  title.textContent = 'Une erreur d’affichage a interrompu la page';
  const explanation = document.createElement('p');
  explanation.textContent = 'Les données locales ne sont pas supprimées. Voici l’erreur exacte à corriger :';
  const details = document.createElement('pre');
  details.textContent = message;
  const reload = document.createElement('button');
  reload.type = 'button';
  reload.className = 'secondary-button';
  reload.textContent = 'Recharger le Manager';
  reload.addEventListener('click', () => window.location.reload());
  card.append(eyebrow, title, explanation, details, reload);
  shell.append(card);
  rendererRoot.append(shell);
}

window.addEventListener('error', (event) => {
  showRendererFailure(event.error ?? event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  showRendererFailure(event.reason);
});

createRoot(rendererRoot, {
  onUncaughtError: (error) => showRendererFailure(error),
}).render(
  <StrictMode>
    {window.atoumwebOperationalRecipe ? <OperationalRecipePage /> : <App />}
  </StrictMode>,
);
