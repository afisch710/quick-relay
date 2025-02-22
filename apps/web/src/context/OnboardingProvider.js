import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useStorage } from './StorageProvider';
import { StorageKey } from '../utility/StorageKey';
import { Feature } from '../utility/Feature';

const OnboardingContext = createContext({
    showValueProp: true,
    updateShowValueProp: (show) => { },
});

export const OnboardingProvider = ({ children }) => {
    const { getItem, setItem } = useStorage();

    const [showValueProp, setShowValueProp] = useState(true);

    const showValuePropKey = useMemo(() => {
        return new StorageKey(Feature.onboarding, 'showValueProp');
    }, []);

    const updateShowValueProp = (show) => {
        setItem(showValuePropKey, show);
    };

    useEffect(() => {
        setShowValueProp(getItem(showValuePropKey) ?? true);
    }, [setShowValueProp, getItem, showValuePropKey]);

    const value = {
        showValueProp,
        updateShowValueProp
    };

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    );
};

OnboardingProvider.propTypes = {
    children: PropTypes.node,
};

export const useOnboarding = () => useContext(OnboardingContext);

export default OnboardingProvider;