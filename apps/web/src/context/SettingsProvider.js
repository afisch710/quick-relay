import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useStorage } from './StorageProvider';
import { StorageKey } from '../utility/StorageKey';
import { Feature } from '../utility/Feature';
import { useThemeUpdate } from '../theme/DynamicTheme';
import { useModal } from './ModalProvider';
import Settings from '../components/settings/Settings';
import ThemeName from '../theme/ThemeName';
import { useTheme } from '@emotion/react';

const SettingsContext = createContext({
    autoDownload: false,
    updateAutoDownload: () => { },
    theme: ThemeName.system,
    updateTheme: () => { },
    showSettings: () => { },
});

export const SettingsProvider = ({ children }) => {
    const theme = useTheme();
    const { setThemeName } = useThemeUpdate();
    const { showModal } = useModal();
    const { getItem, setItem } = useStorage();

    // Auto Download settnig
    const autoDownloadKey = useMemo(() => {
        return new StorageKey(Feature.sharing, 'autoDownload');
    }, []);

    const [autoDownload, setAutoDownload] = useState(getItem(autoDownloadKey) ?? false);

    const updateAutoDownload = useCallback((auto) => {
        setItem(autoDownloadKey, auto);
        setAutoDownload(auto);
    }, [autoDownloadKey, setItem]);

    useEffect(() => {
        setAutoDownload(getItem(autoDownloadKey) ?? false);
    }, [setAutoDownload, getItem, autoDownloadKey]);

    // Theme setting
    const updateTheme = useCallback((theme) => {
        setThemeName(theme);
    }, [setThemeName]);

    // Settings UX
    const showSettings = useCallback(() => {
        const settings = <Settings />
        const canClose = true;
        const onClose = () => { };
        const modalProps = {
            mobileHeight: '60dvh',
            width: '700px',
            height: '350px',
        };
        showModal(settings, canClose, onClose, modalProps);
    }, [showModal]);

    const value = useMemo(() => {
        return (
            {
                autoDownload,
                updateAutoDownload,
                theme,
                updateTheme,
                showSettings,
            }
        );
    }, [autoDownload, updateAutoDownload, theme, updateTheme, showSettings]);


    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

SettingsProvider.propTypes = {
    children: PropTypes.node,
};

export const useSettings = () => useContext(SettingsContext);

export default React.memo(SettingsProvider);