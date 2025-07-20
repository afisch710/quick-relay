// src/App.js
import React from 'react';
import HomePage from './pages/HomePage';
import DeviceProvider from './context/DeviceProvider';
import { BrowserRouter } from 'react-router-dom';
import ConnectionProvider from './context/ConnectionProvider';
import DynamicTheme from './theme/DynamicTheme';
import StorageProvider from './context/StorageProvider';
import OnboardingProvider from './context/OnboardingProvider';
import SharingProvider from './context/SharingProvider';
import ModalProvider from './context/ModalProvider';
import SettingsProvider from './context/SettingsProvider';
import DownloadProvider from './context/DownloadProvider';
import PreviewProvider from './context/PreviewProvider';
import AnalyticsProvider from './context/AnalyticsProvider';
import GoogleAnalytics from './components/common/GoogleAnalytics';

function App() {
  return (
    <BrowserRouter>
      <DeviceProvider>
        <DownloadProvider>
          <StorageProvider>
            <DynamicTheme>
              <ModalProvider>
                <SettingsProvider>
                  <PreviewProvider>
                    <AnalyticsProvider>
                      <ConnectionProvider>
                        <OnboardingProvider>
                          <SharingProvider>
                            <GoogleAnalytics />
                            <HomePage />
                          </SharingProvider>
                        </OnboardingProvider>
                      </ConnectionProvider>
                    </AnalyticsProvider>
                  </PreviewProvider>
                </SettingsProvider>
              </ModalProvider>
            </DynamicTheme>
          </StorageProvider>
        </DownloadProvider>
      </DeviceProvider>
    </BrowserRouter>
  );
}

export default React.memo(App);