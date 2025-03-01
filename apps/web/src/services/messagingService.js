// src/services/messagingService.js

import WebRTCChannel from './webRTCChannel';
import { FileTransfer } from '../utility/FileTransfer';

class MessagingService {
    constructor() {
        this._onInitializedCallback = null;
        this._onConnectedCallback = null;
        this._onDisconnectedCallback = null;
        this._onSignalingChannelClosedCallback = null;
        this.connected = false;
        this.initialized = false;
        // Ongoing transfers keyed by fileId.
        this.ongoingFileTransfers = {};
        // For group transfers, keyed by groupId.
        this.fileGroups = {};
        // Callbacks:
        this.onMessageCallback = null;      // Called when a complete file (or group) is received.
        this.onProgressCallback = null;     // Called for receiving progress events.
        this.onFileCompleteCallback = null; // Called when a file is fully received.
        this._initialize();
    }

    _initialize() {
        this.webRTCChannel = new WebRTCChannel();
        this.webRTCChannel.onInitialized(() => {
            this.initialized = true;
            if (this._onInitializedCallback) this._onInitializedCallback();
        });
        this.webRTCChannel.onConnected(() => {
            this.connected = true;
            if (this._onConnectedCallback) this._onConnectedCallback();
        });
        this.webRTCChannel.onDisconnected(() => {
            this.connected = false;
            if (this._onDisconnectedCallback) this._onDisconnectedCallback();
            this.webRTCChannel.close();
            this.webRTCChannel = null;
        });
        // Listen for incoming messages.
        this.webRTCChannel.onDataMessage((msg) => {
            this.handleIncomingMessage(msg);
        });
        this.webRTCChannel.onSignalingChannelClosed((intentional) => {
            if (this._onSignalingChannelClosedCallback) this._onSignalingChannelClosedCallback(intentional);
        })
    }

    async onMessage(callback) {
        this.onMessageCallback = callback;
    }

    async onProgress(callback) {
        this.onProgressCallback = callback;
    }

    async onFileComplete(callback) {
        this.onFileCompleteCallback = callback;
    }

    async removeMessageListener(callback) {
        if (this.onMessageCallback === callback) {
            this.onMessageCallback = null;
        }
    }

    isConnected() {
        return this.connected;
    }

    // Helper: get byte length of data.
    _getByteLength(data) {
        if (data instanceof ArrayBuffer) return data.byteLength;
        if (ArrayBuffer.isView(data)) return data.byteLength;
        return 0;
    }

    /**
     * Sends file data. Supports single file or group. Always passed in as an array
     * onProgress callback receives: { fileId, fileProgress, totalProgress }
     */
    async sendData(metadata, data, onProgress) {
        const metaArray = Array.isArray(metadata) ? metadata : [metadata];
        const dataArray = Array.isArray(data) ? data : [data];
        if (metaArray.length !== dataArray.length) {
            throw new Error("Metadata and data arrays must have the same length.");
        }
        // Calculate total bytes across all files.
        const totalPayload = dataArray.reduce((sum, d) => sum + this._getByteLength(d), 0);
        let overallBytesSent = 0;
        const groupId = metaArray.length > 1 ? Math.random().toString(36).substring(2) + Date.now() : null;
        // Send group start message.
        await this.webRTCChannel.sendData(JSON.stringify({
            type: "file-transfer-group",
            action: "start",
            groupId,
            totalFiles: metaArray.length,
            totalBytes: totalPayload,
        }));
        // Process each file sequentially.
        for (let i = 0; i < metaArray.length; i++) {
            const existingFileId = metaArray[i].fileId;
            const fileId = existingFileId || (Math.random().toString(36).substring(2) + Date.now());
            const fileBytes = this._getByteLength(dataArray[i]);
            const fileMetadata = { ...metaArray[i], fileId, groupId, totalBytes: fileBytes };
            // Ensure timestamp exists:
            if (!fileMetadata.timestamp) {
                fileMetadata.timestamp = new Date().toISOString();
            }
            metaArray[i] = fileMetadata;
            // For group transfers, inside the loop for each file:
            const { metadata: updatedMetadata, chunks } = FileTransfer.chunkFile(fileId, fileMetadata, dataArray[i]);
            // Remove thumbnail from metadata before sending as the data is too large
            // eslint-disable-next-line no-unused-vars
            const { thumbnail: _thumbnail, ...metadataWithoutThumbnail } = updatedMetadata;
            await this.webRTCChannel.sendData(
                JSON.stringify({
                    type: "file-transfer",
                    action: "start",
                    ...metadataWithoutThumbnail,
                })
            );
            const totalChunks = chunks.length;
            for (let j = 0; j < totalChunks; j++) {
                await this.webRTCChannel.sendData(chunks[j]);
                overallBytesSent += chunks[j].byteLength;
                const fileProgress = (j + 1) / totalChunks;
                const totalProgress = overallBytesSent / totalPayload;
                if (onProgress) {
                    onProgress({ fileId, fileProgress, totalProgress });
                }
            }
            // After the loop completes for this file, ensure one last onProgress(1).
            if (onProgress) {
                onProgress({ fileId, fileProgress: 1, totalProgress: overallBytesSent / totalPayload });
            }
        }
        return true;
    }

