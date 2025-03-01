import React, { useEffect, useState, useMemo } from "react";
import PropTypes from 'prop-types';
import { Box } from "@mui/material";

const Image = ({ file }) => {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        const objUrl = URL.createObjectURL(file);
        setUrl(objUrl);
        return () => {
            URL.revokeObjectURL(objUrl);
        };
    }, [file]);

    const fileName = useMemo(() => file.name, [file]);

    return (
        <Box
            display="flex"
            width="100%"
            height="100%"
            justifyContent="center"
            alignItems="center"
            sx={{ overflow: 'hidden' }}
        >
            <Box
                component="img"
                src={url}
                alt={fileName}
                sx={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain"
                }}
            />
        </Box>
    );
}

Image.propTypes = {
    file: PropTypes.object.isRequired,
}

export default React.memo(Image);