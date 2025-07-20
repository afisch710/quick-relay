import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AnalyticsContext = createContext();

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

const ANALYTICS_STORAGE_KEY = 'pourtle_analytics_consent';

const AnalyticsProvider = ({ children }) => {
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(true); // Default enabled
  const [hasUserMadeChoice, setHasUserMadeChoice] = useState(false);

  useEffect(() => {
    // Load user's previous choice from localStorage
    const savedConsent = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (savedConsent !== null) {
      const consent = JSON.parse(savedConsent);
      setIsAnalyticsEnabled(consent.enabled);
      setHasUserMadeChoice(true);
    }
  }, []);

  const setAnalyticsEnabled = (enabled) => {
    setIsAnalyticsEnabled(enabled);
    setHasUserMadeChoice(true);
    
    // Save to localStorage
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify({
      enabled,
      timestamp: new Date().toISOString(),
    }));

    // If user opts out, clear existing Google Analytics data
    if (!enabled && window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
      });
    }
  };

  const trackEvent = (eventName, parameters = {}) => {
    if (!isAnalyticsEnabled || !window.gtag) return;
    
    window.gtag('event', eventName, parameters);
  };

  const trackPageView = (pagePath, pageTitle) => {
    if (!isAnalyticsEnabled || !window.gtag) return;
    
    // eslint-disable-next-line no-undef
    window.gtag('config', process.env.REACT_APP_GA_ID, {
      page_path: pagePath,
      page_title: pageTitle,
    });
  };

  const value = {
    isAnalyticsEnabled,
    hasUserMadeChoice,
    setAnalyticsEnabled,
    trackEvent,
    trackPageView,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

AnalyticsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AnalyticsProvider; 