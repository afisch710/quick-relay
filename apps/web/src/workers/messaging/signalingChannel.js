// src/workers/signaling/signalingChannel.js

class SignalingChannel {
    constructor() {
        this.url = "wss://3k91muimk2.execute-api.us-east-1.amazonaws.com/prod";
        this.websocket = null;
        this.sessionCode = null;
        this.messageCallback = null;
        this.partnerConnected = false;
        this.partnerConnectedCallback = null;
    }

    // Private method to establish the WebSocket connection.
    async #connect() {
        return new Promise((resolve, reject) => {
            this.websocket = new WebSocket(this.url);
            this.websocket.onopen = () => {
                console.log("WebSocket connection established to", this.url);
                resolve("Connected");
            };
            this.websocket.onerror = (err) => {
                console.error("WebSocket error", err);
                reject(err);
            };
            // Process incoming messages.
            this.websocket.onmessage = (event) => {
                let data;
                try {
                    data = JSON.parse(event.data);
                } catch (e) {
                    console.error("Error parsing incoming message:", e);
                    return;
                }
                // Handle ready signals internally.
                if (data.action === "signal" && data.type === "ready") {
                    if (!this.partnerConnected) {
                        this.partnerConnected = true;
                        console.log("Partner ready signal received.");
                        if (this.partnerConnectedCallback) {
                            this.partnerConnectedCallback(data);
                        }
                    }
                    // Do not propagate the ready message externally.
                    return;
                }
                // For all other messages, pass them to the registered messageCallback.
                if (this.messageCallback) {
                    this.messageCallback(data);
                } else {
                    console.log("Received message:", data);
                }
            };
        });
    }

    // Opens the connection; if sessionCode is provided, it joins that session.
    async open(sessionCode = null) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            return;
        }
        await this.#connect();

        if (sessionCode) {
            try {
                await this.#joinSession(sessionCode);
                this.sessionCode = sessionCode;
                // After joining, send a ready signal internally.
                await this.sendMessage({ action: "signal", sessionCode: this.sessionCode, type: "ready" });
            } catch (error) {
                console.error("Join session error:", error);
            }
        } else {
            // Start a new session and store the session code.
            this.sessionCode = await this.#startSession();
            // For new sessions, wait for the partner's ready signal.
        }
    }

    close() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }

    async sendMessage(message) {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket is not open");
        }
        this.websocket.send(JSON.stringify(message));
        return "Message sent";
    }

    addMessageListener(callback) {
        this.messageCallback = callback;
    }

    removeMessageListener(callback) {
        if (this.messageCallback === callback) {
            this.messageCallback = null;
        }
    }

    // Private method to create a session.
    async #startSession() {
        const initMessage = { action: "init" };
        this.websocket.send(JSON.stringify(initMessage));
        return new Promise((resolve, reject) => {
            const onInit = (data) => {
                if (data.message && data.sessionCode) {
                    this.sessionCode = data.sessionCode;
                    this.removeMessageListener(onInit);
                    resolve(data.sessionCode);
                } else if (data.error) {
                    this.removeMessageListener(onInit);
                    reject(data.error);
                }
            };
            this.addMessageListener(onInit);
        });
    }

    // Private method to join an existing session.
    async #joinSession(sessionCode) {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket is not connected");
        }
        const initMessage = { action: "init", sessionCode };
        this.websocket.send(JSON.stringify(initMessage));
        return new Promise((resolve, reject) => {
            const onJoin = (data) => {
                if (data.message && data.sessionCode) {
                    this.sessionCode = data.sessionCode;
                    this.removeMessageListener(onJoin);
                    resolve(data);
                } else if (data.error) {
                    this.removeMessageListener(onJoin);
                    reject(data.error);
                }
            };
            this.addMessageListener(onJoin);
        });
    }

    // Allows external code to register a callback that is invoked when a partner is ready.
    onPartnerConnected(callback) {
        this.partnerConnectedCallback = callback;
    }
}

export default new SignalingChannel();