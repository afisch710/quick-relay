import { Box, Stack, Typography } from "@mui/material";
import React from "react";
import { useDevice } from "../../../context/DeviceProvider";
import ReceivedFiles from "./ReceivedFiles";

const Receive = () => {
    const { isMobile } = useDevice();

    return (
        <Stack
            width={'80%'}
            minWidth={isMobile ? '300px' : '425px'}
            maxWidth={isMobile ? '700px' : '750px'}
            minHeight={'400px'}
            height={'50%'}
            gap={2}
            mt={2}
        >
            <Box
                width={'100%'}
                display={'flex'}
                justifyContent={'center'}
                alignItems={'center'}>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, opacity: 0.7 }}>
                    Received
                </Typography>
            </Box>
            <Box
                width={'100%'}
                sx={{
                    overflowY: 'auto',
                }}>
                <ReceivedFiles />
            </Box>
        </Stack>
    );
};

export default React.memo(Receive);