    // Handling incoming messages and chunks.
    handleIncomingMessage(message) {
        if (typeof message === "string") {
            try {
                const parsed = JSON.parse(message);
                if (parsed.type === "file-transfer-group" && parsed.action === "start") {
                    const { groupId, totalFiles, totalBytes } = parsed;
                    console.log(`Starting group file transfer: groupId ${groupId}, total ${totalFiles}, totalBytes ${totalBytes}`);
                    // Initialize group info.
                    this.fileGroups[groupId] = { totalFiles, totalBytes, bytesReceived: 0, files: [] };
                    return;
                }
                if (parsed.type === "file-transfer" && parsed.action === "start") {
                    console.log(`Received file transfer start for file ${parsed.fileId}`);
                    this.ongoingFileTransfers[parsed.fileId] = new FileTransfer(parsed);
                    return;
                }
                if (this.onMessageCallback) {
                    this.onMessageCallback({ metadata: parsed, data: null });
                }
            } catch (e) {
                console.error("Error parsing incoming JSON message:", e);
            }
        } else if (message instanceof ArrayBuffer) {
            const dataView = new DataView(message);
            const headerLength = dataView.getUint16(0, true);
            const headerBytes = new Uint8Array(message, 2, headerLength);
            const decoder = new TextDecoder();
            const headerStr = decoder.decode(headerBytes);
            let headerObj;
            try {
                headerObj = JSON.parse(headerStr);
            } catch (err) {
                console.error("Failed to parse chunk header:", err);
                return;
            }
            const { fileId, index, groupId } = headerObj;
            const chunkData = message.slice(2 + headerLength);
            const fileTransfer = this.ongoingFileTransfers[fileId];
            if (fileTransfer) {
                fileTransfer.addChunk(index, chunkData);
                const fileProgress = Object.keys(fileTransfer.chunks).length / fileTransfer.totalChunks;
                if (groupId && this.fileGroups[groupId]) {
                    this.fileGroups[groupId].bytesReceived += chunkData.byteLength;
                    const totalProgress = this.fileGroups[groupId].bytesReceived / this.fileGroups[groupId].totalBytes;
                    if (this.onProgressCallback) {
                        this.onProgressCallback({ fileId, metadata: fileTransfer.metadata, fileProgress, totalProgress });
                    }
                } else if (this.onProgressCallback) {
                    this.onProgressCallback({ fileId, metadata: fileTransfer.metadata, fileProgress, totalProgress: fileProgress });
                }
                if (fileTransfer.isComplete()) {
                    const assembledData = fileTransfer.assembleFile();
                    if (groupId) {
                        if (!this.fileGroups[groupId]) {
                            console.warn(`Group ${groupId} not found for file ${fileId}`);
                            return;
                        }
                        this.fileGroups[groupId].files.push({
                            metadata: fileTransfer.metadata,
                            data: assembledData,
                        });
                        if (this.fileGroups[groupId].files.length === this.fileGroups[groupId].totalFiles) {
                            if (this.onMessageCallback) {
                                this.onMessageCallback(this.fileGroups[groupId].files);
                            }
                            delete this.fileGroups[groupId];
                        }
                    } else {
                        if (this.onMessageCallback) {
                            this.onMessageCallback({
                                metadata: fileTransfer.metadata,
                                data: assembledData,
                            });
                        }
                    }
                    // Signal file complete.
                    if (this.onFileCompleteCallback) {
                        this.onFileCompleteCallback(fileId);
                    }
                    delete this.ongoingFileTransfers[fileId];
                }
            } else {
                console.warn(`No ongoing file transfer found for fileId ${fileId}`);
            }
        }
    }

    async connect(sessionCode = null) {
        if (!this.webRTCChannel) {
            this._initialize();
        }
        const activeSessionCode = await this.webRTCChannel.open(sessionCode);
        return { sessionCode: activeSessionCode };
    }

    async disconnect() {
        if (this.webRTCChannel) {
            this.webRTCChannel.close();
            this.webRTCChannel = null;
            this.connected = false;
        }
        return "Disconnected";
    }

    async onInitialized(callback) {
        this._onInitializedCallback = callback;
    }

    async onConnected(callback) {
        this._onConnectedCallback = callback;
    }

    async onDisconnected(callback) {
        this._onDisconnectedCallback = callback;
    }

    async onSignalingChannelClosed(callback) {
        this._onSignalingChannelClosedCallback = callback;
    }
}

const messagingServiceInstance = new MessagingService();
export default messagingServiceInstance;