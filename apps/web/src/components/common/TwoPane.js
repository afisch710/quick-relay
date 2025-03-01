import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { alpha, Box, Stack, useTheme } from '@mui/material';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SwipeableViews from 'react-swipeable-views';

export const TwoPaneMode = Object.freeze({
    normal: 'normal',
    pivot: 'pivot',
});

/**
 * TwoPane component.
 *
 * Props:
 * - pane1: React element for pane 1.
 * - pane2: React element for pane 2.
 * - pane1Title: Title for pane1 (used in pivot mode for the switch button).
 * - pane2Title: Title for pane2.
 * - defaultPane: number (1 or 2) for which pane to show first in pivot mode.
 * - mode: either 'normal' (both panes visible) or 'pivot' (only one visible with swipe and buttons).
 * - sx: additional style.
 */
const TwoPane = ({
    pane1,
    pane2,
    pane1Title,
    pane2Title,
    defaultPane = 1,
    mode = 'normal',
    sx = {},
}) => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(defaultPane === 1 ? 0 : 1);

    // For Tabs onChange: receives event and newValue.
    const handleTabsChange = useCallback((event, newValue) => {
        setActiveTab(newValue);
    }, []);

    // For SwipeableViews onChangeIndex: receives index.
    const handleSwipeableChange = useCallback((index) => {
        setActiveTab(index);
    }, []);

    if (mode === TwoPaneMode.normal) {
        // In normal mode, render both panes in a Stack.
        return (
            <Stack
                height="100%"
                width="100%"
                overflow="hidden"
                direction="row"
                sx={{ ...sx }}
            >
                <Box sx={{ flex: 1 }}>{pane1}</Box>
                <Box
                    sx={{
                        flex: 1,
                        borderLeft: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
                    }}
                >
                    {pane2}
                </Box>
            </Stack>
        );
    } else if (mode === TwoPaneMode.pivot) {
        return (
            <Stack width="100%" height="100%" overflow="hidden" gap={8} sx={{ ...sx }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabsChange}
                    centered
                    indicatorColor='secondary'
                    textColor={theme.palette.text.primary}
                >
                    <Tab label={pane1Title} sx={{ fontSize: 18 }} />
                    <Tab label={pane2Title} sx={{ fontSize: 18 }} />
                </Tabs>
                <SwipeableViews
                    index={activeTab}
                    onChangeIndex={handleSwipeableChange}
                    style={{ height: '100%' }}
                >
                    <Box height="100%" width="100%">
                        {pane1}
                    </Box>
                    <Box height="100%" width="100%">
                        {pane2}
                    </Box>
                </SwipeableViews>
            </Stack>
        );
    }
};

TwoPane.propTypes = {
    pane1: PropTypes.element.isRequired,
    pane1Title: PropTypes.string.isRequired,
    pane2: PropTypes.element.isRequired,
    pane2Title: PropTypes.string.isRequired,
    defaultPane: PropTypes.number,
    mode: PropTypes.oneOf(['normal', 'pivot']),
    sx: PropTypes.object,
};

export default React.memo(TwoPane);