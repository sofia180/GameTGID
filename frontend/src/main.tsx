import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={import.meta.env.VITE_TON_MANIFEST_URL}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>
);
