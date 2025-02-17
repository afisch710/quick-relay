// src/workers/messaging/webRTCChannel.js

import signalingChannel from './signalingChannel'; // Low-level signaling transport

class WebRTCChannel {
    constructor(iceServers = [{ urls: 'stun:stun.l.google.com:19302' }]) {
        this.iceServers = iceServers;
        this.peerConnection = null;
        this.dataChannel = null;
        this.onDataChannelMessage = null;
        this.isInitiator = false;
    }

    /**
     * Initialize the RTCPeerConnection with ICE servers and set up event listeners.
     */
    initializePeerConnection() {
        this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Send ICE candidate using the underlying signaling channel.
                signalingChannel.sendMessage({
                    action: "signal",
                    type: "ice",
                    candidate: event.candidate,
                    sessionCode: signalingChannel.sessionCode,
                });
            }
        };

        // Listen for incoming data channel for non-initiators.
        this.peerConnection.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.setupDataChannel();
        };

        // (Optional) Handle remote streams if exchanging media.
        this.peerConnection.ontrack = (event) => {
            console.log("Received remote track:", event.streams[0]);
        };

        this.peerConnection.onconnectionstatechange = () => {
            console.log("Peer connection state:", this.peerConnection.connectionState);
            // Optionally, if you prefer to close signaling here instead of waiting for data channel open,
            // you could check for a "connected" or "completed" state here.
        };
    }

    /**
     * For initiators, create a data channel and set up its event listeners.
     */
    createDataChannel(label = 'data') {
        if (!this.peerConnection) this.initializePeerConnection();
        this.dataChannel = this.peerConnection.createDataChannel(label);
        this.setupDataChannel();
    }

    /**
     * Sets up event handlers for the data channel.
     */
    setupDataChannel() {
        if (!this.dataChannel) return;
        this.dataChannel.onopen = () => {
            console.log("Data channel opened");
            // Once the data channel is open, we assume the RTC connection is established.
            // Dismantle the signaling channel.
            console.log("RTC established; closing signaling channel...");
            signalingChannel.close();
        };
        this.dataChannel.onmessage = (event) => {
            console.log("Received data channel message:", event.data);
            if (this.onDataChannelMessage) {
                this.onDataChannelMessage(event.data);
            }
        };
        this.dataChannel.onerror = (error) => {
            console.error("Data channel error:", error);
        };
    }

    /**
     * Initiates the connection by creating an SDP offer.
     */
    async createOffer() {
        if (!this.peerConnection) {
            this.initializePeerConnection();
        }
        this.isInitiator = true;
        // Create data channel if not already created.
        if (!this.dataChannel) {
            this.createDataChannel();
        }
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        // Send the offer over the signaling channel.
        await signalingChannel.sendMessage({
            action: "signal",
            type: "offer",
            sdp: offer.sdp,
            sessionCode: signalingChannel.sessionCode,
        });
    }

    /**
     * Handles an incoming SDP offer (for non-initiators).
     */
    async handleOffer(sdp) {
        if (!this.peerConnection) {
            this.initializePeerConnection();
        }
        await this.peerConnection.setRemoteDescription({ type: "offer", sdp });
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        await signalingChannel.sendMessage({
            action: "signal",
            type: "answer",
            sdp: answer.sdp,
            sessionCode: signalingChannel.sessionCode,
        });
    }

    /**
     * Handles an incoming SDP answer.
     */
    async handleAnswer(sdp) {
        if (!this.peerConnection) return;
        await this.peerConnection.setRemoteDescription({ type: "answer", sdp });
    }

    /**
     * Adds an ICE candidate received via signaling.
     */
    async handleIceCandidate(candidate) {
        if (!this.peerConnection) return;
        try {
            await this.peerConnection.addIceCandidate(candidate);
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
        }
    }

    /**
     * Sends a message via the data channel.
     */
    async sendDataMessage(message) {
        if (!this.dataChannel || this.dataChannel.readyState !== "open") {
            throw new Error("Data channel is not open");
        }
        this.dataChannel.send(message);
        return "Data message sent";
    }

    /**
     * Registers a callback for incoming data channel messages.
     */
    onDataMessage(callback) {
        this.onDataChannelMessage = callback;
    }
}

const webRTCChannelInstance = new WebRTCChannel();
export default webRTCChannelInstance;