// src/App.js
import React from 'react';
import HomePage from './pages/HomePage';
import DeviceProvider from './context/DeviceProvider';
import { BrowserRouter } from 'react-router-dom';
import { ConnectionProvider } from './context/ConnectionProvider';
import DynamicTheme from './theme/DynamicTheme';
import StorageProvider from './context/StorageProvider';
import OnboardingProvider from './context/OnboardingProvider';

function App() {
  return (
    <DeviceProvider>
      <StorageProvider>
        <ConnectionProvider>
          <DynamicTheme>
            <OnboardingProvider>
              <BrowserRouter>
                <HomePage />
              </BrowserRouter>
            </OnboardingProvider>
          </DynamicTheme>
        </ConnectionProvider>
      </StorageProvider>
    </DeviceProvider>
  );
}

export default App;