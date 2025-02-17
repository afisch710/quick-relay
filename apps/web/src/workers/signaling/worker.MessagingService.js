// src/workers/messaging/worker.MessagingService.js
import webRTCChannel from './webRTCChannel';

class MessagingService {
    async connect() {
        // Ensure the peer connection is initialized.
        if (!webRTCChannel.peerConnection) {
            // In a real scenario you might want to handle negotiation first.
            webRTCChannel.initializePeerConnection();
        }
        return "Connected via WebRTC";
    }

    async sendMessage(message) {
        // Delegate to the WebRTC channel's data channel sender.
        return await webRTCChannel.sendDataMessage(message);
    }

    async addMessageListener(callback) {
        // Register a callback to be invoked when a data channel message arrives.
        webRTCChannel.onDataMessage(callback);
        return;
    }

    async removeMessageListener(callback) {
        // For simplicity, we clear the listener if it matches.
        if (webRTCChannel.onDataChannelMessage === callback) {
            webRTCChannel.onDataChannelMessage = null;
        }
        return;
    }

    async disconnect() {
        if (webRTCChannel.peerConnection) {
            webRTCChannel.peerConnection.close();
            webRTCChannel.peerConnection = null;
        }
        return "Disconnected";
    }
}

const messagingServiceInstance = new MessagingService();
export default messagingServiceInstance;