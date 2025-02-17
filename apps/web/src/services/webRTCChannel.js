// src/services/webRTCChannel.js

import signalingChannel from './signalingChannel';

class WebRTCChannel {
    constructor(iceServers = [{ urls: 'stun:stun.l.google.com:19302' }]) {
        this.iceServers = iceServers;
        this.peerConnection = null;
        this.dataChannel = null;
        // Callback for data channel messages.
        this.onDataChannelMessage = null;
        // Callback for when the RTC connection is fully established.
        this._onConnectedCallback = null;
        // Flag to prevent duplicate negotiation.
        this.negotiationStarted = false;

        // Listen for partnerConnected events from signalingChannel.
        signalingChannel.onPartnerConnected(() => {
            console.log("WebRTCChannel received partnerConnected event from signalingChannel");
            if (!this.negotiationStarted) {
                this.negotiationStarted = true;
                this.startNegotiation();
            }
        });
    }

    /**
     * Opens the RTC layer by ensuring the underlying signaling channel is open.
     * Accepts an optional sessionCode:
     *   - If provided, join that session.
     *   - If not, start a new session.
     * Always returns the active session code.
     */
    async open(sessionCode = null) {
        // Open the signaling channel and get the active session code.
        const activeSessionCode = await signalingChannel.open(sessionCode);
        this.sessionCode = activeSessionCode;
        console.log("WebRTCChannel: Signaling channel open, session code:", activeSessionCode);

        signalingChannel.addMessageListener((data) => {
            if (data.action === "signal") {
                if (data.type === "offer") {
                    console.log("WebRTCChannel: Received offer signal");
                    this.handleOffer(data.sdp);
                } else if (data.type === "answer") {
                    console.log("WebRTCChannel: Received answer signal");
                    this.handleAnswer(data.sdp);
                } else if (data.type === "ice") {
                    console.log("WebRTCChannel: Received ICE candidate");
                    this.handleIceCandidate(data.candidate);
                }
            }
        });
        // Do not begin RTC negotiation until partnerConnected event fires.
        return activeSessionCode;
    }

    /**
     * Begins RTC negotiation once the partnerConnected event is received.
     * For an initiator, this creates a data channel and an offer.
     * For a joiner, it waits for the remote offer (handled via the listener above).
     */
    async startNegotiation() {
        if (!this.peerConnection) {
            this.initializePeerConnection();
        }
        // If this client is the initiator, create an offer.
        if (this.isInitiator()) {
            console.log("WebRTCChannel: Acting as initiator. Creating data channel and offer.");
            this.createDataChannel();
            await this.createOffer();
        } else {
            console.log("WebRTCChannel: Acting as joiner. Waiting for remote offer...");
            // For joiners, the offer is received via the registered listener.
        }
    }

    /**
     * Determines if this client is the initiator.
     * For simplicity, we assume that if no session code was supplied to open(),
     * then this client is the initiator. (Alternatively, signalingChannel could expose an explicit flag.)
     */
    isInitiator() {
        return signalingChannel.isInitiator();
    }

    /**
     * Initializes the RTCPeerConnection and sets up event listeners.
     */
    initializePeerConnection() {
        this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });

        // ICE candidate handling.
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                signalingChannel.sendMessage({
                    action: "signal",
                    type: "ice",
                    candidate: event.candidate,
                    sessionCode: this.sessionCode,
                });
            }
        };

        // For joiners: listen for incoming data channel.
        this.peerConnection.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this.setupDataChannel();
        };

        this.peerConnection.onconnectionstatechange = () => {
            console.log("Peer connection state:", this.peerConnection.connectionState);
            if (
                this.peerConnection.connectionState === "connected" ||
                this.peerConnection.connectionState === "completed"
            ) {
                if (this._onConnectedCallback) {
                    this._onConnectedCallback();
                }
            }
        };
    }

    /**
     * For initiators: creates a data channel and sets up its event listeners.
     */
    createDataChannel(label = "data") {
        if (!this.peerConnection) this.initializePeerConnection();
        this.dataChannel = this.peerConnection.createDataChannel(label);
        this.setupDataChannel();
    }

    /**
     * Sets up the data channel event handlers.
     */
    setupDataChannel() {
        if (!this.dataChannel) return;
        this.dataChannel.onopen = () => {
            console.log("Data channel opened");
            if (this._onConnectedCallback) {
                this._onConnectedCallback();
            }
            // Optionally, close the signaling channel once RTC is established.
            signalingChannel.close();
        };
        this.dataChannel.onmessage = (event) => {
            console.log("Received data channel message:", event.data);
            if (this.onDataChannelMessage) {
                this.onDataChannelMessage(JSON.parse(event.data));
            }
        };
        this.dataChannel.onerror = (error) => {
            console.error("Data channel error:", error);
        };
    }

    /**
     * Creates an SDP offer (for initiators), sets the local description, and sends the offer via the signaling channel.
     */
    async createOffer() {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        await signalingChannel.sendMessage({
            action: "signal",
            type: "offer",
            sdp: offer.sdp,
            sessionCode: this.sessionCode,
        });
    }

    /**
     * Handles an incoming SDP offer (for joiners).
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
            sessionCode: this.sessionCode,
        });
    }

    /**
     * Handles an incoming SDP answer.
     */
    async handleAnswer(sdp) {
        await this.peerConnection.setRemoteDescription({ type: "answer", sdp });
    }

    /**
     * Handles an incoming ICE candidate.
     */
    async handleIceCandidate(candidate) {
        try {
            await this.peerConnection.addIceCandidate(candidate);
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
        }
    }

    /**
     * Sends a message over the data channel.
     */
    async sendDataMessage(message) {
        if (!this.dataChannel || this.dataChannel.readyState !== "open") {
            throw new Error("Data channel is not open");
        }
        this.dataChannel.send(JSON.stringify(message));
        return "Data message sent";
    }

    /**
     * Registers a callback for incoming data channel messages.
     */
    onDataMessage(callback) {
        this.onDataChannelMessage = callback;
    }

    /**
     * Removes the data channel message listener.
     */
    removeDataMessage() {
        this.onDataChannelMessage = null;
    }

    /**
     * Registers a callback to be invoked when the RTC connection is fully established.
     */
    onConnected(callback) {
        this._onConnectedCallback = callback;
    }
}

const webRTCChannelInstance = new WebRTCChannel();
export default webRTCChannelInstance;