import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Button, Checkbox, useTheme } from '@mui/material';
import { useOnboarding } from '../../context/OnboardingProvider';
import OnboardingPage from './OnboardingPage';
import { useDevice } from '../../context/DeviceProvider';
import ValuePropVisual from './ValuePropVisual';

const ValueProp = ({ onGetStarted }) => {
    const theme = useTheme();
    const { isMobile } = useDevice();
    const { updateShowValueProp } = useOnboarding();
    const [checked, setChecked] = useState(false);

    const handleCheckboxChange = useCallback((event) => {
        setChecked(event.target.checked);
    }, [setChecked]);

    const handleGetStarted = useCallback(() => {
        updateShowValueProp(!checked);
        onGetStarted();
    }, [checked, onGetStarted, updateShowValueProp]);

    return (
        <OnboardingPage
            title={'Share content between devices'}
            content={
                <Stack
                    width={'100%'}
                    height={'100%'}
                    direction={'column'}
                    justifyContent={'flex-start'}
                    alignItems={'center'}
                    spacing={4} >
                    <ValuePropVisual />
                    <Box
                        height={'100%'}
                        width={'80%'}
                        textAlign={'center'}>
                        <Typography variant={isMobile ? 'h5' : 'h6'} sx={{ color: 'text.primary', maxWidth: 650 }}>
                            Instantly and securely share your photos, files, and more direclty between your devices.
                            Just connect them and hit send.
                        </Typography>
                    </Box>
                    <Box pt={0}>
                        <Button
                            autoFocus
                            variant="contained"
                            color="text.primary"
                            onClick={handleGetStarted}
                            tabIndex={0}
                            sx={{
                                bgcolor: theme.palette.background.accent,
                                fontSize: '16px',
                            }}
                        >
                            Get Started
                        </Button>
                    </Box>
                </Stack>
            }
            footer={
                <Stack
                    direction={'row'}
                    width={'100%'}
                    justifyContent={'center'}
                    alignItems={'center'}>
                    <Checkbox
                        checked={checked}
                        onChange={handleCheckboxChange}
                        color={theme.palette.text.primary}
                    />
                    <Typography variant='body1'>Skip this page next time</Typography>
                </Stack>
            } />
    );
};

ValueProp.propTypes = {
    onGetStarted: PropTypes.func.isRequired,
}

export default React.memo(ValueProp);