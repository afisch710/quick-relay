import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@emotion/react';
import PhotoIcon from '@mui/icons-material/Photo';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const iconComponents = [PhotoIcon, AssignmentIcon, InsertDriveFileIcon];

const randomPastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 80%)`;
};

// Define a gentle rocking animation.
const rockAnimation = keyframes`
  0% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
  100% { transform: rotate(-5deg); }
`;

const ValuePropVisual = () => {
  // Generate an array of 5 random icons on mount.
  const iconsList = useMemo(() => {
    const count = 5;
    return Array.from({ length: count }).map((_, i) => {
      const IconComponent = iconComponents[Math.floor(Math.random() * iconComponents.length)];
      const color = randomPastelColor();
      // Optionally, a random delay to stagger the rocking effect.
      const delay = `${Math.random() * 0.5}s`;
      return { IconComponent, color, delay, key: i };
    });
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
      }}
    >
      {iconsList.map(({ IconComponent, color, delay, key }) => (
        <Box
          key={key}
          sx={{
            animation: `${rockAnimation} 3s ease-in-out infinite`,
            animationDelay: delay,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent fontSize="large" sx={{ color, fontSize: 48 }} />
        </Box>
      ))}
    </Box>
  );
};

export default ValuePropVisual;