// Stockfish worker using WebAssembly - Fixed version for cross-origin isolation issues

// Simple logging function
function log(message) {
  self.postMessage({ 
    type: 'log', 
    message: message
  });
}

// Check cross-origin isolation status
const isCrossOriginIsolated = self.crossOriginIsolated === true;
log(`Worker crossOriginIsolated: ${isCrossOriginIsolated}`);
log(`Worker location: ${self.location.href}`);

// Report environment info
log(`User agent: ${navigator.userAgent}`);
log(`SharedArrayBuffer available: ${typeof SharedArrayBuffer === 'function'}`);
log(`Atomics available: ${typeof Atomics === 'object'}`);

let stockfish = null;

// Initialize the engine
async function initEngine() {
  try {
    log('Loading stockfish.js...');
    importScripts('/stockfish.js');
    
    log('Stockfish script loaded, checking if Stockfish function exists...');
    if (typeof Stockfish !== 'function') {
      throw new Error('Stockfish function not available after loading script');
    }
    
    log('Stockfish function found, initializing...');
    
    // Create custom wasmMemory manually if we need to work around threading issues
    let customWasmMemory = null;
    
    if (!isCrossOriginIsolated) {
      log('WARNING: Not cross-origin isolated. Attempting fallback initialization...');
      // This is a workaround - might not fully work but should avoid hanging
      try {
        customWasmMemory = new WebAssembly.Memory({
          initial: 32, // 2MB in pages (64KB each)
          maximum: 32768, // 2GB maximum
          shared: true
        });
        
        log('Successfully created a shared WebAssembly.Memory');
        log(`Memory is SharedArrayBuffer: ${customWasmMemory.buffer instanceof SharedArrayBuffer}`);
      } catch (err) {
        log(`Failed to create shared memory: ${err.toString()}`);
      }
    }
    
    try {
      log('Calling Stockfish() with timeout protection...');
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Stockfish initialization timed out after 15 seconds')), 15000);
      });
      
      // Call Stockfish with or without the custom memory
      const stockfishPromise = customWasmMemory 
        ? Stockfish({ wasmMemory: customWasmMemory })
        : Stockfish();
      
      // Race against the timeout
      const result = await Promise.race([stockfishPromise, timeoutPromise]);
      
      log(`Stockfish() returned type: ${typeof result}`);
      if (!result) {
        throw new Error('Stockfish() returned null or undefined');
      }
      
      stockfish = result;
      log('Stockfish initialized successfully!');
      log(`Available methods: ${Object.keys(stockfish).join(', ')}`);
      
      // Set up message listener
      if (typeof stockfish.addMessageListener !== 'function') {
        throw new Error('stockfish.addMessageListener is not a function');
      }
      
      stockfish.addMessageListener((line) => {
        self.postMessage({ type: 'stockfish-output', line });
      });
      
      // Let the main thread know we're ready
      self.postMessage({ 
        type: 'ready',
        usingThreads: isCrossOriginIsolated,
        usingCustomMemory: customWasmMemory !== null
      });
      
      // Test with UCI command
      log('Testing engine with UCI command...');
      stockfish.postMessage('uci');
    } catch (error) {
      log(`Error during Stockfish() call: ${error.toString()}`);
      throw error;
    }
  } catch (err) {
    log('ERROR initializing Stockfish: ' + err.toString());
    if (err.stack) {
      log('Stack trace: ' + err.stack);
    }
    self.postMessage({ 
      type: 'error', 
      error: err.toString(),
      message: 'Failed to initialize Stockfish: ' + err.toString(),
      stack: err.stack
    });
  }
}

// Handle messages from main thread
self.onmessage = function(event) {
  const message = event.data;
  
  if (message.cmd === 'init') {
    log('Received init command');
    initEngine();
  } else if (message.cmd === 'send') {
    if (!stockfish) {
      self.postMessage({ 
        type: 'error', 
        message: 'Engine not initialized yet'
      });
      return;
    }
    
    log('Sending command: ' + message.message);
    try {
      stockfish.postMessage(message.message);
    } catch (err) {
      log('Error sending command: ' + err.toString());
      self.postMessage({
        type: 'error',
        error: err.toString(),
        message: 'Error sending command: ' + err.toString()
      });
    }
  } else if (message.testSharedArrayBuffer) {
    // Handle the SharedArrayBuffer test
    try {
      log(`Received SharedArrayBuffer test. Is SharedArrayBuffer: ${message.testSharedArrayBuffer instanceof SharedArrayBuffer}`);
      log(`Worker crossOriginIsolated value: ${isCrossOriginIsolated}`);
      
      // Try to send it back to confirm two-way transfer works
      self.postMessage({
        type: 'sab-test-result',
        success: true,
        sab: message.testSharedArrayBuffer
      });
    } catch (err) {
      log(`Error in SharedArrayBuffer test: ${err.toString()}`);
      self.postMessage({
        type: 'sab-test-result',
        success: false,
        error: err.toString()
      });
    }
  }
}; 