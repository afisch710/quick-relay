import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { Box, Typography } from "@mui/material";
import { useDevice } from "../../../context/DeviceProvider";

const Note = ({ file }) => {
    const { isMobile } = useDevice();
    const [text, setText] = useState('');

    useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setText(e.target.result);
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
            };
            reader.readAsText(file);
        }
    }, [file]);

    return (
        <Box
            display="flex"
            width={isMobile ? '100%' : '500px'}
            height="100%"
            justifyContent="center"
            alignItems="center"
            p={2}
            flexWrap={'wrap'}
            sx={{
                overflowY: 'auto',
            }}
        >
            <Typography variant="body1">
                {text}
            </Typography>
        </Box>
    );
};

Note.propTypes = {
    file: PropTypes.object.isRequired,
};

export default React.memo(Note);