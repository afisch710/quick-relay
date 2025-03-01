import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Snackbar,
    Stack,
    SwipeableDrawer,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useDevice } from '../context/DeviceProvider';
import ResponsiveModalDrawer from '../components/common/ResponsiveModalDrawer';
import { styled } from '@mui/system';
import ResponsiveIconButton from '../components/common/ResponsiveIconButton';
import { useModal } from '../context/ModalProvider';

export const StyledDrawer = styled(SwipeableDrawer)(({ theme }) => ({
    overflow: 'hidden',
    '& .MuiDrawer-paper': {
        border: 'none',
        outline: 'none',
        borderWidth: 0,
        backgroundColor: theme.palette.background.secondary,
        '&:focus': {
            outline: 'none',
            border: 'none',
        },
    },
}));

const SIDEBAR_WIDTH = 275;
const TOP_CONTENT_HEIGHT = 50;

const PageLayout = ({
    topLeftContent,
    topContent,
    topRightContent,
    sidebarContent,
    mainContent,
    toastMessage,
    onCloseToast,
}) => {
    const { isMobile } = useDevice();
    const { isModalOpen, modalContent, modalCanClose, modalOnClose, modalProps } = useModal();

    const [sidebarOpen, setSidebarOpen] = useState(!isMobile && !!sidebarContent);

    const toggleSidebar = () => {
        setSidebarOpen((prev) => !prev);
    };

    useEffect(() => {
        setSidebarOpen(!isMobile);
    }, [isMobile]);

    const topLeft = useMemo(() => {
        return (
            <Stack
                direction={'row'}
                left={0}
                width={sidebarOpen ? `${SIDEBAR_WIDTH}px` : '80px'}
                height={`${TOP_CONTENT_HEIGHT}px`}
                zIndex={1300}
                position={'relative'}
                justifyContent={'space-between'}
                alignItems={'center'}
                sx={{
                    transition: 'width 0.12s linear',
                }}
            >
                {/* Menu Icon: positioned absolutely on the left */}
                <ResponsiveIconButton
                    icon={MenuIcon}
                    onClick={() => toggleSidebar()}
                    tooltip={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                    sx={{
                        ml: 1,
                    }}
                />
                {/* Top left content: centered horizontally and vertically */}
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                    }}
                >
                    <Box pl={1} pr={4}>
                        {topLeftContent}
                    </Box>
                </Box>
            </Stack>
        );
    }, [sidebarOpen, topLeftContent])

    return (
        <Box sx={{ position: 'relative', height: '100%' }}>
            <Box
                height={'100%'}
                sx={{
                    // filter: modalOpen ? 'blur(5px)' : 'none',
                    filter: isModalOpen ? 'blur(5px)' : 'none',
                    transition: 'filter 0.3s ease',
                }}
            >
                <Stack
                    width={'100%'}
                    direction={'row'}
                    height={`${TOP_CONTENT_HEIGHT}px`}>
                    {
                        (!isMobile ||
                            (!sidebarOpen && isMobile)) &&
                        topLeft
                    }
                    <Stack
                        direction={'row'}
                        flexGrow={1}>
                        {
                            topContent &&
                            <Box
                                display={'flex'}
                                width={'100%'}
                                height={`${TOP_CONTENT_HEIGHT}px`}
                                justifyContent={'flex-start'}
                                ml={2}>
                                {topContent}
                            </Box>
                        }
                        <Box
                            mr={1}>
                            {topRightContent}
                        </Box>
                    </Stack>
                </Stack>
                {sidebarContent &&
                    (isMobile ? (
                        <StyledDrawer
                            disableAutoFocus
                            variant="temporary"
                            open={sidebarOpen}
                            onClose={toggleSidebar}
                            ModalProps={{
                                keepMounted: true,
                            }}
                        >
                            <Box
                                width={`${SIDEBAR_WIDTH}px`}
                                height={'100%'}
                                sx={{ overflowX: 'hidden' }}>
                                {topLeft}
                                {sidebarContent}
                            </Box>
                        </StyledDrawer>
                    ) : (
                        <StyledDrawer variant="persistent" open={sidebarOpen}>
                            <Box
                                width={`${SIDEBAR_WIDTH}px`}
                                height={'100%'}
                                pt={`${TOP_CONTENT_HEIGHT}px`}
                                sx={{ overflowX: 'hidden' }}>
                                {sidebarContent}
                            </Box>
                        </StyledDrawer>
                    ))}
                {/* Main Content */}
                <Box
                    height={'100%'}
                    sx={{
                        ml: !isMobile && sidebarOpen ? `${SIDEBAR_WIDTH}px` : 0,
                        transition: 'margin 0.12s linear',
                    }}
                >
                    {mainContent}
                </Box>
            </Box>

            <Snackbar
                open={Boolean(toastMessage)}
                onClose={onCloseToast}
                message={toastMessage}
                autoHideDuration={3000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            />

            <ResponsiveModalDrawer
                open={isModalOpen}
                onClose={modalOnClose}
                canClose={modalCanClose}
                modalProps={modalProps}
            >
                {modalContent}
            </ResponsiveModalDrawer>
        </Box>
    );
};

PageLayout.propTypes = {
    topLeftContent: PropTypes.node,
    topContent: PropTypes.node,
    topRightContent: PropTypes.node,
    sidebarContent: PropTypes.node,
    mainContent: PropTypes.node,
    toastMessage: PropTypes.string,
    onCloseToast: PropTypes.func,
};

PageLayout.defaultProps = {
    topLeftContent: null,
    topContent: null,
    topRightContent: null,
    sidebarContent: null,
    mainContent: null,
    toastMessage: '',
    onCloseToast: () => { },
};

export default React.memo(PageLayout);