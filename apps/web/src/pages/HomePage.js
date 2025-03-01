// src/pages/HomePage.js
import React, { useMemo } from 'react';
import { alpha, Box, Typography, useTheme } from '@mui/material';
import PageLayout from '../layout/PageLayout';
import Share from '../components/share/Share';
import Connectivity from '../components/share/Connectivity';
import SentFiles from '../components/share/send/SentFiles';
import SettingsButton from '../components/settings/SettingsButton';


const HomePage = () => {
    const theme = useTheme();

    const topLeftContent = useMemo(() => {
        return (
            <Box
                width={'100%'}>
                <Connectivity />
            </Box>
        )
    }, []);

    const topContent = useMemo(() => {
        return (
            <Box
                display={'flex'}
                height={'100%'}
                alignItems={'center'}>
                <Typography
                    variant="h5"
                    color={alpha(theme.palette.text.accent, 0.5)}
                    sx={{
                        fontWeight: 900,
                        textShadow: `0 0 3px ${theme.palette.text.accent}`,
                    }}
                >
                    Pourtle
                </Typography>
            </Box>
        )
    }, [theme.palette.text.accent]);

    const topRightContent = useMemo(() => {
        return (
            <SettingsButton />
        )
    }, [])

    // Sidebar content.
    const sidebarContent = useMemo(() => {
        return (
            <Box
                height="100%"
                textAlign={'center'}>
                <SentFiles />
            </Box>
        )
    }, []);

    // Main content: a simple message.
    const mainContent = useMemo(() => {
        return (
            <Box bgcolor={theme.palette.background.primary} height={'100%'} sx={{ textAlign: 'center' }}>
                <Share />
            </Box>
        )
    }, [theme.palette.background.primary]);

    return (
        <Box height={'100dvh'} width={'100%'} position={'fixed'}>
            <PageLayout
                topLeftContent={topLeftContent}
                topContent={topContent}
                topRightContent={topRightContent}
                sidebarContent={sidebarContent}
                mainContent={mainContent}
                sidebarCollapsed={false}
                toastMessage={''}
                onCloseToast={() => { }}
            />
        </Box>
    );
};

export default React.memo(HomePage);