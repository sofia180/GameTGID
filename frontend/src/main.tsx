import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

const manifestUrl = import.meta.env.VITE_TON_MANIFEST_URL;
const tonEnabled = !!manifestUrl && import.meta.env.VITE_DISABLE_TON !== 'true';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {tonEnabled ? (
      <TonConnectUIProvider manifestUrl={manifestUrl!}>
        <App />
      </TonConnectUIProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
