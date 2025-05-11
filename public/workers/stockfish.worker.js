// Stockfish worker - using pure JS version for compatibility

// Import Stockfish
importScripts('/stockfish.js');

// Relay messages between main thread and engine
onmessage = function(event) {
  const message = event.data;
  
  if (message.cmd === 'init') {
    // Let the main thread know we're ready
    self.postMessage({ type: 'ready' });
  } else if (message.cmd === 'send') {
    // Forward commands to the engine
    self.postMessage({ type: 'log', message: 'Sending to engine: ' + message.message });
    postMessage(message.message);
  }
};

// Handle messages from the engine
addEventListener('message', function(event) {
  // Ignore messages that are meant for the worker itself
  if (event.data instanceof Object && event.data.hasOwnProperty('cmd'))
    return;
  
  // Forward messages from the engine to the main thread
  self.postMessage({ type: 'stockfish-output', line: event.data });
}); 