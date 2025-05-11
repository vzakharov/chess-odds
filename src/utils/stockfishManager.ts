'use client';

// We need to use a dynamic import for the worker
interface StockfishWorkerInstance {
  worker: Worker;
  isReady: boolean;
  messageQueue: string[];
  listeners: Map<string, ((line: string) => void)[]>;
  usingFallback?: boolean;
}

export class StockfishManager {
  private static instances: Map<string, StockfishWorkerInstance> = new Map();

  /**
   * Create a new Stockfish engine instance
   * @param instanceId Unique identifier for this instance
   * @returns A promise that resolves when the engine is ready
   */
  public static async createInstance(instanceId: string): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.reject('Cannot create Stockfish in server-side environment');
    }

    // Don't create duplicate instances
    if (this.instances.has(instanceId)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Create a new worker using the file in the public directory
        const worker = new Worker('/workers/stockfish.worker.js');
        
        // Initialize the worker instance 
        const instance: StockfishWorkerInstance = {
          worker,
          isReady: false,
          messageQueue: [],
          listeners: new Map(),
        };
        
        // Set up message handling
        worker.onmessage = (e: MessageEvent) => {
          const { type, line, error, usingFallback, message, stack } = e.data;
          
          if (type === 'log') {
            console.log(`Stockfish Worker Log: ${message}`);
          } else if (type === 'ready') {
            instance.isReady = true;
            instance.usingFallback = usingFallback;
            
            if (usingFallback) {
              console.log(message || 'Using Stockfish fallback mode');
            }
            
            // Process any queued messages
            while (instance.messageQueue.length > 0) {
              const message = instance.messageQueue.shift();
              if (message) {
                this.sendCommand(instanceId, message);
              }
            }
            resolve();
          } else if (type === 'error') {
            console.error('Stockfish error:', error);
            if (stack) {
              console.error('Error stack:', stack);
            }
            if (message) {
              console.error('Error message:', message);
            }
            reject(error);
          } else if (type === 'stockfish-output') {
            // Forward to all registered listeners
            for (const [command, callbacks] of instance.listeners.entries()) {
              if (line.includes(command) || command === '*') {
                callbacks.forEach(callback => callback(line));
              }
            }
          }
        };
        
        // Set up error handling
        worker.onerror = (error) => {
          reject(`Worker error: ${error.message}`);
        };
        
        // Store the instance
        this.instances.set(instanceId, instance);
        
        // Initialize the worker
        worker.postMessage({ cmd: 'init' });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send a command to the Stockfish engine
   * @param instanceId The instance ID to send the command to
   * @param command The UCI command to send
   */
  public static sendCommand(instanceId: string, command: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Stockfish instance ${instanceId} not found`);
    }

    if (instance.isReady) {
      instance.worker.postMessage({ cmd: 'send', message: command });
    } else {
      // Queue the message if the engine isn't ready yet
      instance.messageQueue.push(command);
    }
  }

  /**
   * Register a listener for specific Stockfish output lines
   * @param instanceId The instance ID to listen to
   * @param command The command keyword to filter for, or '*' for all messages
   * @param callback The callback function to call with each matching line
   */
  public static addMessageListener(
    instanceId: string,
    command: string,
    callback: (line: string) => void
  ): void {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Stockfish instance ${instanceId} not found`);
    }

    if (!instance.listeners.has(command)) {
      instance.listeners.set(command, []);
    }
    
    const listeners = instance.listeners.get(command);
    if (listeners) {
      listeners.push(callback);
    }
  }

  /**
   * Remove a previously registered listener
   * @param instanceId The instance ID
   * @param command The command filter that was used when registering
   * @param callback The callback function to remove
   */
  public static removeMessageListener(
    instanceId: string, 
    command: string, 
    callback: (line: string) => void
  ): void {
    const instance = this.instances.get(instanceId);
    if (!instance || !instance.listeners.has(command)) {
      return;
    }
    
    const listeners = instance.listeners.get(command);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Terminate a Stockfish engine instance
   * @param instanceId The instance ID to terminate
   */
  public static terminateInstance(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.worker.terminate();
      this.instances.delete(instanceId);
    }
  }

  /**
   * Terminate all Stockfish instances
   */
  public static terminateAll(): void {
    for (const instanceId of this.instances.keys()) {
      this.terminateInstance(instanceId);
    }
  }
} 