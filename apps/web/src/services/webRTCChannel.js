// src/services/webRTCChannel.js

import SignalingChannel from './signalingChannel';

export default class WebRTCChannel {
    constructor(iceServers = [{ urls: 'stun:stun.l.google.com:19302' }]) {
        this.iceServers = iceServers;
        this.peerConnection = null;
        this.dataChannel = null;
        this.onDataChannelMessage = null;
        this._onConnectedCallback = null;
        this._onDisconnectedCallback = null;
        this._onInitializedCallback = null;
        this.negotiationStarted = false;
        this.incomingFileTransfers = {};
        this.messageQueue = [];
        this.queueDraining = false;
        this.signalingChannel = new SignalingChannel();
        this.signalingChannel.onInitialized(() => {
            console.log('Signaling channel initialized');
            if (this._onInitializedCallback) this._onInitializedCallback();
        });
        this.signalingChannel.onPartnerConnected(() => {
            console.log("Partner connected event received");
            this.startNegotiation();
        });
    }

    async open(sessionCode = null) {
        const activeSessionCode = await this.signalingChannel.open(sessionCode);
        this.sessionCode = activeSessionCode;
        console.log("Signaling channel open, session code:", activeSessionCode);
        this.signalingChannel.addMessageListener((data) => {
            if (data.action === "signal") {
                if (data.type === "offer") {
                    console.log("Received offer signal");
                    this.handleOffer(data.sdp);
                } else if (data.type === "answer") {
                    console.log("Received answer signal");
                    this.handleAnswer(data.sdp);
                } else if (data.type === "ice") {
                    console.log("Received ICE candidate");
                    this.handleIceCandidate(data.candidate);
                }
            }
        });
        return activeSessionCode;
    }

    close() {
        this.signalingChannel?.close();
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.negotiationStarted = false;
        this.pendingCandidates = [];
    }

    async sendData(message) {
        if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
            throw new Error('Data channel is not open');
        }
        // Enqueue the message.
        this.messageQueue.push(message);
        // Await the queue to drain.
        await this.drainQueue();
        return true;
    }

    async safeSend(message) {
        while (true) {
            try {
                this.dataChannel.send(message);
                return; // Sent successfully.
            } catch (err) {
                if (err.message.includes("RTCDataChannel send queue is full")) {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                } else {
                    throw err;
                }
            }
        }
    }

    drainQueue() {
        return new Promise((resolve) => {
            const processNext = async () => {
                if (!this.dataChannel || this.dataChannel.readyState !== "open") {
                    return resolve();
                }
                if (this.messageQueue.length === 0) {
                    return resolve();
                }
                const nextMessage = this.messageQueue.shift();
                try {
                    await this.safeSend(nextMessage);
                } catch (err) {
                    console.error("Error sending data from queue:", err);
                }
                setTimeout(processNext, 0);
            };
            processNext();
        });
    }

    /**
     * Begins RTC negotiation once the partnerConnected event is received.
     * For an initiator, this creates a data channel and an offer.
     * For a joiner, it waits for the remote offer (handled via the listener above).
     */
    async startNegotiation() {
        if (this.negotiationStarted) {
            console.warn("Negotiation already started");
            return;
        }
        this.negotiationStarted = true;
        if (!this.peerConnection) {
            this.initializePeerConnection();
        }
        if (this.isInitiator()) {
            this.createDataChannel();
            try {
                await this.createOffer();
            } catch (error) {
                console.error("Error creating offer:", error);
                this.negotiationStarted = false;
            }
        } else {
            // For joiners, rely on the remote offer via this.signalingChannel.
            console.log("Waiting for remote offer...");
        }
    }

    /**
     * Determines if this client is the initiator.
     * For simplicity, we assume that if no session code was supplied to open(),
     * then this client is the initiator. (Alternatively, this.signalingChannel could expose an explicit flag.)
     */
    isInitiator() {
        return this.signalingChannel.isInitiator();
    }

    /**
     * Initializes the RTCPeerConnection and sets up event listeners.
     */
    initializePeerConnection() {
        this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });

        // ICE candidate handling.
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.signalingChannel.sendMessage({
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

                // Reset negotiation status
                this.negotiationStarted = false;

                // Optionally, close the signaling channel once RTC is established.
                this.signalingChannel.close();
            } else if (this.peerConnection.connectionState === "disconnected") {
                if (this._onDisconnectedCallback) {
                    this._onDisconnectedCallback();
                }

                this.negotiationStarted = false;
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
            // Send a handshake message
            this.dataChannel.send(JSON.stringify({ type: 'ready' }));
            if (this._onConnectedCallback) {
                this._onConnectedCallback();
            }
        };

        this.dataChannel.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'ready') {
                    console.log("Received ready handshake");
                    // Now both peers know they are ready.
                } else {
                    if (this.onDataChannelMessage) {
                        this.onDataChannelMessage(event.data);
                    }
                }
            } catch (e) {
                console.warn(e)
                // If the message isn’t JSON, pass it along.
                if (this.onDataChannelMessage) {
                    this.onDataChannelMessage(event.data);
                }
            }
        };

        // ... (rest of onerror and binaryType settings)
    }

    /**
     * Creates an SDP offer (for initiators), sets the local description, and sends the offer via the signaling channel.
     */
    async createOffer() {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        await this.signalingChannel.sendMessage({
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
        try {
            // Set the remote description with the incoming offer.
            await this.peerConnection.setRemoteDescription({ type: "offer", sdp });

            // If there are any buffered ICE candidates, add them now.
            if (this.pendingCandidates && this.pendingCandidates.length > 0) {
                for (const candidate of this.pendingCandidates) {
                    try {
                        await this.peerConnection.addIceCandidate(candidate);
                    } catch (error) {
                        console.error("Error adding buffered ICE candidate:", error);
                    }
                }
                // Clear the buffer after adding candidates.
                this.pendingCandidates = [];
            }

            // Create an answer now that the remote description is set.
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            // Send the answer via the signaling channel.
            await this.signalingChannel.sendMessage({
                action: "signal",
                type: "answer",
                sdp: answer.sdp,
                sessionCode: this.sessionCode,
            });
        } catch (error) {
            console.error("Error during offer handling:", error);
        }
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
            if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
                await this.peerConnection.addIceCandidate(candidate);
            } else {
                this.pendingCandidates = this.pendingCandidates || [];
                this.pendingCandidates.push(candidate);
            }
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
        }
    }

    /**
     * Sends a message over the data channel.
     * For binary data, this method implements chunking.
     */
    // async sendData(data) {
    //     if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
    //         throw new Error('Data channel is not open');
    //     }
    //     this.dataChannel.send(data);
    //     return true;
    // }

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

    /**
     * Registers a callback to be invoked when the RTC connection is disconnected.
     */
    onDisconnected(callback) {
        this._onDisconnectedCallback = callback;
    }

    /**
     * Registers a callback to be invoked when the RTC signaling channel is initialized.
     */
    onInitialized(callback) {
        this._onInitializedCallback = callback;
    }
}

// const webRTCChannelInstance = new WebRTCChannel();
// export default webRTCChannelInstance;