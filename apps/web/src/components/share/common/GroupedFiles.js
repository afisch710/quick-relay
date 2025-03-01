import React, { useState, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Collapse, Stack } from '@mui/material';
import { useDownload } from '../../../context/DownloadProvider';
import { formatDistanceToNow } from 'date-fns';
import SentFile from '../send/SentFile';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ResponsiveIconButton from '../../common/ResponsiveIconButton';
import CloseIcon from '@mui/icons-material/Close';
import IosShareIcon from '@mui/icons-material/IosShare';
import DownloadIcon from '@mui/icons-material/Download';
import { useSharing } from '../../../context/SharingProvider';

// Helper function to generate a random pastel color within a specified hue range.
const generateRandomPastelColorInRange = (minHue, maxHue) => {
    const hue = Math.floor(Math.random() * (maxHue - minHue + 1)) + minHue;
    return `hsl(${hue}, 70%, 80%)`;
};

const GroupedFiles = ({ files, FileComponent = SentFile, actionsEnabled = false }) => {
    const { downloadFiles } = useDownload();
    const { deleteReceivedFile } = useSharing();
    const [localFiles, setLocalFiles] = useState(files);

    useEffect(() => {
        setLocalFiles(files);
    }, [files])

    const colors = useMemo(() => {
        return [
            generateRandomPastelColorInRange(0, 120),
            generateRandomPastelColorInRange(120, 240),
            generateRandomPastelColorInRange(240, 360)
        ];
    }, []);

    // Determine if the group is homogeneous.
    const isPhotoGroup = useMemo(() => {
        return localFiles.every(
            (file) =>
                file.metadata.fileType && file.metadata.fileType.toLowerCase().startsWith('image/')
        );
    }, [localFiles]);

    const isVideoGroup = useMemo(() => {
        return localFiles.every(
            (file) =>
                file.metadata.fileType && file.metadata.fileType.toLowerCase().startsWith('video/')
        );
    }, [localFiles]);

    const count = useMemo(() => localFiles.length, [localFiles.length]);
    const displayName = useMemo(() => {
        return isPhotoGroup
            ? `${count} Photo${count > 1 ? 's' : ''}`
            : isVideoGroup
                ? `${count} Video${count > 1 ? 's' : ''}`
                : `${count} Item${count > 1 ? 's' : ''}`;
    }, [count, isPhotoGroup, isVideoGroup]);

    // Compute most recent timestamp among group files.
    const mostRecentTimestamp = useMemo(() => {
        const validTimestamps = localFiles
            .filter((file) => file.metadata.timestamp)
            .map((file) => new Date(file.metadata.timestamp).getTime());
        if (validTimestamps.length === 0) return null;
        const maxTimestamp = Math.max(...validTimestamps);
        return new Date(maxTimestamp);
    }, [localFiles]);

    const [expanded, setExpanded] = useState(false);
    const toggleExpand = () => setExpanded((prev) => !prev);

    const handleShare = useCallback(async (e) => {
        e.stopPropagation();
        if (navigator.share && navigator.canShare) {
            try {
                const fileObjects = localFiles.map((f) => {
                    const blob = f.data instanceof Blob
                        ? f.data
                        : new Blob([f.data], { type: f.metadata.fileType });
                    return new File(
                        [blob],
                        f.metadata.fileName,
                        { type: f.metadata.fileType }
                    );
                })
                if (navigator.canShare({ files: fileObjects })) {
                    await navigator.share({
                        title: displayName,
                        text: 'Shared via Pourtle',
                        files: fileObjects
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
    }, [displayName, localFiles]);

    const handleDeleteFiles = useCallback(() => {
        localFiles.forEach((f) => {
            deleteReceivedFile(f.metadata.fileId);
        });
    }, [localFiles, deleteReceivedFile]);

    return (
        <Box onClick={toggleExpand} sx={{ cursor: 'pointer', width: '100%' }}>
            <Stack
                direction="row"
                width={'100%'}
                height={'60px'}
                alignItems="center">
                {/* Stacked thumbnails area */}
                <Box
                    width={'65px'}
                    height={'100%'}
                    position={'relative'}
                    ml={1}
                >
                    {localFiles.slice(0, 3).map((file, index) => {
                        const isImage =
                            file.metadata.fileType &&
                            (file.metadata.fileType.toLowerCase().startsWith('image/') ||
                                file.metadata.fileType.toLowerCase().startsWith('video/')) &&
                            file.metadata.thumbnail;
                        const isPaste = file.metadata.source === 'paste';
                        return (
                            isImage ? (
                                <Box
                                    key={file.metadata.fileId} // using fileId as key for the image thumbnail
                                    sx={{
                                        position: 'absolute',
                                        top: index * 4 + 8,
                                        left: index * 4,
                                        zIndex: index,
                                        width: 30,
                                        height: 30,
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        backgroundColor: 'transparent',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundImage: file.metadata.thumbnail ? `url(${file.metadata.thumbnail})` : 'none',
                                    }}
                                />
                            ) : (
                                React.createElement(isPaste ? ContentPasteIcon : InsertDriveFileIcon, {
                                    key: file.metadata.fileId,
                                    style: {
                                        color: colors[index],
                                        fontSize: '40px',
                                        position: 'absolute',
                                        top: index * 4 + 4,
                                        left: index * 4 - 4,
                                        zIndex: index,
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                    },
                                })
                            )
                        );
                    })}
                </Box>
                <Stack
                    direction={'row'}
                    height={'100%'}
                    justifyContent={'space-between'}
                    flexGrow={1}>
                    {/* Title and timestamp area */}
                    <Stack
                        direction="column"
                        height="100%"
                        justifyContent="center"
                        alignItems="flex-start"
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {displayName}
                        </Typography>
                        {mostRecentTimestamp && (
                            <Typography variant="caption" color="text.secondary" fontSize={10}>
                                {formatDistanceToNow(mostRecentTimestamp, { addSuffix: true })}
                            </Typography>
                        )}
                    </Stack>
                    {
                        actionsEnabled && !expanded &&
                        <Box
                            display={'flex'}
                            height={'100%'}
                            width={'170px'}
                            justifyContent={'flex-end'}
                            alignItems={'center'}>
                            <ResponsiveIconButton
                                icon={IosShareIcon}
                                size={'18px'}
                                color={'text.secondary'}
                                tooltip={'Share'}
                                onClick={handleShare}
                            />
                            <ResponsiveIconButton
                                icon={DownloadIcon}
                                size={'18px'}
                                color={'text.secondary'}
                                tooltip={'Download'}
                                onClick={() => downloadFiles(localFiles, displayName)}
                            />
                            <ResponsiveIconButton
                                icon={CloseIcon}
                                size={'18px'}
                                color={'text.secondary'}
                                tooltip={'Remove'}
                                onClick={handleDeleteFiles}
                            />
                        </Box>

                    }
                </Stack>
            </Stack>
            {/* Expanded view: display individual files */}
            <Collapse in={expanded} sx={{ p: 0, m: 0, }}>
                <Stack spacing={1} sx={{ mt: 1, p: 0 }}>
                    {localFiles.map((file) => {
                        return (
                            <FileComponent key={file.metadata.fileId} file={file} />
                        );
                    })}
                </Stack>
            </Collapse>
        </Box>
    );
};

GroupedFiles.propTypes = {
    files: PropTypes.arrayOf(
        PropTypes.shape({
            fileId: PropTypes.string.isRequired,
            fileName: PropTypes.string.isRequired,
            fileType: PropTypes.string,
            timestamp: PropTypes.string,
            groupId: PropTypes.string,
            thumbnail: PropTypes.string,
            source: PropTypes.string,
            fileSize: PropTypes.number,
        })
    ).isRequired,
    FileComponent: PropTypes.node,
    actionsEnabled: PropTypes.bool,
};

export default React.memo(GroupedFiles);