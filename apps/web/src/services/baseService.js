// src/services/baseService.js

import workerManager from '../workers/WorkerManager';
import { proxy } from 'comlink';

class BaseService {
    constructor(serviceName, WorkerClass) {
        if (new.target === BaseService) {
            throw new TypeError('Cannot construct BaseService instances directly');
        }
        this.serviceName = serviceName;
        this.WorkerClass = WorkerClass;
    }

    async dispose() {
        // Nothing to do here, because we don't hold a single worker ref
        // If we had some one-time caches or such, handle them here
    }

    /**
     * Calls a method exposed by the worker.
     * We acquire a worker from WorkerManager, call the method, then release it.
     */
    async callWorkerMethod(methodName, ...args) {
        // Acquire from pool
        const workerService = await workerManager.acquireWorker(this.serviceName, this.WorkerClass);
        try {
            // Convert any function args to Comlink proxies
            const processedArgs = args.map((arg) =>
                typeof arg === 'function' ? proxy(arg) : arg
            );

            if (typeof workerService[methodName] !== 'function') {
                throw new Error(`Method ${methodName} does not exist on worker ${this.serviceName}`);
            }

            return await workerService[methodName](...processedArgs);
        } catch (error) {
            console.error(`Error in ${methodName}:`, error);
            throw error;
        } finally {
            // Release the worker back to the pool
            await workerManager.releaseWorker(this.serviceName, workerService);
        }
    }
}

export default BaseService;