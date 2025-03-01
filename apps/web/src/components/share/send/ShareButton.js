// ShareButton.js
import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import { keyframes } from '@mui/system';

const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const ShareButton = ({ icon: IconComponent, label, onClick, color, variant }) => {
    const theme = useTheme();
    const [rotating, setRotating] = useState(false);

    const handleClick = useCallback((event) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.blur(); // remove focus
        // Trigger the rotation effect
        setRotating(true);
        onClick(event);
        // Reset the rotation state after the animation duration (0.5s)
        setTimeout(() => {
            setRotating(false);
        }, 500);
    }, [onClick]);

    const isReveal = useMemo(() => variant === 'reveal', [variant]);

    return (
        <Box
            display="flex"
            alignItems="center"
            sx={{
                minWidth: isReveal ? '40px' : 'auto',
                maxWidth: isReveal ? '40px' : 'none',
                height: '40px',
                overflow: 'hidden',
                borderRadius: '20px',
                bgcolor: theme.palette.background.secondary,
                boxShadow: 2,
                cursor: 'pointer',
                transition: isReveal
                    ? 'max-width 0.3s ease, padding 0.3s ease, transform 0.1s ease'
                    : 'transform 0.1s ease',
                '&:active': {
                    transform: 'scale(0.95)',
                },
                '&:hover': isReveal
                    ? {
                        maxWidth: '300px',
                        paddingLeft: 1,
                        paddingRight: 1,
                        '& .label': {
                            opacity: 1,
                        },
                    }
                    : {},
            }}
            onClick={handleClick}
            onTouchEnd={handleClick}
        >
            <IconButton
                sx={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    color: color || theme.palette.text.primary,
                }}
                disableRipple
            >
                <IconComponent
                    sx={{
                        // Apply the rotation animation when rotating is true
                        animation: rotating ? `${rotate360} 0.5s ease-in-out` : 'none',
                    }}
                />
            </IconButton>
            <Box display="flex" justifyContent={variant === 'reveal' ? 'center' : 'flex-start'} flexGrow={1}>
                <Typography
                    variant="body2"
                    className="label"
                    sx={{
                        ml: 1,
                        mr: 2,
                        whiteSpace: 'nowrap',
                        transition: 'opacity 0.3s ease',
                        opacity: isReveal ? 0 : 1,
                        color: theme.palette.text.primary,
                    }}
                >
                    {label}
                </Typography>
            </Box>
        </Box>
    );
};

ShareButton.propTypes = {
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    color: PropTypes.string,
    variant: PropTypes.oneOf(['reveal', 'normal']),
};

ShareButton.defaultProps = {
    onClick: () => { },
    color: null,
    variant: 'reveal',
};

export default React.memo(ShareButton);