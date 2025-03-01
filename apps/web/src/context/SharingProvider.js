// src/context/SharingProvider.js

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    useCallback
} from 'react';
import PropTypes from 'prop-types';
import messagingService from '../services/messagingService';
import { useConnection } from './ConnectionProvider';
import { generateThumbnailForFile } from '../utility/ThumbnailUtils';

const SharingContext = createContext({
    share: () => { },
    shareFiles: () => { },
    sharePaste: () => { },
    shareNote: () => { },
    onReceived: () => { },
    deleteSentFile: () => { },
    deleteReceivedFile: () => { },
    sendingFiles: [],
    sentFiles: [],
    receivingFiles: [],
    receivedFiles: []
});

const SharingProvider = ({ children }) => {
    const { isConnected } = useConnection();
    const [ready, setReady] = useState(isConnected);
    const [receivedCallback, setReceivedCallback] = useState(() => { });
    const [sendingFiles, setSendingFiles] = useState([]);
    const [sentFiles, setSentFiles] = useState([]);
    const [receivingFiles, setReceivingFiles] = useState([]);
    const [receivedFiles, setReceivedFiles] = useState([]);

    // Helper: generate stable fileId if not provided.
    const getFileId = (md) =>
        md.fileId || Math.random().toString(36).substring(2) + Date.now();

    // Updated share() that awaits thumbnail generation before sending.
    const share = useCallback(async (metadata, data) => {
        if (!ready) return false;
        const metaArray = Array.isArray(metadata) ? metadata : [metadata];
        const dataArray = Array.isArray(data) ? data : [data];
        if (metaArray.length !== dataArray.length) {
            throw new Error("Metadata and data arrays must have the same length.");
        }

        // Pre-process each file: generate fileId and await thumbnail if applicable.
        for (let i = 0; i < metaArray.length; i++) {
            let md = metaArray[i];
            const fileId = getFileId(md);
            md.fileId = fileId;
            // Immediately add the file to sendingFiles with 0 progress.
            setSendingFiles((prev) => [...prev, { metadata: { ...md, progress: 0 } }]);

            // If file qualifies for thumbnail generation, await it.
            const lowerType = md.fileType ? md.fileType.toLowerCase() : "";
            if ((lowerType.startsWith("image/") || lowerType.startsWith("video/")) && md.fileObject) {
                try {
                    const thumb = await generateThumbnailForFile(md.fileObject);
                    md.thumbnail = thumb;
                } catch (e) {
                    console.error("Error generating thumbnail for", md.fileName, e);
                }
            }
            metaArray[i] = md;
        }

        // Define a progress callback that updates sendingFiles and moves a file to sentFiles when complete.
        // totalProgress param was removed for now
        const progressCallback = ({ fileId, fileProgress }) => {
            setSendingFiles((prev) =>
                prev.map((f) =>
                    f.metadata.fileId === fileId ? { ...f, metadata: { ...f.metadata, progress: fileProgress } } : f
                )
            );
            if (fileProgress >= 1) {
                setSendingFiles((prev) => prev.filter((f) => f.metadata.fileId !== fileId));
                setSentFiles((prev) => {
                    if (prev.find((f) => f.metadata.fileId === fileId)) return prev;
                    const fileMeta = metaArray.find((f) => f.fileId === fileId);
                    return fileMeta ? [...prev, { metadata: fileMeta }] : prev;
                });
            }
        };

        // Call messagingService.sendData with arrays of enriched metadata and data.
        await messagingService.sendData(metaArray, dataArray, progressCallback);
        return true;
    }, [ready]);

    const shareFiles = useCallback(async (files, source = 'default') => {
        // Ensure files is an array
        const filesArray = Array.isArray(files) ? files : [files];

        const metaArray = [];
        const dataArray = [];

        await Promise.all(
            filesArray.map((file) =>
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const fileBytes = reader.result; // ArrayBuffer
                        // Build metadata for this file without generating a thumbnail.
                        const metadata = {
                            fileName: file.name,
                            fileType: file.type,
                            fileSize: file.size,
                            source: source,
                            fileObject: file,
                        };
                        metaArray.push(metadata);
                        dataArray.push(fileBytes);
                        resolve();
                    };
                    reader.onerror = (error) => {
                        console.error("Error reading file:", error);
                        reject(error);
                    };
                    reader.readAsArrayBuffer(file);
                })
            )
        );

        await share(metaArray, dataArray)
            .then((result) => {
                console.log("Files sent successfully:", result);
            })
            .catch((error) => {
                console.error("Error sending files:", error);
            });
    }, [share]);

    const sharePaste = useCallback(async (clipboardItems, source = 'clipboard') => {
        const files = [];

        // Process each clipboard item.
        for (const item of clipboardItems) {
            if (item.kind === "file") {
                const file = item.getAsFile();
                if (file) {
                    files.push(file);
                }
            } else if (item.kind === "string") {
                // For text items, convert the text to a File.
                await new Promise((resolve) => {
                    item.getAsString((text) => {
                        // Create a unique filename for the temporary text file.
                        const timestamp = Date.now();
                        const fileName = `___tmp___pourtle___${source}__${timestamp}.txt`;
                        const textFile = new File([text], fileName, { type: "text/plain" });
                        files.push(textFile);
                        resolve();
                    });
                });
            }
        }

        if (files.length > 0) {
            // Call shareFiles from the SharingProvider.
            shareFiles(files, source).then((result) => {
                console.log("Pasted files shared successfully:", result);
            }).catch((error) => {
                console.error("Error sharing pasted files:", error);
            });
        }
    }, [shareFiles]);

    const shareNote = useCallback((note, source = 'note') => {
        // note is expected to have { message: <text>, attachments: [File] }
        // Create a unique filename for the temporary text file.
        const timestamp = Date.now();
        const fileName = `___tmp___pourtle___${source}__${timestamp}.txt`;
        // Create a File object from the text message.
        const textFile = new File([note.message], fileName, { type: "text/plain" });
        // Combine the text file with any attachments (or an empty array if none provided)
        const allFiles = [textFile, ...(note.attachments || [])];
        // Call shareFiles with all files and source set to 'note'
        shareFiles(allFiles, source)
            .then(() => console.log("Note shared successfully"))
            .catch((error) => console.error("Error sharing note:", error));
    }, [shareFiles]);

    const onReceived = useCallback((callback) => {
        setReceivedCallback(() => callback);
    }, []);

    // Updated handleReceived to await thumbnail generation before notifying.
    const handleReceived = useCallback(async (message) => {
        if (!message) return;
        const { metadata, data } = message;

        // Remove from receivingFiles.
        setReceivingFiles((prev) =>
            prev.filter((file) => file.fileId !== metadata.fileId)
        );

        const lowerType = metadata.fileType ? metadata.fileType.toLowerCase() : "";
        // If file qualifies and no thumbnail exists, await thumbnail generation.
        if ((lowerType.startsWith("image/") || lowerType.startsWith("video/")) && !metadata.thumbnail) {
            try {
                const blob = new Blob([data], { type: metadata.fileType });
                const thumb = await generateThumbnailForFile(blob);
                metadata.thumbnail = thumb;
            } catch (e) {
                console.error("Error generating thumbnail for received file:", e);
            }
        }

        // Update receivedFiles state and call the received callback.
        setReceivedFiles((prev) => [...prev, { metadata, data }]);
        if (receivedCallback) {
            receivedCallback(metadata, data);
        }
    }, [receivedCallback]);

    // Register onMessage callback from messagingService.
    useEffect(() => {
        messagingService.onMessage(handleReceived);
    }, [receivedCallback, handleReceived]);

    // Register onProgress callback for receiving.
    useEffect(() => {
        messagingService.onProgress((progressInfo) => {
            setReceivingFiles((prev) => {
                const existing = prev.find((f) => f.fileId === progressInfo.fileId);
                if (existing) {
                    return prev.map((f) =>
                        f.fileId === progressInfo.fileId ? { ...f, progress: progressInfo.fileProgress } : f
                    );
                } else {
                    return [...prev, { fileId: progressInfo.fileId, progress: progressInfo.fileProgress }];
                }
            });
        });
        messagingService.onFileComplete((fileId) => {
            setReceivingFiles((prev) => prev.filter((f) => f.fileId !== fileId));
        });
    }, []);

    useEffect(() => {
        setReady(isConnected);
    }, [isConnected]);

    const deleteSentFile = useCallback((fileId) => {
        setSentFiles((prev) => prev.filter((f) => f.metadata.fileId !== fileId));
    }, []);

    const deleteReceivedFile = useCallback((fileId) => {
        setReceivedFiles((prev) => prev.filter((f) => f.metadata.fileId !== fileId));
    }, []);

    const value = useMemo(() => ({
        ready,
        share,
        shareFiles,
        sharePaste,
        shareNote,
        onReceived,
        deleteSentFile,
        deleteReceivedFile,
        sendingFiles,
        sentFiles,
        receivingFiles,
        receivedFiles,
    }), [ready, share, shareFiles, sharePaste, shareNote, onReceived, deleteSentFile, deleteReceivedFile, sendingFiles, sentFiles, receivingFiles, receivedFiles]);

    return (
        <SharingContext.Provider value={value}>
            {children}
        </SharingContext.Provider>
    );
};

SharingProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useSharing = () => useContext(SharingContext);

export default React.memo(SharingProvider);