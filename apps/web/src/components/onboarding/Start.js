import React, { useCallback, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { QRCodeSVG } from 'qrcode.react';
import { Box, Link, Typography, CircularProgress, Stack, useTheme } from '@mui/material';
import TwoPane from '../common/TwoPane';
import SessionCodeInput from './SessionCodeInput';
import { useDevice } from '../../context/DeviceProvider';
import OnboardingPage from './OnboardingPage';

const Start = ({ sessionCode, isLocal = false, requestJoin }) => {
    const theme = useTheme();
    const { isMobile } = useDevice();
    const [copied, setCopied] = useState(false);

    const universalLinkUrl = useMemo(() => {
        return isLocal
            ? sessionCode
                ? `http://192.168.0.2:3000/join?session=${sessionCode}`
                : 'http://192.168.0.2:3000'
            : sessionCode
                ? `https://pourtle.com/join?session=${sessionCode}`
                : 'https://pourtle.com';
    }, [isLocal, sessionCode]);

    // Handler for copying the universal link.
    const handleCopyLink = useCallback(() => {
        navigator.clipboard
            .writeText(universalLinkUrl)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch((err) => console.error('Error copying text:', err));
    }, [universalLinkUrl]);

    return (
        <OnboardingPage
            content={
                <TwoPane
                    defaultPane={2}
                    mode={isMobile ? 'pivot' : 'normal'}
                    pane1Title={'QR'}
                    pane1={
                        <Stack
                            direction={'column'}
                            width={'100%'}
                            height={'100%'}
                            gap={2}
                            display={'flex'}
                            alignItems={'center'}
                        >
                            <Box
                                width={'100%'}
                                display={'flex'}
                                justifyContent={'center'}
                                sx={{ opacity: sessionCode ? 1 : 0 }}>
                                <Typography variant={isMobile ? 'h4' : 'h6'}>Scan with your other device:</Typography>
                            </Box>
                            {
                                sessionCode ?
                                    <Box
                                        // width={'100%'}
                                        height={'100%'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        // alignItems={'center'}
                                        sx={{ cursor: 'pointer' }}
                                        onClick={handleCopyLink}
                                    >
                                        <QRCodeSVG
                                            fgColor="#222"
                                            value={universalLinkUrl}
                                            style={{ width: 200, height: 200 }}
                                            tabIndex={0}
                                        />
                                    </Box>

                                    :
                                    <Box
                                        display="flex"
                                        justifyContent="center"
                                        alignItems="center"
                                        sx={{ width: '100%' }}
                                    >
                                        <CircularProgress size={100} />
                                    </Box>
                            }
                            {copied && (
                                <Typography variant="body2" color="success.main" mt={1}>
                                    Link copied!
                                </Typography>
                            )}
                        </Stack>
                    }
                    pane2Title={'Code'}
                    pane2={
                        < Stack
                            width={'100%'}
                            height={'100%'}
                            direction={'column'}
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                        >
                            <Stack
                                direction={'column'}
                                display={'flex'} width={'100%'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                gap={1}>
                                <Box
                                    width={'100%'}
                                    display={'flex'}
                                    justifyContent={'center'}
                                    alignItems={'center'}>
                                    <Typography variant={isMobile ? 'h4' : 'h6'}>In a browser go to:</Typography>
                                </Box>
                                <Box
                                    width={'100%'}
                                    display={'flex'}
                                    justifyContent={'center'}
                                    alignItems={'center'}>
                                    <Box
                                        bgcolor={theme.palette.background.secondary}
                                        mt={1}
                                        pt={1}
                                        pb={1}
                                        pl={2}
                                        pr={2}
                                        borderRadius={4}
                                    >
                                        <Typography variant={isMobile ? 'h4' : 'h5'} color='text.accent' >pourtle.com/join</Typography>
                                    </Box>
                                </Box>
                                <Box
                                    width={'100%'}
                                    display={'flex'}
                                    justifyContent={'center'}
                                    alignItems={'center'}
                                    mt={6}>
                                    <Typography variant={isMobile ? 'h4' : 'h6'}>Then enter this code:</Typography>
                                </Box>
                                <Box
                                    display={'flex'}
                                    justifyContent={'center'}
                                    alignItems={'center'}
                                    width={'100%'}
                                    mt={1}>
                                    <SessionCodeInput value={sessionCode} editable={false} hideEmtpy={true} inputSize={isMobile ? 30 : 35} />
                                </Box>
                            </Stack>
                        </Stack >
                    }
                />
            }
            footer={
                <Link
                    variant="button"
                    color="text.primary"
                    onClick={requestJoin}
                    tabIndex={1}
                    sx={{
                        fontSize: 14
                    }}>
                    Already have a code?
                </Link>
            } />
    )
};

Start.propTypes = {
    sessionCode: PropTypes.number,
    isLocal: PropTypes.bool,
    showValueProp: PropTypes.bool,
    requestJoin: PropTypes.func.isRequired,
};

export default React.memo(Start);