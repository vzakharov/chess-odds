// Stockfish worker using WebAssembly

// Feature detection for WebAssembly threading support
function wasmThreadsSupported() {
  return (
    typeof SharedArrayBuffer === 'function' &&
    typeof Atomics === 'object'
  );
}

let stockfish;

// Initialize the engine
async function initEngine() {
  try {
    const hasThreadSupport = wasmThreadsSupported();
    
    if (!hasThreadSupport) {
      self.postMessage({ 
        type: 'log', 
        message: 'SharedArrayBuffer not available - this requires HTTPS and proper COOP/COEP headers'
      });
    }
    
    // Import Stockfish and initialize
    importScripts('/workers/stockfish.js');
    stockfish = await Stockfish();
    
    // Set up message listener
    stockfish.addMessageListener((line) => {
      self.postMessage({ type: 'stockfish-output', line });
    });
    
    // Let the main thread know we're ready
    self.postMessage({ 
      type: 'ready',
      usingThreads: hasThreadSupport
    });
  } catch (err) {
    self.postMessage({ 
      type: 'error', 
      error: err.toString(),
      message: 'Failed to initialize Stockfish'
    });
  }
}

// Handle messages from main thread
self.onmessage = function(event) {
  const message = event.data;
  
  if (message.cmd === 'init') {
    initEngine();
  } else if (message.cmd === 'send' && stockfish) {
    self.postMessage({ type: 'log', message: 'Sending to engine: ' + message.message });
    stockfish.postMessage(message.message);
  }
};
