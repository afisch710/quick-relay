// Settings.js
import React from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import ThemeSetting from './ThemeSetting';
import AutoDownloadSetting from './AutoDownloadSetting';
import AnalyticsSetting from './AnalyticsSetting';

const Settings = () => {
    const theme = useTheme();

    return (
        <Stack
            direction="column"
            width="100%"
            height="100%"
            display="flex"
            alignItems="center"
        >
            <Box
                width="100%"
                display="flex"
                justifyContent="center"
                p={2}
                borderBottom={`1px solid ${theme.palette.text.secondary}`}
            >
                <Box width="95%" display="flex" alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Settings
                    </Typography>
                </Box>
            </Box>
            <Stack direction="column" width="95%" height="100%" mt={2} gap={1}>
                <ThemeSetting />
                <AutoDownloadSetting />
                <AnalyticsSetting />
            </Stack>
        </Stack>
    );
};

export default React.memo(Settings);