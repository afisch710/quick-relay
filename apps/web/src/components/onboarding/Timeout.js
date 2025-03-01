import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Button, useTheme } from '@mui/material';
import OnboardingPage from './OnboardingPage';
import { useDevice } from '../../context/DeviceProvider';
import TimeoutVisual from './TimeoutVisual';

const Timeout = ({ onContinue }) => {
    const theme = useTheme();
    const { isMobile } = useDevice();

    const handleContinue = useCallback(() => {
        onContinue();
    }, [onContinue]);

    return (
        <OnboardingPage
            title={'Still there?'}
            content={
                <Stack
                    width={'100%'}
                    height={'100%'}
                    direction={'column'}
                    justifyContent={'flex-start'}
                    alignItems={'center'} >
                    <Box
                        height={'100%'}
                        width={'80%'}
                        textAlign={'center'}>
                        <Typography variant={isMobile ? 'h5' : 'h6'} sx={{ color: 'text.primary', maxWidth: 650 }}>
                            Take your time! We're just checking.
                        </Typography>
                    </Box>
                    <TimeoutVisual />
                    <Button
                        autoFocus
                        variant="contained"
                        color="text.primary"
                        onClick={handleContinue}
                        tabIndex={0}
                        sx={{
                            bgcolor: theme.palette.background.accent,
                            fontSize: '16px',
                        }}
                    >
                        Yes
                    </Button>
                </Stack>
            } />
    );
};

Timeout.propTypes = {
    onContinue: PropTypes.func.isRequired,
}

export default React.memo(Timeout);