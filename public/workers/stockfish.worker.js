// Stockfish worker using WebAssembly

// Feature detection for WebAssembly threading support
function wasmThreadsSupported() {
  return (
    typeof SharedArrayBuffer === 'function' &&
    typeof Atomics === 'object'
  );
}

let stockfish;
let engineInitialized = false;

// Initialize the engine
async function initEngine() {
  try {
    self.postMessage({ type: 'log', message: 'Initializing Stockfish engine...' });
    
    const hasThreadSupport = wasmThreadsSupported();
    
    if (!hasThreadSupport) {
      self.postMessage({ 
        type: 'log', 
        message: 'SharedArrayBuffer not available - this requires HTTPS and proper COOP/COEP headers'
      });
    } else {
      self.postMessage({ type: 'log', message: 'Thread support detected!' });
    }
    
    // Import Stockfish and initialize
    self.postMessage({ type: 'log', message: 'Loading Stockfish from /workers/stockfish.js' });
    importScripts('/workers/stockfish.js');
    
    self.postMessage({ type: 'log', message: 'Waiting for Stockfish to initialize...' });
    stockfish = await Stockfish();
    engineInitialized = true;
    self.postMessage({ type: 'log', message: 'Stockfish initialized successfully!' });
    
    // Set up message listener
    self.postMessage({ type: 'log', message: 'Setting up message listener...' });
    stockfish.addMessageListener((line) => {
      self.postMessage({ type: 'log', message: 'From engine: ' + line });
      self.postMessage({ type: 'stockfish-output', line });
    });
    
    // Let the main thread know we're ready
    self.postMessage({ 
      type: 'ready',
      usingThreads: hasThreadSupport
    });
    
    // Test that the engine is responding
    self.postMessage({ type: 'log', message: 'Testing engine with "uci" command...' });
    stockfish.postMessage("uci");
  } catch (err) {
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
    initEngine();
  } else if (message.cmd === 'send') {
    if (!engineInitialized) {
      self.postMessage({ 
        type: 'error', 
        error: 'Engine not initialized',
        message: 'Cannot send command, engine not initialized yet'
      });
      return;
    }
    
    if (!stockfish) {
      self.postMessage({ 
        type: 'error', 
        error: 'Stockfish instance not available',
        message: 'Cannot send command, Stockfish instance not available'
      });
      return;
    }
    
    self.postMessage({ type: 'log', message: 'Sending to engine: ' + message.message });
    try {
      stockfish.postMessage(message.message);
    } catch (err) {
      self.postMessage({ 
        type: 'error', 
        error: err.toString(),
        message: 'Error sending command to Stockfish: ' + err.toString()
      });
    }
  } else if (message.cmd === 'status') {
    self.postMessage({ 
      type: 'status', 
      engineInitialized: engineInitialized,
      hasStockfish: !!stockfish
    });
  }
};
