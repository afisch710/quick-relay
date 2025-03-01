import React from 'react';
import { Stack } from '@mui/material';
import Send from './send/Send';
import Receive from './receive/Receive';

const Share = () => {
    return (
        <Stack
            width="100%"
            height="100%"
            display="flex"
            flexDirection="column"
            alignItems="center"
            overflow={'hidden'}
            mt={2}
            gap={4}
        >
            <Send />
            <Receive />
        </Stack>
    );
};

export default React.memo(Share);