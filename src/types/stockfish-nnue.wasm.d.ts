declare module 'stockfish-nnue.wasm' {
  function StockfishInit(): Promise<{
    postMessage: (message: string) => void;
    addMessageListener: (callback: (line: string) => void) => void;
    removeMessageListener: (callback: (line: string) => void) => void;
    terminate: () => void;
  }>;
  
  export default StockfishInit;
} 