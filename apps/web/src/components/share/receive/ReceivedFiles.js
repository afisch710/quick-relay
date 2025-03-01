import React, { useMemo } from 'react';
import { Typography, List, Stack, useTheme } from '@mui/material';
import { useSharing } from '../../../context/SharingProvider';
import ReceivedFile from './ReceivedFile';
import GroupedFiles from '../common/GroupedFiles';
import FilesList from '../common/FilesList';

const ReceivedFiles = () => {
    const theme = useTheme();
    const { receivedFiles } = useSharing();

    // Sort files descending by timestamp (most recent first)
    const sortedFiles = useMemo(() => {
        return [...receivedFiles].sort((a, b) => {
            const aTime = new Date(a.metadata.timestamp);
            const bTime = new Date(b.metadata.timestamp);
            return bTime - aTime;
        });
    }, [receivedFiles]);

    // Build a unified list in order. For files with a groupId, if there’s more than one file in the group,
    // render them as a group (GroupedFiles) using the groupId as key; otherwise render them as an individual file.
    const listItems = useMemo(() => {
        const renderedGroups = new Set();
        return sortedFiles.map((file) => {
            if (file.metadata.groupId) {
                // Use file.metadata.groupId in the check.
                if (renderedGroups.has(file.metadata.groupId)) return null;
                renderedGroups.add(file.metadata.groupId);
                // Gather all files in the group.
                const groupFiles = sortedFiles.filter((f) => f.metadata.groupId === file.metadata.groupId);
                // If there is more than one file in the group, render a GroupedFiles component; otherwise render as a single file.
                const content =
                    groupFiles.length > 1 ? (
                        <GroupedFiles files={groupFiles} FileComponent={ReceivedFile} actionsEnabled />
                    ) : (
                        <ReceivedFile file={groupFiles[0]} />
                    );
                return { key: file.metadata.groupId, content };
            } else {
                return { key: file.metadata.fileId, content: <ReceivedFile file={file} /> };
            }
        }).filter(item => item !== null);
    }, [sortedFiles]);

    return (
        <Stack width="100%" height={'100%'} spacing={1} alignItems="center">
            {sortedFiles.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                    Files shared to this device will appear here.
                </Typography>
            ) : (
                <List sx={{ width: '100%', height: '100%' }}>
                    <FilesList listItems={listItems} theme={theme} />
                </List>
            )}
        </Stack>
    );
};

export default React.memo(ReceivedFiles);