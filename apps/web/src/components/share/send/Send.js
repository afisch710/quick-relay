import React, { useCallback, useState, useRef, useEffect } from 'react';
import { alpha, Box, Typography, Fade, useTheme } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useSharing } from '../../../context/SharingProvider';
import MessageComposer from './MessageComposer';
import AddIcon from '@mui/icons-material/AddCircle';
import ShareToolbar from './ShareToolbar';
import { useDevice } from '../../../context/DeviceProvider';

const Send = () => {
    const theme = useTheme();
    const { isMobile } = useDevice();
    const { shareFiles, sharePaste, shareNote } = useSharing();
    const [composingMessage, setComposingMessage] = useState(false);
    const [prepopulatedNoteText, setPrepopulatedNoteText] = useState('');
    const containerRef = useRef(null);

    // Auto-focus the container on mount.
    useEffect(() => {
        // Focus on mount.
        if (containerRef.current) {
            containerRef.current.focus();
        }

        // Define a handler for when the window gains focus.
        const handleWindowFocus = () => {
            if (containerRef.current) {
                containerRef.current.focus();
            }
        };

        // Listen for window focus events.
        window.addEventListener('focus', handleWindowFocus);

        // Cleanup on unmount.
        return () => {
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, []);

    const onDrop = useCallback((acceptedFiles) => {
        // Arrays to accumulate metadata and file bytes.
        shareFiles(acceptedFiles);
    }, [shareFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
    });

    const handlePaste = useCallback(async (event) => {
        event.preventDefault();
        const clipboardItems = event.clipboardData.items;
        sharePaste(clipboardItems);
    }, [sharePaste]);

    const handleSendNote = useCallback((note) => {
        shareNote(note);
        setComposingMessage(false);
    }, [shareNote]);

    const openNote = useCallback((text) => {
        setComposingMessage(true);
        setPrepopulatedNoteText(text ?? '');
    }, []);

    return (
        <Box
            {...getRootProps()}
            ref={containerRef}
            tabIndex={0}
            onPaste={composingMessage ? null : handlePaste}
            bgcolor={theme.palette.background.tertiary}
            boxShadow={"inset 0 4px 8px rgba(0, 0, 0, 0.25)"}
            border={`1px solid ${theme.palette.background.secondary}`}
            borderRadius={8}
            padding="10px"
            textAlign="center"
            width={'80%'}
            minWidth={isMobile ? '300px' : '415px'}
            maxWidth={isMobile ? '700px' : '750px'}
            height="30%"
            mt={2}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            sx={{ cursor: "pointer", position: "relative", overflow: "hidden" }}
        >
            <input {...getInputProps()} />
            {/* Fade container for the composer */}
            <Fade in={composingMessage} timeout={300} unmountOnExit>
                <Box
                    display={'flex'}
                    height={'95%'}
                    width={'95%'}
                >
                    <MessageComposer
                        onSend={handleSendNote}
                        onCancel={() => setComposingMessage(false)}
                        prepopulatedText={prepopulatedNoteText}
                    />
                </Box>
            </Fade>
            {/* Fade container for the default content */}
            <Fade in={!composingMessage} timeout={300} unmountOnExit>
                <Box
                    sx={{
                        position: "absolute",
                        top: "20px",
                        left: "20px",
                        right: "20px",
                        bottom: "20px",
                    }}
                >
                    {isDragActive && !isMobile ? (
                        <Typography variant="h6" color="text.primary">
                            Drop your file here
                        </Typography>
                    ) : (
                        <Typography
                            variant="h6"
                            color="text.secondary"
                            sx={{ fontWeight: 800, opacity: 0.7 }}
                        >
                            {isMobile ? "Tap here to share" : "Share files here"}
                        </Typography>
                    )}
                    {!isMobile && (
                        <Box display="flex" width="100%" height="100%" justifyContent="center" alignItems="center">
                            <AddIcon
                                sx={{
                                    fontSize: "64px",
                                    color: alpha(theme.palette.text.secondary, 0.15),
                                }}
                            />
                        </Box>
                    )}
                    <ShareToolbar onShareNote={openNote} />
                </Box>
            </Fade>
        </Box>
    );
};

export default React.memo(Send);