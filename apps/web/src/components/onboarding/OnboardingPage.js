import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography } from '@mui/material';
import { useSpring, animated } from '@react-spring/web';

const OnboardingPage = ({ title, content, footer }) => {
    // Keep the currently displayed title in state.
    const [displayedTitle, setDisplayedTitle] = useState(title);

    // useSpring hook for opacity animation.
    const [springProps, api] = useSpring(() => ({
        opacity: 1,
        config: { duration: 300 },
    }));

    // A ref to hold the latest (pending) title.
    const pendingTitle = useRef(title);
    // A flag to indicate if an animation cycle is in progress.
    const isAnimating = useRef(false);

    // Function to trigger the fade-out then fade-in sequence.
    const animateTitle = useCallback(() => {
        isAnimating.current = true;
        // Fade out current title.
        api.start({
            opacity: 0,
            onRest: () => {
                // Update the displayed title to the latest pending value.
                // Use the updater callback to ensure we capture the new value.
                setDisplayedTitle(() => {
                    const newTitle = pendingTitle.current;
                    // After updating, fade in.
                    api.start({
                        opacity: 1,
                        onRest: () => {
                            // Animation cycle complete.
                            isAnimating.current = false;
                            // If the pending title has changed during the animation, trigger another cycle.
                            if (pendingTitle.current !== newTitle) {
                                animateTitle();
                            }
                        },
                    });
                    return newTitle;
                });
            },
        });
    }, [api]);

    useEffect(() => {
        if (title !== displayedTitle) {
            pendingTitle.current = title;
            if (!isAnimating.current) {
                animateTitle();
            }
        }
        // We only need to run this effect when the incoming title changes.
    }, [title, displayedTitle, animateTitle]);

    const renderTitle = () => {
        if (React.isValidElement(displayedTitle)) {
            return displayedTitle;
        }
        return (
            <Typography
                variant="h4"
                sx={{ fontWeight: 'bold', maxWidth: 600, textAlign: 'center' }}
            >
                {displayedTitle}
            </Typography>
        );
    };

    return (
        <Stack direction="column" width="100%" height="100%" display="flex" gap={2}>
            {displayedTitle && (
                <Box
                    width="100%"
                    height="100px"
                    display="flex"
                    flexGrow={1}
                    justifyContent="center"
                    alignItems="center"
                    position="relative"
                >
                    <animated.div style={springProps}>{renderTitle()}</animated.div>
                </Box>
            )}
            <Box
                width="100%"
                height="100%"
                display="flex"
                justifyContent="center"
                alignItems="center"
            >
                {content}
            </Box>
            <Box
                width="100%"
                height="100px"
                display="flex"
                flexDirection="column"
                justifyContent="flex-end"
                alignItems="center"
            >
                {footer}
            </Box>
        </Stack>
    );
};

OnboardingPage.propTypes = {
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    content: PropTypes.element,
    footer: PropTypes.element,
};

export default OnboardingPage;