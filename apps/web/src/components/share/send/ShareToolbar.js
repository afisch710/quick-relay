// ShareToolbar.js
import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Stack, Grid2 } from '@mui/material';
import PhotoIcon from '@mui/icons-material/Photo';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MessageIcon from '@mui/icons-material/Message';
import ShareButton from './ShareButton';
import { useDevice } from '../../../context/DeviceProvider';
import { useSharing } from '../../../context/SharingProvider';

// Helper function to generate a random pastel color within a specified hue range.
const generateRandomPastelColorInRange = (minHue, maxHue) => {
    const hue = Math.floor(Math.random() * (maxHue - minHue + 1)) + minHue;
    return `hsl(${hue}, 70%, 80%)`;
};

const ShareToolbar = ({ onShareNote = () => { } }) => {
    const { isMobile } = useDevice();
    const { shareFiles } = useSharing();

    // Generate four distinct pastel colors from non-overlapping ranges.
    const colors = useMemo(() => {
        return [
            generateRandomPastelColorInRange(0, 80),
            generateRandomPastelColorInRange(80, 160),
            generateRandomPastelColorInRange(160, 240),
            generateRandomPastelColorInRange(240, 360)
        ];
    }, []);

    // Opens a file picker for any file.
    const openFilePicker = useCallback((e) => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.style.display = 'none';
        document.body.appendChild(input);
        input.addEventListener('change', (e) => {
            e.stopPropagation();
            // Convert the FileList to an array.
            const fileArray = Array.from(e.target.files);
            shareFiles(fileArray);
            document.body.removeChild(input);
        });
        input.click();
    }, [shareFiles]);

    // Opens a file picker restricted to image/video types.
    const openPhotoPicker = useCallback((e) => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*,video/*';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.addEventListener('change', (e) => {
            e.stopPropagation();
            // Convert the FileList to an array.
            const fileArray = Array.from(e.target.files);
            shareFiles(fileArray);
            document.body.removeChild(input);
        });
        input.click();
    }, [shareFiles]);

    // Reads clipboard content using the Clipboard API.
    const pasteClipboard = useCallback(async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.read) {
                const items = await navigator.clipboard.read();
                const texts = [];
                for (const item of items) {
                    if (item.types.includes("text/plain")) {
                        const blob = await item.getType("text/plain");
                        const text = await blob.text();
                        texts.push(text);
                    }
                }
                if (texts.length > 0) {
                    onShareNote(texts.join("\n"));
                }
            } else {
                console.warn("Clipboard read API not available");
            }
        } catch (e) {
            console.error("Error reading clipboard", e);
        }
    }, [onShareNote]);

    const variant = useMemo(() => (isMobile ? 'normal' : 'reveal'), [isMobile]);

    const noteButton = useMemo(() => {
        return (
            <ShareButton
                variant={variant}
                icon={MessageIcon}
                label="Share Note"
                onClick={() => onShareNote()}
                color={colors[0]}
            />
        );
    }, [colors, variant, onShareNote]);

    const photoButton = useMemo(() => {
        return (
            <ShareButton
                variant={variant}
                icon={PhotoIcon}
                label="Share Photo"
                onClick={openPhotoPicker}
                color={colors[1]}
            />
        );
    }, [colors, variant, openPhotoPicker]);

    const fileButton = useMemo(() => {
        return (
            <ShareButton
                variant={variant}
                icon={InsertDriveFileIcon}
                label="Share File"
                onClick={openFilePicker}
                color={colors[2]}
            />
        );
    }, [colors, variant, openFilePicker]);

    const clipboardButton = useMemo(() => {
        return (
            <ShareButton
                variant={variant}
                icon={ContentPasteIcon}
                label="Share Clipboard"
                onClick={pasteClipboard}
                color={colors[3]}
            />
        );
    }, [colors, variant, pasteClipboard]);

    // On mobile, arrange buttons in a 2x2 Grid.
    if (isMobile) {
        return (
            <Grid2
                container
                spacing={1}
                sx={{
                    position: 'absolute',
                    bottom: 8,
                    left: 8,
                    width: '300px',
                }}
            >
                <Grid2 xs={6}>
                    {noteButton}
                </Grid2>
                <Grid2 xs={6}>
                    {photoButton}
                </Grid2>
                <Grid2 xs={6}>
                    {fileButton}
                </Grid2>
                <Grid2 xs={6}>
                    {clipboardButton}
                </Grid2>
            </Grid2>
        );
    }

    // Otherwise, on desktop, stack them vertically.
    return (
        <Stack
            spacing={1}
            sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
            }}
        >
            {noteButton}
            {photoButton}
            {fileButton}
            {clipboardButton}
        </Stack>
    );
};

ShareToolbar.propTypes = {
    onShareNote: PropTypes.func,
}

export default React.memo(ShareToolbar);