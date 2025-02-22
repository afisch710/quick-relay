import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { keyframes } from '@emotion/react';
import ReactDOM from 'react-dom';
import PhotoIcon from '@mui/icons-material/Photo';
import AssignmentIcon from '@mui/icons-material/Assignment'; // clipboard icon
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import DesktopWindowsIcon from '@mui/icons-material/Monitor';
import { useDevice } from '../../context/DeviceProvider';

const icons = [PhotoIcon, AssignmentIcon, InsertDriveFileIcon];

// Keyframes for left-to-right animation (from phone to PC)
const transferAnimationLtr = keyframes`
  0% {
    transform: translateX(0) translateY(0) rotate(0deg) scale(0.5);
    opacity: 0;
  }
  10% {
    transform: translateX(9vw) translateY(-1dvh) rotate(36deg) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateX(37vw) translateY(-4dvh) rotate(180deg) scale(2);
    opacity: 1;
  }
  90% {
    transform: translateX(65vw) translateY(-1dvh) rotate(324deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(74vw) translateY(0) rotate(360deg) scale(0.5);
    opacity: 0;
  }
`;

// Keyframes for right-to-left animation (from PC to phone)
const transferAnimationRtl = keyframes`
  0% {
    transform: translateX(0) translateY(0) rotate(0deg) scale(0.5);
    opacity: 0;
  }
  10% {
    transform: translateX(-9vw) translateY(-1dvh) rotate(-36deg) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateX(-37vw) translateY(-4dvh) rotate(-180deg) scale(2);
    opacity: 1;
  }
  90% {
    transform: translateX(-65vw) translateY(-1dvh) rotate(-324deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(-74vw) translateY(0) rotate(-360deg) scale(0.5);
    opacity: 0;
  }
`;

// Function to generate a random pastel color.
const randomPastelColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
};

// AnimatedIcon accepts a "direction" prop. For 'ltr', it starts near the phone icon.
// For 'rtl', it starts near the PC icon.
const AnimatedIcon = ({ IconComponent, onAnimationEnd, color, isMobile, direction }) => (
    <Box
        component="div"
        sx={{
            position: 'absolute',
            bottom: 0,
            ...(direction === 'ltr'
                ? { left: '10vw' } // start at phone icon for ltr
                : { right: '10vw' } // start at PC icon for rtl
            ),
            animation: `${direction === 'ltr' ? transferAnimationLtr : transferAnimationRtl
                } ${isMobile ? '4s' : '6s'} linear`,
        }}
        onAnimationEnd={onAnimationEnd}
    >
        <IconComponent fontSize="large" sx={{ color }} />
    </Box>
);

// OnboardingAnimation renders the phone and desktop icons, then spawns moving icons
// that either flow from phone to PC (ltr) or from PC to phone (rtl).
const OnboardingAnimation = ({ position }) => {
    const { isMobile } = useDevice();
    const [animatedIcons, setAnimatedIcons] = useState([]);

    useEffect(() => {
        let timeout;
        const scheduleNextAnimation = () => {
            const minDelay = 1000;
            const maxDelay = 3000;
            const delay = Math.random() * (maxDelay - minDelay) + minDelay;
            timeout = setTimeout(() => {
                const IconComponent = icons[Math.floor(Math.random() * icons.length)];
                const id = Date.now();
                const color = randomPastelColor();
                // Randomly decide if the icon flows left-to-right or right-to-left.
                const direction = Math.random() < 0.5 ? 'ltr' : 'rtl';
                setAnimatedIcons((prev) => [...prev, { id, IconComponent, color, direction }]);
                scheduleNextAnimation();
            }, delay);
        };

        scheduleNextAnimation();

        return () => clearTimeout(timeout);
    }, [isMobile]);

    const handleAnimationEnd = (id) => {
        setAnimatedIcons((prev) => prev.filter((item) => item.id !== id));
    };

    return ReactDOM.createPortal(
        <Box
            sx={{
                position: 'fixed',
                bottom: position === 'bottom' ? '2dvh' : null,
                top: position === 'top' ? '4dvh' : null,
                left: 0,
                width: '100%',
                height: isMobile ? '100px' : '200px',
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 5200,
            }}
        >
            {/* Phone icon on the left */}
            <Box
                sx={{
                    position: 'absolute',
                    left: '10vw',
                    bottom: 0,
                }}
            >
                <PhoneAndroidIcon sx={{ color: '#eee', fontSize: isMobile ? 36 : 48, opacity: 0.8 }} />
            </Box>
            {/* Desktop icon on the right */}
            <Box
                sx={{
                    position: 'absolute',
                    right: '10vw',
                    bottom: 0,
                }}
            >
                <DesktopWindowsIcon sx={{ color: '#eee', fontSize: isMobile ? 36 : 48, opacity: 0.8 }} />
            </Box>
            {/* Animated icons */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                }}
            >
                {animatedIcons.map(({ id, IconComponent, color, direction }) => (
                    <AnimatedIcon
                        key={id}
                        IconComponent={IconComponent}
                        onAnimationEnd={() => handleAnimationEnd(id)}
                        color={color}
                        isMobile={isMobile}
                        direction={direction}
                    />
                ))}
            </Box>
        </Box>,
        document.body
    );
};

OnboardingAnimation.propTypes = {
    position: PropTypes.string.isRequired,
};

export default OnboardingAnimation;