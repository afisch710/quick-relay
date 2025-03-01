// src/workers/signaling/signalingChannel.js

export default class SignalingChannel {
    constructor() {
        this.id = new Date().getTime();
        this.url = "wss://3k91muimk2.execute-api.us-east-1.amazonaws.com/prod";
        this.websocket = null;
        this.sessionCode = null;
        this.messageCallback = null;
        this.partnerConnectedCallback = null;
        this.partnerConnected = false;
        this.closedCallback = null;
        this.initializedCallback = null;
        this.initiator = false;
        this.intentionalClose = false;
    }

    // Private method to establish the WebSocket connection.
    async #connect() {
        return new Promise((resolve, reject) => {
            this.websocket = new WebSocket(this.url);
            this.websocket.onopen = () => {
                console.log("WebSocket connection established to", this.url);
                resolve("Connected");
                this.initializedCallback();
            };
            this.websocket.onerror = (err) => {
                console.error("WebSocket error", err);
                reject(err);
            };
        });
    }

    async waitForSocketOpen(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const interval = 50;
            let elapsed = 0;
            const check = () => {
                if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                    resolve();
                } else if (elapsed >= timeout) {
                    reject(new Error("WebSocket did not open in time"));
                } else {
                    elapsed += interval;
                    setTimeout(check, interval);
                }
            };
            check();
        });
    }

    /**
     * Opens the signaling channel.
     * If a sessionCode is provided, it attempts to join that session; if not, it creates a new session.
     * Always returns a Promise that resolves with the active session code.
     *
     * @param {string|null} sessionCode Optional session code to join.
     * @returns {Promise<string>} The session code in use.
     */
    async open(sessionCode = null) {
        // reset state
        this.intentionalClose = false;

        // If no connection exists or it is not open, connect.
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            await this.#connect();
            await this.waitForSocketOpen();
        }

        this.websocket.onclose = () => {
            this.closedCallback(this.intentionalClose);
            console.log('Websocket closed');
        }
        // Process incoming messages.
        this.websocket.onmessage = (event) => {
            let data;
            try {
                data = JSON.parse(event.data);
            } catch (e) {
                console.error("Error parsing incoming message:", e);
                return;
            }
            // If this is a ready signal, handle it internally.
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
            // For all other messages, call the registered message callback.
            if (this.messageCallback) {
                this.messageCallback(data);
            } else {
                console.log("Received message:", data);
            }
        };

        this.initiator = !sessionCode;

        if (sessionCode) {
            try {
                await this.#joinSession(sessionCode);
                // After a successful join, send the internal ready signal.
                await this.sendMessage({ action: "signal", sessionCode: this.sessionCode, type: "ready" });
            } catch (error) {
                console.error("Error joining session:", error);
                throw error;
            }
        } else {
            try {
                this.sessionCode = await this.#startSession();
            } catch (error) {
                console.error("Error creating session:", error);
                throw error;
            }
        }
        return this.sessionCode;
    }

    isInitiator() {
        return this.initiator
    }

    /**
     * Closes the WebSocket connection.
     */
    close() {
        this.intentionalClose = true;
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
            this.partnerConnected = false;
        }
    }

    /**
     * Sends a message over the WebSocket.
     * @param {Object} message The message to send.
     * @returns {string} Confirmation string.
     */
    async sendMessage(message) {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            throw new Error("WebSocket is not open");
        }
        this.websocket.send(JSON.stringify(message));
        return "Message sent";
    }

    /**
     * Registers a callback to be invoked when a non-ready message is received.
     * @param {function} callback The function to call on incoming messages.
     */
    addMessageListener(callback) {
        this.messageCallback = callback;
    }

    /**
     * Removes the registered message callback.
     * @param {function} callback The callback to remove.
     */
    removeMessageListener(callback) {
        if (this.messageCallback === callback) {
            this.messageCallback = null;
        }
    }

    /**
     * Sets an external callback that is invoked when a partner ready signal is received.
     * @param {function} callback The callback function.
     */
    onPartnerConnected(callback) {
        this.partnerConnectedCallback = callback;
    }

    /**
    * Sets an external callback that is invoked when websocket is initialized.
    * @param {function} callback The callback function.
    */
    onInitialized(callback) {
        this.initializedCallback = callback;
    }

    /**
    * Sets an external callback that is invoked when websocket is closed.
    * @param {function} callback The callback function.
    */
    onClosed(callback) {
        this.closedCallback = callback;
    }

    // Private method to create a new session.
    async #startSession() {
        const initMessage = { action: "init" };
        // this.websocket.send(JSON.stringify(initMessage));
        await this.sendMessage(initMessage);
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
        // this.websocket.send(JSON.stringify(initMessage));
        await this.sendMessage(initMessage);
        return new Promise((resolve, reject) => {
            const onJoin = (data) => {
                if (data.message && data.sessionCode) {
                    this.sessionCode = data.sessionCode;
                    this.removeMessageListener(onJoin);
                    resolve(data.sessionCode);
                } else if (data.error) {
                    this.removeMessageListener(onJoin);
                    reject(data.error);
                }
            };
            this.addMessageListener(onJoin);
        });
    }
}