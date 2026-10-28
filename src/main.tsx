import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource/dm-serif-display/latin-400.css';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/themes.css';
import './styles/base.css';
import { App } from './app/App';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
