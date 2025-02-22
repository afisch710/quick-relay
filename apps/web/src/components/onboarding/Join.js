import React, { useCallback, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Link, Stack, Typography } from '@mui/material';
import SessionCodeInput from './SessionCodeInput';
import { styled } from '@mui/material/styles';
import { useConnection } from '../../context/ConnectionProvider';
import OnboardingPage from './OnboardingPage';

const FlickerText = styled(Typography)(() => ({
    animation: 'flicker 1.5s ease-in-out infinite',
    '@keyframes flicker': {
        '0%': { opacity: 0.5 },
        '50%': { opacity: 1 },
        '100%': { opacity: 0.5 },
    },
}));

const Join = ({ sessionToJoin, requestStart }) => {
    const { isConnected, connect } = useConnection();
    const [connecting, setConnecting] = useState(false);
    const [sessionCode, setSessionCode] = useState(sessionToJoin ? sessionToJoin : '');
    const [error, setError] = useState(null);
    const sessionInputRef = useRef();

    const isValidCode = useCallback((code) => {
        return code && /^\d{6}$/.test(code);
    }, []);

    useEffect(() => {
        if (isValidCode(sessionCode)) {
            setConnecting(true);
            connect(sessionCode).then((result) => {
                if (!result) {
                    setConnecting(false);
                    setError('Unable to connect');
                }
            });
        }
    }, [connect, sessionCode, isValidCode]);

    useEffect(() => {
        if (!error) {
            // No error, do nothing
            return;
        }
        setTimeout(() => {
            setError(null);
            setSessionCode('');
            sessionInputRef.current.clear();
        }, 3000)
    }, [error]);

    useEffect(() => {
        if (isValidCode(sessionToJoin)) {
            setConnecting(true);
        }
    }, [sessionToJoin, isValidCode]);

    useEffect(() => {
        if (isConnected) {
            setConnecting(false);
        }
    }, [isConnected]);

    return (
        <OnboardingPage
            title={
                connecting ?
                    (
                        <FlickerText variant="h4" sx={{ fontWeight: 'bold', maxWidth: 600 }}>Connecting</FlickerText>
                    ) :
                    error ? error : 'Connect your device'
            }
            content={
                <Stack
                    direction={'column'}
                    display="flex"
                    width="100%"
                    height={'100%'}
                    overflow="hidden"
                    justifyContent="center"
                    alignItems="center"
                    textAlign={'center'}
                    gap={2}
                >
                    <SessionCodeInput
                        ref={sessionInputRef}
                        value={sessionToJoin?.toString() ?? ''}
                        editable={!sessionToJoin && !error}
                        hideEmpty={false}
                        inputSize={35}
                        onChange={(code) => setSessionCode(code)} />
                    <Box
                        width={'100%'}
                        display={'flex'}
                        textAlign={'center'}
                        justifyContent={'center'}
                        alignItems={'center'}
                        maxWidth={'75%'}>
                        <Typography variant='h6'>Enter the code as displayed on your other device. If you do not have a code yet, click the link below.</Typography>
                    </Box>
                </Stack>
            }
            footer={
                <Link
                    variant="button"
                    color="text.primary"
                    onClick={requestStart}
                    sx={{
                        fontSize: 14
                    }}>
                    Generate a new code
                </Link>
            } />
    );
};

Join.propTypes = {
    sessionCode: PropTypes.number.isRequired,
    sessionToJoin: PropTypes.number,
    requestStart: PropTypes.func.isRequired,
};

export default Join;