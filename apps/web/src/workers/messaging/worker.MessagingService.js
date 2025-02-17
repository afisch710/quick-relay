// src/workers/messaging/worker.MessagingService.js
import webRTCChannel from './webRTCChannel';

class MessagingService {
    /**
     * Connect to the messaging service.
     * If sessionCode is provided, join that session.
     * Otherwise, create a new session.
     * Always returns a session code.
     */
    async connect(sessionCode = null) {
        // Ensure that the underlying WebRTC channel is initialized.
        if (!webRTCChannel.peerConnection) {
            webRTCChannel.initializePeerConnection();
        }
        if (sessionCode) {
            // Join existing session.
            const response = await webRTCChannel.joinSession(sessionCode);
            // Optionally send a "ready" signal here.
            await webRTCChannel.sendDataMessage(JSON.stringify({ action: "signal", type: "ready", sessionCode }));
            return response; // This should include the session code.
        } else {
            // Start a new session.
            const response = await webRTCChannel.startSession();
            // For a new session, wait for a partner ready message.
            return response; // This should include the new session code.
        }
    }

    async sendMessage(message) {
        return await webRTCChannel.sendDataMessage(message);
    }

    async addMessageListener(callback) {
        webRTCChannel.onDataMessage(callback);
        return;
    }

    async removeMessageListener(callback) {
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