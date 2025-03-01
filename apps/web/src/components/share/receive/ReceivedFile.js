import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Tooltip, Typography, useTheme, Popover } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import ResponsiveIconButton from '../../common/ResponsiveIconButton';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import MessageIcon from '@mui/icons-material/Message';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import IosShareIcon from '@mui/icons-material/IosShare';
import DownloadIcon from '@mui/icons-material/Download';
import { useSharing } from '../../../context/SharingProvider';
import { usePreview } from '../../../context/PreviewProvider';
import { useSettings } from '../../../context/SettingsProvider';

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

const ReceivedFile = ({ file }) => {
    const theme = useTheme();
    const { autoDownload } = useSettings();
    const { deleteReceivedFile } = useSharing();
    const { showPreview } = usePreview();

    // Capture metadata and generate stable color.
    const [localMetadata] = useState(() => ({ ...file?.metadata }));
    const [localData] = useState(() => file?.data);
    const [stableColor] = useState(() => randomPastelColor());
    const [mounted, setMounted] = useState(false);

    // Local state for the Popover anchor.
    const [anchorEl, setAnchorEl] = useState(null);

    // Ref to track if the info button was clicked.
    const infoClickedRef = useRef(false);

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

    const handleShare = useCallback(async (e) => {
        e.stopPropagation();

        if (navigator.share && navigator.canShare) {
            try {
                const blob = localData instanceof Blob
                    ? localData
                    : new Blob([localData], { type: localMetadata.fileType });
                const blobUrl = URL.createObjectURL(blob);
                const fileObj = new File(
                    [blob],
                    localMetadata.fileName,
                    { type: localMetadata.fileType }
                );
                if (navigator.canShare({ url: blobUrl })) {
                    await navigator.share({
                        title: localMetadata.fileName,
                        text: 'Shared via Pourtle',
                        url: blobUrl
                    });
                } else if (navigator.canShare({ files: [fileObj] })) {
                    await navigator.share({
                        title: localMetadata.fileName,
                        text: 'Shared via Pourtle',
                        files: [fileObj]
                    });
                } else {
                    console.warn("Sharing files is not supported on this device.");
                }
                console.log("Share successful");
            } catch (error) {
                console.error("Error sharing file:", error);
            }
        } else {
            console.warn("Web Share API is not supported in this browser.");
        }
    }, [localData, localMetadata]);

    const handleDownload = useCallback((e) => {
        const blob = localData instanceof Blob
            ? localData
            : new Blob([localData], { type: localMetadata.fileType });

        const url = URL.createObjectURL(blob);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = localMetadata.fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    }, [localData, localMetadata]);

    useEffect(() => {
        if (mounted) {
            // Already mounted, return without auto download
            return;
        }
        if (autoDownload) {
            // Auto download on mount
            handleDownload(null);
        }
        setMounted(true);
    }, [autoDownload, mounted, handleDownload])

    const handleMoreInfo = useCallback((e) => {
        e.stopPropagation();
        infoClickedRef.current = true;
        setAnchorEl(e.currentTarget);
    }, []);

    const handleClosePopover = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        deleteReceivedFile(localMetadata.fileId);
    }, [localMetadata.fileId, deleteReceivedFile]);

    const handleFileClick = useCallback((e) => {
        // If the info button was clicked, clear the flag and ignore this click.
        if (infoClickedRef.current) {
            infoClickedRef.current = false;
            return;
        }
        const blob = localData instanceof Blob
            ? localData
            : new Blob([localData], { type: localMetadata.fileType });
        const fileObj = new File(
            [blob],
            localMetadata.fileName,
            { type: localMetadata.fileType }
        );
        showPreview(fileObj);
    }, [localData, localMetadata, showPreview]);

    return (
        <Stack
            direction="row"
            width="100%"
            height="50px"
            alignItems="center"
            pt={1}
            pb={1}
            spacing={1}
            onClick={handleFileClick}
            sx={{
                cursor: 'pointer'
            }}
        >
            {thumbnail ? (
                <Box
                    display="flex"
                    width="75px"
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
                        }}
                    />
                </Box>
            ) : (
                <Box
                    width="75px"
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
                    icon={IosShareIcon}
                    size={'18px'}
                    color={'text.secondary'}
                    tooltip={'Share'}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleShare(e);
                    }}
                />
                <ResponsiveIconButton
                    icon={DownloadIcon}
                    size={'18px'}
                    color={'text.secondary'}
                    tooltip={'Download'}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(e);
                    }}
                />
                <ResponsiveIconButton
                    icon={InfoIcon}
                    size={'18px'}
                    color={'text.secondary'}
                    tooltip={'More info'}
                    onClick={(e) => {
                        handleMoreInfo(e);
                    }}
                />
                <ResponsiveIconButton
                    icon={CloseIcon}
                    size={'18px'}
                    color={'text.secondary'}
                    tooltip={'Remove'}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(e);
                    }}
                />
            </Stack>

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

ReceivedFile.propTypes = {
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
        data: PropTypes.object
    })
};

export default React.memo(ReceivedFile);