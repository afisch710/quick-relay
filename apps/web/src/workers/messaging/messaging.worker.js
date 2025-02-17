// src/workers/messaging/messaging.worker.js
import { expose } from 'comlink';
import messagingService from './worker.MessagingService';

const connect = async (sessionCode = null) => {
    return await messagingService.connect(sessionCode);
};

const sendMessage = async (message) => await messagingService.sendMessage(message);
const addMessageListener = async (callback) => await messagingService.addMessageListener(callback);
const removeMessageListener = async (callback) => await messagingService.removeMessageListener(callback);
const disconnect = async () => await messagingService.disconnect();

const messagingAPI = {
    connect,
    sendMessage,
    addMessageListener,
    removeMessageListener,
    disconnect,
};

expose(messagingAPI);