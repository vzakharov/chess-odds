// Import Stockfish from CDN
self.importScripts('https://cdn.jsdelivr.net/npm/stockfish-nnue.wasm@1.0.0/stockfish-nnue-wasm.js');

let stockfishPromise;
let stockfish;

async function initStockfish() {
  try {
    stockfishPromise = Stockfish();
    stockfish = await stockfishPromise;
    
    stockfish.addMessageListener((line) => {
      self.postMessage({ type: 'stockfish-output', line });
    });
    
    self.postMessage({ type: 'ready' });
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
}

self.addEventListener('message', (event) => {
  const data = event.data;
  
  if (data.cmd === 'init') {
    initStockfish();
  } else if (data.cmd === 'send') {
    if (stockfish) {
      stockfish.postMessage(data.message);
    } else if (stockfishPromise) {
      stockfishPromise.then(() => {
        stockfish.postMessage(data.message);
      });
    }
  }
}); 