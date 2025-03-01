import React, { useMemo } from 'react';
import { Typography, List, Stack, useTheme, Box } from '@mui/material';
import { useSharing } from '../../../context/SharingProvider';
import SentFile from './SentFile';
import GroupedFiles from '../common/GroupedFiles';
import FilesList from '../common/FilesList';

const SentFiles = () => {
    const theme = useTheme();
    const { sentFiles } = useSharing();

    // Sort files descending by timestamp (most recent first)
    const sortedFiles = useMemo(() => {
        return [...sentFiles].sort((a, b) => {
            const aTime = new Date(a.metadata.timestamp);
            const bTime = new Date(b.metadata.timestamp);
            return bTime - aTime;
        });
    }, [sentFiles]);

    // Build a unified list in order. For files with a groupId, if there’s more than one file in the group,
    // render them as a group (GroupedFiles) using the groupId as key; otherwise render them as an individual file.
    const listItems = useMemo(() => {
        const renderedGroups = new Set();
        return sortedFiles.map((file) => {
            if (file.metadata.groupId) {
                // If we've already rendered this group, skip.
                if (renderedGroups.has(file.metadata.groupId)) return null;
                renderedGroups.add(file.metadata.groupId);
                // Gather all files in the group.
                const groupFiles = sortedFiles.filter((f) => f.metadata.groupId === file.metadata.groupId);
                // If there is only one file in the group, treat it as an individual file.
                const content = groupFiles.length > 1 ? (
                    <GroupedFiles files={groupFiles} FileComponent={SentFile} />
                ) : (
                    <SentFile file={groupFiles[0]} />
                );
                return { key: file.metadata.groupId, content };
            } else {
                return { key: file.metadata.fileId, content: <SentFile file={file} /> };
            }
        }).filter(item => item !== null);
    }, [sortedFiles]);

    return (
        <Stack width="100%" spacing={1} alignItems="center">
            <Box
                display={'flex'}
                width={'100%'}
                justifyContent={'center'}>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, opacity: 0.7 }}>
                    Sent
                </Typography>
            </Box>
            {sortedFiles.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                    No files have been sent yet.
                </Typography>
            ) : (
                <List sx={{ width: '95%' }}>
                    <FilesList listItems={listItems} theme={theme} />
                </List>
            )}
        </Stack>
    );
};

export default React.memo(SentFiles);