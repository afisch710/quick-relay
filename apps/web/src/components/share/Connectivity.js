import { Box, Tooltip, useTheme } from '@mui/material';
import React from 'react';
import { useConnection } from '../../context/ConnectionProvider';

const Connectivity = () => {
    const theme = useTheme();
    const { isConnected } = useConnection();

    return (
        <Box
            display="flex"
            alignItems="center" 
            justifyContent={'center'}
            gap={1}
            width="100%">
            {isConnected && (
                <Tooltip
                    title={'Connected'}
                    placement='bottom'
                    slotProps={{
                        tooltip: {
                            sx: {
                                color: theme.palette.text.primary,
                                bgcolor: theme.palette.background.secondary,
                                border: `1px solid ${theme.palette.text.secondary}`
                            },
                        },
                    }}>
                    <Box
                        width={10}
                        height={10}
                        borderRadius="50%"
                        display={'flex'}
                        justifyContent={'center'}
                        alignItems={'center'}
                        sx={{
                            backgroundColor: '#04d93d',
                            animation: 'glow 1.5s ease-in-out infinite',
                            '@keyframes glow': {
                                '0%': { boxShadow: '0 0 5px #04d93d' },
                                '50%': { boxShadow: '0 0 15px #03fc45' },
                                '100%': { boxShadow: '0 0 5px #04d93d' },
                            },
                        }}
                    />
                </Tooltip>
            )
            }
        </Box >
    );
};

export default React.memo(Connectivity);