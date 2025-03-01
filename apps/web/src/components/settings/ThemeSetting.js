// ThemeSetting.js
import React, { useState } from 'react';
import { Select, MenuItem, Typography, useTheme } from '@mui/material';
import SettingEntry from './SettingEntry';
import { useThemeUpdate } from '../../theme/DynamicTheme';

// Simple helper function to capitalize the first letter.
const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

const ThemeSetting = () => {
    const theme = useTheme();
    const { setThemeName } = useThemeUpdate();

    // Initialize state from theme.name, capitalized.
    const [themeMode, setThemeMode] = useState(capitalize(theme.name));

    const handleThemeChange = (event) => {
        const newValue = event.target.value; // "Light", "Dark", or "System"
        setThemeMode(newValue);
        // Update the theme provider with the lowercase version.
        setThemeName(newValue.toLowerCase());
    };

    return (
        <SettingEntry label="Theme">
            <Select
                value={themeMode}
                onChange={handleThemeChange}
                variant="standard"
                sx={{
                    width: '150px',
                    '& .MuiSelect-icon': {
                        color: theme.palette.text.primary,
                    },
                }}
                renderValue={(selected) => (
                    <Typography variant="caption">{selected}</Typography>
                )}
                MenuProps={{
                    slotProps: {
                        paper: {
                            sx: {
                                width: '150px',
                                backgroundColor: theme.palette.background.tertiary,
                                borderRadius: '8px',
                                border: `1px solid ${theme.palette.text.secondary}`,
                            },
                        },
                    },
                }}
            >
                <MenuItem value="System"><Typography variant='caption'>System</Typography></MenuItem>
                <MenuItem value="Light"><Typography variant='caption'>Light</Typography></MenuItem>
                <MenuItem value="Dark"><Typography variant='caption'>Dark</Typography></MenuItem>
            </Select>
        </SettingEntry>
    );
};

export default React.memo(ThemeSetting);