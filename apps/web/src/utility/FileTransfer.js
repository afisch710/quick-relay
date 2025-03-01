// src/services/FileTransfer.js

export class FileTransfer {
    constructor(metadata) {
        // metadata should include fileId, fileName, fileType, fileSize, totalChunks, etc.
        this.metadata = metadata;
        this.totalChunks = metadata.totalChunks;
        this.chunks = {};
    }

    // Encodes a chunk: produces an ArrayBuffer that consists of a 2-byte little-endian header length,
    // followed by header JSON bytes and then the chunk's binary data.
    static encodeChunk(headerObj, chunkData) {
        const encoder = new TextEncoder();
        const headerStr = JSON.stringify(headerObj);
        const headerBytes = encoder.encode(headerStr);
        const headerLengthBuffer = new Uint16Array([headerBytes.length]).buffer;
        const combinedBuffer = new Uint8Array(
            2 + headerBytes.length + chunkData.byteLength
        );
        combinedBuffer.set(new Uint8Array(headerLengthBuffer), 0);
        combinedBuffer.set(headerBytes, 2);
        combinedBuffer.set(new Uint8Array(chunkData), 2 + headerBytes.length);
        return combinedBuffer.buffer;
    }

    // Splits the file data into chunks.
    // Returns an object with updated metadata (including fileId and totalChunks) and an array of chunks.
    static chunkFile(fileId, metadata, data, chunkSize = 16 * 1024) {
        const totalSize = data.byteLength;
        const totalChunks = Math.ceil(totalSize / chunkSize);
        const updatedMetadata = { ...metadata, fileId, totalChunks };
        const chunks = [];
        for (let index = 0; index < totalChunks; index++) {
            const start = index * chunkSize;
            const end = Math.min(start + chunkSize, totalSize);
            const chunkData = data.slice(start, end);
            const encodedChunk = FileTransfer.encodeChunk({ fileId, index }, chunkData);
            chunks.push(encodedChunk);
        }
        return { metadata: updatedMetadata, chunks };
    }

    // Instance method to add a received chunk.
    addChunk(index, chunkData) {
        this.chunks[index] = chunkData;
    }

    // Checks if all chunks have been received.
    isComplete() {
        return Object.keys(this.chunks).length === this.totalChunks;
    }

    // Reassembles all chunks into a single ArrayBuffer.
    assembleFile() {
        const totalSize = Object.values(this.chunks).reduce(
            (acc, chunk) => acc + chunk.byteLength,
            0
        );
        const fileBuffer = new Uint8Array(totalSize);
        let offset = 0;
        for (let i = 0; i < this.totalChunks; i++) {
            const chunk = this.chunks[i];
            fileBuffer.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
        }
        return fileBuffer.buffer;
    }
}