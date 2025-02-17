// src/services/messagingService.js

import BaseService from './baseService.js';
import MessagingWorker from '../workers/messaging/messaging.worker.js';

class MessagingService extends BaseService {
    constructor() {
        super('messaging', MessagingWorker);
    }

    /**
     * Connect to the messaging service.
     * If sessionCode is provided, attempt to join that session.
     * Otherwise, create a new session.
     * Always returns a session code.
     */
    async connect(sessionCode = null) {
        // Under the hood, the worker's "connect" method can be modified to handle an optional sessionCode.
        return await this.callWorkerMethod('connect', sessionCode);
    }

    async sendMessage(message) {
        return await this.callWorkerMethod('sendMessage', message);
    }

    async onMessage(callback) {
        return await this.callWorkerMethod('addMessageListener', callback);
    }

    async removeMessageListener(callback) {
        return await this.callWorkerMethod('removeMessageListener', callback);
    }

    async disconnect() {
        return await this.callWorkerMethod('disconnect');
    }
}

const messagingServiceInstance = new MessagingService();
export default messagingServiceInstance;