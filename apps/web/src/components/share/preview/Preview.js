import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Stack, Box } from '@mui/material';
import Image from './Image';
import Video from './Video';
import PDF from './PDF';
import Note from './Note';
import PreviewUnavailable from './PreviewUnavailable';
import { useDevice } from '../../../context/DeviceProvider';

const Preview = ({ file }) => {
    const { isMobile } = useDevice();

    const fileType = useMemo(() => {
        const extension = file.name.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) return 'image';
        if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) return 'video';
        if (extension === 'pdf') return 'pdf';
        const lowerFileName = file.name.toLowerCase();
        if (lowerFileName.startsWith('___tmp___pourtle___note') ||
            lowerFileName.startsWith('___tmp___pourtle___clipboard')) return 'note';
        return 'unknown';
    }, [file]);

    const FilePreview = useMemo(() => {
        switch (fileType) {
            case 'image': return Image;
            case 'video': return Video;
            case 'pdf': return PDF;
            case 'note': return Note;
            default: return PreviewUnavailable;
        }
    }, [fileType]);

    return (
        <Stack
            direction="column"
            maxWidth={isMobile ? '100%' : '80dvw'}
            height={isMobile ? '70dvh' : '80dvh'}
            sx={{ overflow: 'hidden' }}
            justifyContent={'center'}
            alignItems={'center'}
        >
            {/* A Box that fills the available space and scrolls vertically */}
            <Box
                display={'flex'}
                width={'100%'}
                height={'100%'}
                sx={{
                    overflowY: 'auto',
                    overflowX: 'hidden',
                }}
            >
                <FilePreview file={file} />
            </Box>
        </Stack>
    );
};

Preview.propTypes = {
    file: PropTypes.instanceOf(Blob).isRequired,
    onError: PropTypes.func,
};

Preview.defaultProps = {
    onError: (e) => console.error('Error in preview:', e),
};

export default React.memo(Preview);