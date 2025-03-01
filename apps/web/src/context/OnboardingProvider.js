import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useStorage } from './StorageProvider';
import { useConnection } from './ConnectionProvider';
import { StorageKey } from '../utility/StorageKey';
import { Feature } from '../utility/Feature';
import Onboarding from '../components/onboarding/Onboarding';
import { useModal } from './ModalProvider';


const OnboardingContext = createContext({
    showValueProp: true,
    updateShowValueProp: () => { },
});

export const OnboardingProvider = ({ children }) => {
    const { isConnected } = useConnection();
    const { getItem, setItem } = useStorage();
    const { showModal, dismissModal } = useModal();
    const [showValueProp, setShowValueProp] = useState(true);
    const [sessionToJoin, setSessionToJoin] = useState(null);
    const [joinRequested, setJoinRequested] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const sessionParam = searchParams.get('session');
        if (location.pathname === '/join' && sessionParam && /^\d{6}$/.test(sessionParam)) {
            // Join an existing session
            setSessionToJoin(sessionParam);
        } else if (location.pathname === '/join') {
            setJoinRequested(true);
        }
        if (location.pathname !== '/') {
            navigate('/');
        }
    }, [location, searchParams, navigate]);

    useEffect(() => {
        if (!isConnected) {
            const content = <Onboarding sessionToJoin={sessionToJoin} joinRequested={joinRequested} />
            const canOnboardingModalClose = false; // User cannot close modal themselves
            const onClose = () => {};
            const modalProps = {
                mobileHeight: '60dvh',
                width: '700px',
                height: '350px',
            };
            showModal(content, canOnboardingModalClose, onClose, modalProps);
        } else {
            dismissModal();
            // clear now setup session
            setSessionToJoin('');
            setJoinRequested(false);
        }
    }, [isConnected, joinRequested, sessionToJoin, showModal, dismissModal]);

    const showValuePropKey = useMemo(() => {
        return new StorageKey(Feature.onboarding, 'showValueProp');
    }, []);

    const updateShowValueProp = useCallback((show) => {
        setItem(showValuePropKey, show);
    }, [setItem, showValuePropKey]);

    useEffect(() => {
        setShowValueProp(getItem(showValuePropKey) ?? true);
    }, [setShowValueProp, getItem, showValuePropKey]);

    const value = useMemo(() => {
        return (
            {
                showValueProp,
                updateShowValueProp
            }
        );
    }, [showValueProp, updateShowValueProp]);

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

export default React.memo(OnboardingProvider);