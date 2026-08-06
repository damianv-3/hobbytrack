import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { PreferenceProvider } from './context/PreferenceContext.jsx';
import { DataRefreshProvider } from './context/DataRefreshContext.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PreferenceProvider>
          <DataRefreshProvider>
            <App />
          </DataRefreshProvider>
        </PreferenceProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);