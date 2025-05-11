// Stockfish worker using WebAssembly

// Simple logging function
function log(message) {
  self.postMessage({ 
    type: 'log', 
    message: message
  });
}

// Check for cross-origin isolation
log(`Worker crossOriginIsolated: ${self.crossOriginIsolated}`);
log(`Worker location: ${self.location.href}`);

let stockfish = null;

// Initialize the engine
async function initEngine() {
  try {
    log('Loading stockfish.js...');
    importScripts('/stockfish.js');
    
    log('Stockfish script loaded, initializing engine...');
    stockfish = await Stockfish();
    
    log('Stockfish initialized successfully!');
    
    // Set up message listener
    stockfish.addMessageListener((line) => {
      self.postMessage({ type: 'stockfish-output', line });
    });
    
    // Let the main thread know we're ready
    self.postMessage({ type: 'ready' });
    
    // Test with UCI command
    log('Testing engine with UCI command...');
    stockfish.postMessage('uci');
  } catch (err) {
    log('ERROR initializing Stockfish: ' + err.toString());
    self.postMessage({ 
      type: 'error', 
      error: err.toString(),
      message: 'Failed to initialize Stockfish: ' + err.toString()
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
      log(`Worker crossOriginIsolated value: ${self.crossOriginIsolated}`);
      
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
