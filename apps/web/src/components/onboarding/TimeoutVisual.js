// TimeoutVisual.js
import React from 'react';
import { Box, keyframes, useTheme } from '@mui/material';

const bounce = keyframes`
  0% {
    transform: translateY(0) scale(1);
    animation-timing-function: ease-out;
  }
  20% {
    transform: translateY(-100px) scale(1.1);
    animation-timing-function: ease-in;
  }
  40% {
    transform: translateY(0) scale(0.9);
    animation-timing-function: ease-out;
  }
  50% {
    transform: translateY(-50px) scale(1.05);
    animation-timing-function: ease-in;
  }
  60% {
    transform: translateY(0) scale(0.95);
    animation-timing-function: ease-out;
  }
  70% {
    transform: translateY(-25px) scale(1);
    animation-timing-function: ease-in;
  }
  80% {
    transform: translateY(0) scale(1);
  }
  100% {
    transform: translateY(0) scale(1);
  }
`;

const TimeoutVisual = () => {
    const theme = useTheme();
    return (
        <Box
            display={'flex'}
            width={'100%'}
            height={'100%'}
            justifyContent={'center'}
            alignItems={'flex-end'}>
            <Box
                width={15}
                height={15}
                borderRadius={'50%'}
                bgcolor={theme.palette.text.accent}
                sx={{
                    animation: `${bounce} 1.5s infinite`,
                }}
            />
        </Box>

    );
};

export default React.memo(TimeoutVisual);