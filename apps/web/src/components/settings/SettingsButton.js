import React from 'react';
import { Box, useTheme } from '@mui/material';
import ResponsiveIconButton from '../common/ResponsiveIconButton';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import { useSettings } from '../../context/SettingsProvider';

const SettingsButton = () => {
    const { showSettings } = useSettings();
    const theme = useTheme();

    return (
        <Box
            height={'100%'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}>
            <ResponsiveIconButton
                icon={SettingsIcon}
                tooltip="Settings"
                color={theme.palette.text.secondary}
                onClick={() => showSettings()}
            />
        </Box>
    );
};

export default React.memo(SettingsButton);