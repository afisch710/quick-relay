// MessageComposer.js
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    TextField,
    Button,
    Paper,
    Stack,
    useTheme,
    Box,
    Typography,
} from '@mui/material';

const MessageComposer = ({ onSend, onCancel, prepopulatedText }) => {
    const [message, setMessage] = useState(prepopulatedText ?? '');
    const [attachments, setAttachments] = useState([]);
    const theme = useTheme();

    // Handler for paste events
    const handlePaste = useCallback((e) => {
        e.stopPropagation();
        const items = e.clipboardData.items;
        let newAttachments = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    newAttachments.push(file);
                }
            }
        }
        if (newAttachments.length > 0) {
            e.preventDefault();
            setAttachments((prev) => [...prev, ...newAttachments]);
        }
    }, []);

    // Remove an attachment from the list
    const removeAttachment = useCallback((index) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    }, []);

    return (
        <Paper
            elevation={3}
            onClick={(e) => e.stopPropagation()}
            onPaste={handlePaste}
            sx={{
                pb: 1,
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                backgroundColor: theme.palette.background.tertiary,
                border: 'none',
                borderRadius: 'inherit', // inherit parent's border radius
                boxShadow: 'none',
                overflow: 'auto', // allow scrolling if content overflows
            }}
        >
            <Stack
                direction={'column'}
                spacing={1}
                height={'100%'}
                justifyContent={'space-between'}>
                <Box
                    display={'flex'}
                    width={'100%'}
                    maxHeight={'80%'}
                    overflow={'hidden'}>
                    <TextField
                        multiline
                        placeholder="Type your note..."
                        variant="outlined"
                        value={message}
                        autoFocus
                        onChange={(e) => setMessage(e.target.value)}
                        fullWidth
                        slotProps={{
                            input: {
                                sx: {
                                    // height: '100px',
                                },
                                inputProps: {
                                    style: {
                                        height: '100px'
                                    }
                                }
                            }
                        }}
                        sx={{
                            height: '90%',
                            pt: 2,
                            '& fieldset': { border: 'none' },
                            overflowY: "auto", // Ensure the text field content scrolls vertically
                            // Target the OutlinedInput root for scrollbar styling:
                            "& .MuiOutlinedInput-root": {
                                "&::-webkit-scrollbar": {
                                    width: "8px",
                                    backgroundColor: "transparent", // Remove track background
                                },
                                "&::-webkit-scrollbar-thumb": {
                                    backgroundColor: theme.palette.primary.main, // Use theme primary color
                                    borderRadius: "4px",
                                },
                            },
                            // For Firefox:
                            scrollbarWidth: "thin",
                            scrollbarColor: `${theme.palette.primary.main} transparent`,
                        }}
                    />
                </Box>
                <Stack
                    direction={'row'}
                    justifyContent={'space-between'}
                    width={'100%'}>
                    {attachments.length > 0 ?
                        (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                    mt: 1,
                                }}
                            >
                                {attachments.map((file, index) => {
                                    const isImage = file.type.startsWith('image/');
                                    const objectUrl = URL.createObjectURL(file);
                                    return (
                                        <Box
                                            key={index}
                                            sx={{
                                                position: 'relative',
                                                width: 60,
                                                height: 60,
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                border: `1px solid ${theme.palette.divider}`,
                                            }}
                                        >
                                            {isImage ? (
                                                <img
                                                    src={objectUrl}
                                                    alt={file.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            ) : (
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: theme.palette.grey[300],
                                                    }}
                                                >
                                                    <Typography variant="caption">
                                                        {file.name.split('.').pop()}
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 0,
                                                    bgcolor: 'rgba(0,0,0,0.5)',
                                                    color: '#fff',
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeAttachment(index);
                                                }}
                                            >
                                                ×
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )
                        :
                        // Forces buttons to remain on right
                        <Box></Box>
                    }
                    <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                        alignItems={'flex-end'}
                    >
                        <Button
                            variant="text"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMessage('');
                                setAttachments([]);
                                onCancel();
                            }}
                            sx={{
                                height: '35px',
                                color: theme.palette.text.secondary
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSend({ message, attachments });
                                setMessage('');
                                setAttachments([]);
                            }}
                            sx={{
                                height: '35px',
                                borderRadius: 2
                            }}
                        >
                            Send
                        </Button>
                    </Stack>
                </Stack>
            </Stack>
        </Paper>
    );
};

MessageComposer.propTypes = {
    onSend: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    prepopulatedText: PropTypes.string,
}

export default React.memo(MessageComposer);