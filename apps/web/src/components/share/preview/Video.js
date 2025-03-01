import React, { useEffect, useState, useMemo } from "react";
import PropTypes from 'prop-types';
import { Box } from "@mui/material";

const Video = ({ file }) => {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        const objUrl = URL.createObjectURL(file);
        setUrl(objUrl);
        return () => {
            URL.revokeObjectURL(objUrl);
        };
    }, [file]);

    const videoType = useMemo(() => {
        return file.type === 'video/quicktime' ? 'video/mp4' : file.type;
    }, [file]);

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{ overflow: 'hidden' }}
        >
            <Box
                component="video"
                controls
                autoPlay
                loop
                sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: "contain"
                }}
            >
                <source src={url} type={videoType} />
            </Box>
        </Box>
    );
};

Video.propTypes = {
    file: PropTypes.object.isRequired,
};

export default React.memo(Video);