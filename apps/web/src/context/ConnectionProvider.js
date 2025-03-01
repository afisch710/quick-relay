// src/context/ConnectionProvider.js
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import messagingService from '../services/messagingService';

const ConnectionContext = createContext({
    isInitialized: false,
    isConnected: false,
    signalingChannelState: {
        closed: true,
        intentional: true, // intentionally closed at start
    },
    connect: async () => { },
    disconnect: async () => { },
});

const ConnectionProvider = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [signalingChannelState, setSignalingChannelState] = useState({
        closed: true,
        intentional: true, // intentionally closed at start
    });

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
            setSignalingChannelState({
                closed: false,
                intentional: false, // irrelevant in non-closed state
            })
        }
        const handleConnected = () => setIsConnected(true);
        const handleDisconnected = () => setIsConnected(false);
        const handleSignalingChannelClosed = (intentional) => {
            setSignalingChannelState({
                closed: true,
                intentional: intentional,
            });
        };

        messagingService.onInitialized(handleInitialized);
        messagingService.onConnected(handleConnected);
        messagingService.onDisconnected(handleDisconnected);
        messagingService.onSignalingChannelClosed(handleSignalingChannelClosed);

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
    const value = useMemo(() => ({ isInitialized, isConnected, signalingChannelState, connect, disconnect }), [isInitialized, isConnected, signalingChannelState, connect, disconnect]);

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

export default React.memo(ConnectionProvider);
