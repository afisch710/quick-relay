import React from "react";
import PropTypes from 'prop-types';
import { Stack, Typography } from "@mui/material";

const PreviewUnavailable = ({ file }) => {
    return (
        <Stack
            direction={'column'}
            width={'100%'}
            height={'100%'}
            justifyContent={'center'}
            alignItems={'center'}
            spacing={4}>
            <Typography variant="h4">{file.name}</Typography>
            <Typography variant="h6">Preview not available</Typography>
        </Stack>
    );
}

PreviewUnavailable.propTypes = {
    file: PropTypes.object.isRequired,
}

export default React.memo(PreviewUnavailable);