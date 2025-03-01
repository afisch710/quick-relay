// __tests__/FileTransfer.test.js

import { FileTransfer } from "../utility/FileTransfer";

describe('FileTransfer', () => {
    it('should chunk and reassemble file data correctly', () => {
        // Create sample data (a simple text string).
        const originalText = 'This is a test file content.';
        const encoder = new TextEncoder();
        const originalData = encoder.encode(originalText).buffer;

        // Set up file metadata.
        const metadata = { fileName: 'test.txt', fileType: 'text/plain', fileSize: originalData.byteLength };

        // Use a small chunk size to force multiple chunks.
        const chunkSize = 10;
        const fileId = 'testFileId';

        // Chunk the file.
        const { metadata: updatedMetadata, chunks } = FileTransfer.chunkFile(fileId, metadata, originalData, chunkSize);

        // Create a new FileTransfer instance to simulate receiving chunks.
        const fileReceiver = new FileTransfer(updatedMetadata);

        // Simulate processing each received chunk.
        chunks.forEach(chunk => {
            // Our protocol: first 2 bytes represent header length in little-endian.
            const dataView = new DataView(chunk);
            const headerLength = dataView.getUint16(0, true);
            const headerBytes = new Uint8Array(chunk, 2, headerLength);
            const headerStr = new TextDecoder().decode(headerBytes);
            const headerObj = JSON.parse(headerStr);

            // Extract the binary chunk (excluding the header).
            const chunkData = chunk.slice(2 + headerLength);

            // Add the chunk to the receiver instance.
            fileReceiver.addChunk(headerObj.index, chunkData);
        });

        // Verify that all chunks have been received.
        expect(fileReceiver.isComplete()).toBe(true);

        // Reassemble the file.
        const assembledData = fileReceiver.assembleFile();

        // Compare the assembled data with the original.
        const originalArray = new Uint8Array(originalData);
        const assembledArray = new Uint8Array(assembledData);
        expect(assembledArray.length).toBe(originalArray.length);

        for (let i = 0; i < assembledArray.length; i++) {
            expect(assembledArray[i]).toBe(originalArray[i]);
        }
    });
});