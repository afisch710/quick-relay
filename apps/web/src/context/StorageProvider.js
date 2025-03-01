import React, { createContext, useCallback, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

const StorageContext = createContext({
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
});

export const StorageProvider = ({ children }) => {
    // Helper: Check if localStorage is available
    const isLocalStorageAvailable = useCallback(() => {
        try {
            const testKey = '__storage_test__';
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }, []);

    const storageAvailable = useMemo(() => { return isLocalStorageAvailable() }, [isLocalStorageAvailable]);

    const getItem = useCallback((key) => {
        if (!storageAvailable) return null;
        try {
            const item = window.localStorage.getItem(key.toString());
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error reading localStorage key “${key}”:`, error);
            return null;
        }
    }, [storageAvailable]);

    const setItem = useCallback((key, value) => {
        if (!storageAvailable) return;
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error writing localStorage key “${key}”:`, error);
        }
    }, [storageAvailable]);

    const removeItem = useCallback((key) => {
        if (!storageAvailable) return;
        try {
            window.localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing localStorage key “${key}”:`, error);
        }
    }, [storageAvailable]);

    const value = useMemo(() => {
        return ({
            getItem,
            setItem,
            removeItem,
        });
    }, [getItem, setItem, removeItem])

    return (
        <StorageContext.Provider value={value}>
            {children}
        </StorageContext.Provider>
    );
};

StorageProvider.propTypes = {
    children: PropTypes.node,
};

export const useStorage = () => useContext(StorageContext);

export default React.memo(StorageProvider);