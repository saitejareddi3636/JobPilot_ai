import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ExtensionPopup } from '../src/components/extension/ExtensionPopup';
import '../src/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ExtensionPopup />
  </StrictMode>,
);
