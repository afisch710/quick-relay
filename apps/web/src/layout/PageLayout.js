// src/layout/PageLayout.js
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Drawer, Snackbar, IconButton, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useDevice } from '../context/DeviceProvider';
import ResponsiveModalDrawer from '../components/common/ResponsiveModalDrawer';

const SIDEBAR_WIDTH = 275;

const PageLayout = ({
    sidebarContent,
    mainContent,
    toastMessage,
    onCloseToast,
    modalOpen,
    modalContent,
    modalOnClose,
    modalCanClose,
}) => {
    const theme = useTheme();
    const { isMobile } = useDevice();
    // On mobile, sidebar defaults closed; on desktop, default open.
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    useEffect(() => {
        // Reset sidebar if the device size changes (for some reason)
        setSidebarOpen(!isMobile)
    }, [isMobile])

    return (
        <Box sx={{ position: 'relative', height: '100d%' }}>
            <Box
                height={'100%'}
                sx={{
                    filter: modalOpen ? 'blur(5px)' : 'none',
                    transition: 'filter 0.3s ease',
                }}
            >
                {/* Toggle Button: fixed at top left so it doesn’t move */}
                <Box
                    sx={{
                        position: 'fixed',
                        top: 10,
                        left: 10,
                        zIndex: 1300,
                    }}
                >
                    <IconButton onClick={toggleSidebar} disabled={modalOpen} sx={{ color: theme.palette.text.primary}}>
                        <MenuIcon />
                    </IconButton>
                </Box>

                {/* Sidebar */}
                {isMobile ? (
                    // Mobile: use temporary overlay Drawer.
                    <Drawer
                        variant="temporary"
                        open={sidebarOpen}
                        onClose={toggleSidebar}
                        ModalProps={{ keepMounted: true }} // improves performance on mobile.
                    >
                        {sidebarContent}
                    </Drawer>
                ) : (
                    // Desktop: use persistent Drawer that shifts the main content.
                    <Drawer
                        variant="persistent"
                        open={sidebarOpen}
                        sx={{
                            '& .MuiDrawer-paper': {
                                width: SIDEBAR_WIDTH,
                                boxSizing: 'border-box',
                                color: 'transparent',
                            },
                        }}
                    >
                        {sidebarContent}
                    </Drawer>
                )}

                {/* Main Content */}
                <Box
                    height={'100dvh'}
                    // width={'100%'}
                    sx={{
                        ml: !isMobile && sidebarOpen ? `${SIDEBAR_WIDTH}px` : 0,
                        transition: 'margin 0.3s ease',
                    }}
                >
                    {mainContent}
                </Box>
            </Box>

            {/* Toast for transient messages */}
            <Snackbar
                open={Boolean(toastMessage)}
                onClose={onCloseToast}
                message={toastMessage}
                autoHideDuration={3000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            />

            {/* Modal rendered outside the rest */}
            <ResponsiveModalDrawer
                open={modalOpen}
                onClose={modalOnClose}
                canClose={modalCanClose}
            >
                {modalContent}
            </ResponsiveModalDrawer>
        </Box>
    );
};

PageLayout.propTypes = {
    sidebarContent: PropTypes.node,
    mainContent: PropTypes.node,
    toastMessage: PropTypes.string,
    onCloseToast: PropTypes.func,
    modalOpen: PropTypes.bool,
    modalContent: PropTypes.node,
    modalOnClose: PropTypes.func,
    modalCanClose: PropTypes.bool,
};

PageLayout.defaultProps = {
    sidebarContent: null,
    mainContent: null,
    toastMessage: '',
    onCloseToast: () => { },
    modalOpen: false,
    modalContent: null,
    modalOnClose: () => { },
    modalCanClose: true,
};

export default PageLayout;