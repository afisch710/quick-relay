import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

const DeviceContext = createContext({ isMobile: false });

export const DeviceProvider = ({ children }) => {
    // Set initial state based on window.innerWidth (if running in a browser)
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 600 : false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 600);
        };

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Memoize the context value to avoid unnecessary re-renders of consumers.
    const value = useMemo(() => ({ isMobile }), [isMobile]);

    return (
        <DeviceContext.Provider value={value}>
            {children}
        </DeviceContext.Provider>
    );
};

DeviceProvider.propTypes = {
    children: PropTypes.node,
};

export const useDevice = () => useContext(DeviceContext);

export default DeviceProvider;