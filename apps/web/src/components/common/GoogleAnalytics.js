import { useEffect } from 'react';
import { useAnalytics } from '../../context/AnalyticsProvider';

const GoogleAnalytics = () => {
  const { isAnalyticsEnabled } = useAnalytics();
  const GA_TRACKING_ID = process.env.REACT_APP_GA_ID;

  useEffect(() => {
    // Only load analytics if user has consented and we have a tracking ID
    if (!isAnalyticsEnabled || !GA_TRACKING_ID) {
      return;
    }

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    
    gtag('js', new Date());
    gtag('config', GA_TRACKING_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });

    // Make gtag available globally for tracking
    window.gtag = gtag;

    return () => {
      // Cleanup on unmount
      const scripts = document.querySelectorAll(`script[src*="googletagmanager"]`);
      scripts.forEach(script => script.remove());
    };
  }, [isAnalyticsEnabled, GA_TRACKING_ID]);

  return null; // This component doesn't render anything
};

export default GoogleAnalytics; 