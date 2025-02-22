// src/pages/HomePage.js
import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import PageLayout from '../layout/PageLayout';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Onboarding from '../components/onboarding/Onboarding';
import { useConnection } from '../context/ConnectionProvider';

const HomePage = () => {
    const theme = useTheme();
    const connection = useConnection();
    const [isConnected, setIsConnected] = useState(connection.isConnected);
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

    // Modal is open when not connected.
    const modalOpen = !isConnected;

    const modalContent = useMemo(() => (
        <Onboarding sessionToJoin={sessionToJoin} joinRequested={joinRequested} />
    ), [sessionToJoin, joinRequested]);

    // Sidebar content.
    const sidebarContent = (
        <Box height="100dvh" bgcolor={theme.palette.background.secondary} sx={{ textAlign: 'center', py: 4, color: '#fff' }}>
            <Typography variant="body2" sx={{ px: 2 }}>
            </Typography>
        </Box>
    );

    // Main content: a simple message.
    const mainContent = (
        <Box bgcolor={theme.palette.background.primary} height={'100dvh'} sx={{ textAlign: 'center' }}>
            
        </Box>
    );

    // Register connection events only once.
    useEffect(() => {
        if (connection.isConnected) {
            console.log('RTC connection established');
            setIsConnected(true);

            // Clear session to join if there was one
            setSessionToJoin(null);
        } else if (!connection.isConnected) {
            console.log('RTC connection lost');
            setIsConnected(false);
        }
    }, [connection.isConnected]);

    return (
        <Box height={'100dvh'} width={'100%'} position={'fixed'}>
            <PageLayout
                sidebarContent={sidebarContent}
                mainContent={mainContent}
                sidebarCollapsed={false}
                toastMessage={''}
                onCloseToast={() => { }}
                modalOpen={modalOpen}
                modalContent={modalContent}
                modalOnClose={() => { }}
                modalCanClose={false}
            />
        </Box>
    );
};

export default React.memo(HomePage);