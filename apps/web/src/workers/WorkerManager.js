// src/workers/WorkerManager.js

import { Mutex } from 'async-mutex';
import { wrap } from 'comlink';

class WorkerManager {
  constructor() {
    if (WorkerManager.instance) {
      return WorkerManager.instance;
    }

    // Store an array of worker entries (the pool).
    // { [workerType]: Array<WorkerEntry> }
    this.workerPools = {};
    this.mutex = new Mutex();

    // How many workers of a given type we can spin up, total.
    this.maxWorkersPerType = 1;  // Adjust to suit your concurrency needs

    // Idle time before terminating a worker with refCount = 0
    this.idleTimeout = 600000;

    WorkerManager.instance = this;
  }

  /**
   * Creates a new worker entry (instantiates the worker, wraps it, etc.)
   */
  createWorkerEntry(workerType, WorkerClass) {
    const worker = new WorkerClass();
    const service = wrap(worker);

    const workerEntry = {
      worker,
      service,
      refCount: 0,
      idleTimer: null
    };

    // Error handling for the worker
    worker.addEventListener('error', (error) => {
      console.error(`Worker [${workerType}] encountered an error:`, error);
    });

    return workerEntry;
  }

  /**
   * Acquires (or spins up) a worker instance of a specific type.
   * - If an existing worker with a lower refCount is available, use that one.
   * - Otherwise, spin up a new one (if under max limit).
   */
  async acquireWorker(workerType, WorkerClass) {
    const release = await this.mutex.acquire();
    try {
      if (!this.workerPools[workerType]) {
        // Initialize the pool array
        this.workerPools[workerType] = [];
      }

      const pool = this.workerPools[workerType];

      // 1) Find a worker in the pool with the lowest refCount
      let minRefCountEntry = null;
      let minRefCount = Infinity;

      for (const entry of pool) {
        // If the worker is idleTimer set, it means it’s about to be released,
        // but we can still re-use it. Clear that idle timer so it stays alive.
        if (entry.idleTimer) {
          clearTimeout(entry.idleTimer);
          entry.idleTimer = null;
        }
        if (entry.refCount < minRefCount) {
          minRefCount = entry.refCount;
          minRefCountEntry = entry;
        }
      }

      // 2) If there are no workers in the pool or all are “maxed out”
      //    and we haven’t hit the maxWorkersPerType limit, create a new one.
      if (!minRefCountEntry || pool.length < this.maxWorkersPerType) {
        const newEntry = this.createWorkerEntry(workerType, WorkerClass);
        pool.push(newEntry);
        minRefCountEntry = newEntry;
      }

      // 3) Increment the refCount of whichever worker we selected
      minRefCountEntry.refCount += 1;

      return minRefCountEntry.service;
    } finally {
      release();
    }
  }

  /**
   * Releases a worker instance of a specific type.
   * If the refCount hits zero, schedule an idle timer that terminates the worker if it stays free.
   */
  async releaseWorker(workerType, serviceInstance) {
    const release = await this.mutex.acquire();
    try {
      const pool = this.workerPools[workerType];

      if (!pool) {
        console.warn(`Attempted to release worker type [${workerType}] which has no pool.`);
        return;
      }

      // Find the pool entry associated with this serviceInstance
      const entry = pool.find((w) => w.service === serviceInstance);
      if (!entry) {
        console.warn(`Attempted to release a worker instance that is not in the pool: ${workerType}`);
        return;
      }

      // Decrement refCount
      if (entry.refCount > 0) {
        entry.refCount -= 1;
      } else {
        console.warn(`Worker [${workerType}] has no active references to release.`);
        return;
      }

      // If this worker is completely free, schedule an idle timer
      if (entry.refCount === 0 && !entry.idleTimer) {
        entry.idleTimer = setTimeout(() => {
          this.terminateWorker(workerType, entry);
        }, this.idleTimeout);
      }
    } finally {
      release();
    }
  }

  /**
   * Terminates a specific worker entry within a pool.
   */
  terminateWorker(workerType, entry) {
    // Make sure the worker is truly free before terminating
    if (entry.refCount === 0) {
      entry.worker.terminate();

      const pool = this.workerPools[workerType];
      // Remove this worker from the pool
      this.workerPools[workerType] = pool.filter((w) => w !== entry);

      console.log(`Worker [${workerType}] terminated due to inactivity.`);
    }
  }
}

const workerManager = new WorkerManager();
export default workerManager;