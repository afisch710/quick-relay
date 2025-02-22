// src/context/ConnectionProvider.js
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import messagingService from '../services/messagingService';

const ConnectionContext = createContext({
    isInitialized: false,
    isConnected: false,
    connect: async (sessionCode) => { },
    disconnect: async () => { },
});

export const ConnectionProvider = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Wrap connect in useCallback so its identity doesn't change unless dependencies change.
    const connect = useCallback(async (sessionCode = null) => {
        try {
            const code = await messagingService.connect(sessionCode);
            return code;
        } catch (error) {
            console.error('Error connecting:', error);
            setIsConnected(false);
            return null;
        }
    }, []);

    // Wrap disconnect in useCallback as well.
    const disconnect = useCallback(async () => {
        try {
            await messagingService.disconnect();
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
        setIsConnected(false);
    }, []);

    useEffect(() => {
        const handleInitialized = () => {
            setIsInitialized(true);
        }
        const handleConnected = () => setIsConnected(true);
        const handleDisconnected = () => setIsConnected(false);

        messagingService.onInitialized(handleInitialized);
        messagingService.onConnected(handleConnected);
        messagingService.onDisconnected(handleDisconnected);

        return () => {
            if (messagingService.offConnected) {
                messagingService.offConnected(handleConnected);
            }
            if (messagingService.offDisconnected) {
                messagingService.offDisconnected(handleDisconnected);
            }
        };
    }, []);

    // Memoize the context value so that it's only recomputed when status, connect, or disconnect change.
    const value = useMemo(() => ({ isInitialized, isConnected, connect, disconnect }), [isInitialized, isConnected, connect, disconnect]);

    return (
        <ConnectionContext.Provider value={value}>
            {children}
        </ConnectionContext.Provider>
    );
};

ConnectionProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useConnection = () => useContext(ConnectionContext);

export default ConnectionContext;