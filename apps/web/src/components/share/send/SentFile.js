import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Tooltip, Typography, useTheme, Popover } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import ResponsiveIconButton from '../../common/ResponsiveIconButton';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import MessageIcon from '@mui/icons-material/Message';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useSharing } from '../../../context/SharingProvider';

// Helper to generate a random pastel color in HSL.
function randomPastelColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
}

// Helper to format file size.
function formatFileSize(bytes) {
    const ONE_KB = 1024;
    const ONE_MB = ONE_KB * 1024;
    const ONE_GB = ONE_MB * 1024;

    if (bytes < ONE_MB) {
        return `${Math.round(bytes / ONE_KB)} KB`;
    } else if (bytes < ONE_GB) {
        return `${(bytes / ONE_MB).toFixed(1)} MB`;
    } else {
        return `${(bytes / ONE_GB).toFixed(1)} GB`;
    }
}

const SentFile = ({ file }) => {
    const theme = useTheme();
    const { deleteSentFile } = useSharing();

    // Capture metadata and generate stable color.
    const [localMetadata] = useState(() => ({ ...file.metadata }));
    const [stableColor] = useState(() => randomPastelColor());

    // Local state for the Popover anchor.
    const [anchorEl, setAnchorEl] = useState(null);

    let displayName = useMemo(() => {
        if (localMetadata.fileType) {
            const lowerType = localMetadata.fileType.toLowerCase();
            if (lowerType.startsWith('image/')) {
                return 'Photo';
            } else if (lowerType.startsWith('video/')) {
                return 'Video';
            } else if (lowerType.startsWith('text')) {
                const lowerName = localMetadata.fileName.toLowerCase();
                if (lowerName.startsWith('___tmp___pourtle___note')) {
                    return 'Note';
                } else if (lowerName.startsWith('___tmp___pourtle___clipboard')) {
                    return 'Clipboard';
                }
            }
        }
        return localMetadata.fileName;
    }, [localMetadata.fileName, localMetadata.fileType]);

    let thumbnail = useMemo(() => localMetadata.thumbnail || null, [localMetadata.thumbnail]);

    let IconComponent = useMemo(() => {
        if (localMetadata.source === 'paste' ||
            localMetadata.source === 'clipboard') {
            return ContentPasteIcon;
        } else if (localMetadata.source === 'note') {
            return MessageIcon;
        } else {
            return InsertDriveFileIcon;
        }
    }, [localMetadata.source]);

    const handleMoreInfo = useCallback((e) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
    }, []);

    const handleClosePopover = useCallback(() => {
        setAnchorEl(null);
    }, []);

    return (
        <Stack
            direction="row"
            width="100%"
            height="50px"
            alignItems="center"
            pt={1}
            pb={1}
            spacing={1}
        >
            {thumbnail ? (
                <Box
                    display="flex"
                    width="90px"
                    height="100%"
                    justifyContent="center"
                    alignItems="center"
                >
                    <Box
                        component="img"
                        src={thumbnail}
                        alt={displayName}
                        sx={{
                            width: 40,
                            height: 40,
                            objectFit: 'cover',
                            borderRadius: 2,
                            ml: 1,
                        }}
                    />
                </Box>
            ) : (
                <Box
                    width="90px"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                >
                    {React.createElement(IconComponent, {
                        style: { color: stableColor, fontSize: '40px' },
                    })}
                </Box>
            )}
            <Stack
                direction="row"
                width="100%"
                height="100%"
                justifyContent="space-between"
                alignItems={'center'}>
                <Stack
                    direction="column"
                    width="100%"
                    height="100%"
                    justifyContent="center"
                    alignItems="flex-start"
                >
                    <Tooltip
                        title={displayName}
                        placement="top"
                        slotProps={{
                            tooltip: {
                                sx: {
                                    color: theme.palette.text.primary,
                                    bgcolor: theme.palette.background.secondary,
                                    border: `1px solid ${theme.palette.text.secondary}`,
                                },
                            },
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                maxWidth: '115px',
                            }}
                        >
                            {displayName}
                        </Typography>
                    </Tooltip>
                    {localMetadata.timestamp && (
                        <Typography variant="caption" color="text.secondary" fontSize={10}>
                            {formatDistanceToNow(new Date(localMetadata.timestamp), { addSuffix: true })}
                        </Typography>
                    )}
                </Stack>
                <ResponsiveIconButton
                    icon={InfoIcon}
                    size={'18px'}
                    color={'text.secondary'}
                    tooltip={'More info'}
                    onClick={handleMoreInfo}
                />
                <ResponsiveIconButton
                    icon={CloseIcon}
                    size={'18px'}
                    color={'text.secondary'}
                    tooltip={'Remove'}
                    onClick={() => deleteSentFile(localMetadata.fileId)}
                />
            </Stack>

            {/* Popover for More Info */}
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClosePopover}
                slotProps={{
                    paper: {
                        sx: {
                            bgcolor: theme.palette.background.tertiary,
                            borderRadius: 4,
                        }
                    }
                }}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <Box p={2}>
                    <Stack spacing={1}>
                        <Typography variant="caption"><strong>Name:</strong> {localMetadata.fileName}</Typography>
                        <Typography variant="caption"><strong>Type:</strong> {localMetadata.fileType}</Typography>
                        <Typography variant="caption"><strong>Size:</strong> {localMetadata.fileSize ? formatFileSize(localMetadata.fileSize) : 'N/A'}</Typography>
                    </Stack>
                </Box>
            </Popover>
        </Stack>
    );
};

SentFile.propTypes = {
    file: PropTypes.shape({
        metadata: PropTypes.shape({
            fileId: PropTypes.string.isRequired,
            fileName: PropTypes.string.isRequired,
            fileType: PropTypes.string,
            timestamp: PropTypes.string,
            thumbnail: PropTypes.string,
            groupId: PropTypes.string,
            source: PropTypes.string,
            fileSize: PropTypes.number,
        }).isRequired,
    })
};

export default React.memo(SentFile);