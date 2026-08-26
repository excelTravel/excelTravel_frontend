import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import './lib/i18n';
import './styles/index.css';
import { App } from './App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { Providers } from './app/Providers';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Providers>
        <App />
      </Providers>
    </ErrorBoundary>
  </React.StrictMode>,
);
