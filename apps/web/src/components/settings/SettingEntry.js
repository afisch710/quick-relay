// SettingEntry.js
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Divider } from '@mui/material';

const SettingEntry = ({ label, children, divider = true }) => {
    return (
        <Box>
            <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                height="50px"
            >
                <Typography variant="subtitle2">{label}</Typography>
                {children}
            </Box>
            {divider && <Divider />}
        </Box>
    );
};

SettingEntry.propTypes = {
    label: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    divider: PropTypes.bool,
};

export default React.memo(SettingEntry);