// src/services/messagingService.js
import webRTCChannel from './webRTCChannel';

class MessagingService {
    constructor() {
        this._onInitializedCallback = null;
        this._onConnectedCallback = null;
        this._onDisconnectedCallback = null;
        this.connected = false;
        this.initialized = false;

        webRTCChannel.onInitialized(() => {
            this.initialized = true;
            console.log('MesagingService: RTC channel initialized');
            this._onInitializedCallback();
        })

        // Listen to the RTC layer's connected event and update our state.
        webRTCChannel.onConnected(() => {
            this.connected = true;
            console.log("MessagingService: RTC connection established.");
            if (this._onConnectedCallback) {
                this._onConnectedCallback();
            }
        });
        webRTCChannel.onDisconnected(() => {
            this.connected = false;
            console.log("MessagingService: RTC disconnected.");
            if (this._onDisconnectedCallback) {
                this._onDisconnectedCallback();
            }
        });
    }

    isConnected() {
        return this.connected;
    }

    /**
     * Connects to the messaging service by opening the underlying WebRTCChannel.
     * If sessionCode is provided, it will join that session; otherwise, it will create a new session.
     * Always returns an object with the active session code.
     * @param {string|null} sessionCode
     * @returns {Promise<{ sessionCode: string }>}
     */
    async connect(sessionCode = null) {
        const activeSessionCode = await webRTCChannel.open(sessionCode);
        return { sessionCode: activeSessionCode };
    }

    /**
     * Sends a message over the RTC data channel.
     * Throws an error if there is no active connection.
     * @param {string|object} message The message to send.
     * @returns {Promise<string>}
     */
    async sendMessage(message) {
        if (!this.connected) {
            throw new Error("Cannot send message: No active RTC connection.");
        }
        return await webRTCChannel.sendDataMessage(message);
    }

    /**
     * Registers a callback to be invoked when a data channel message is received.
     * @param {function} callback
     */
    async onMessage(callback) {
        webRTCChannel.onDataMessage(callback);
        return;
    }

    /**
     * Removes a previously registered data channel message callback.
     * @param {function} callback
     */
    async removeMessageListener(callback) {
        if (webRTCChannel.onDataChannelMessage === callback) {
            webRTCChannel.onDataChannelMessage = null;
        }
        return;
    }

    /**
     * Closes the underlying RTC connection.
     * @returns {Promise<string>}
     */
    async disconnect() {
        if (webRTCChannel.peerConnection) {
            webRTCChannel.peerConnection.close();
            webRTCChannel.peerConnection = null;
            this.connected = false;
        }
        return "Disconnected";
    }

    /**
     * Registers a callback that is fired when the RTC channel is initialized.
     * @param {function} callback
     */
    async onInitialized(callback) {
        this._onInitializedCallback = callback;
        return;
    }

    /**
     * Registers a callback that is fired when the RTC connection is fully established.
     * @param {function} callback
     */
    async onConnected(callback) {
        this._onConnectedCallback = callback;
        return;
    }

    /**
     * Registers a callback that is fired when the RTC connection is disconnected.
     * @param {function} callback
     */
    async onDisconnected(callback) {
        this._onDisconnectedCallback = callback;
        return;
    }
}

const messagingServiceInstance = new MessagingService();
export default messagingServiceInstance;