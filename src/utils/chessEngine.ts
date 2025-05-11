import { Chess } from 'chess.js';
import { StockfishManager } from './stockfishManager';

export interface GameResult {
  winner: 'white' | 'black' | 'draw';
  termination: string;
  moves: number;
}

export class ChessEngine {
  private engine1Id = 'engine1';
  private engine2Id = 'engine2';
  private isThinking1 = false;
  private isThinking2 = false;
  private game = new Chess();
  private onProgress: (fen: string, lastMove: string | null, progress: number) => void;
  private onGameEnd: (result: GameResult) => void;
  private totalGames: number;
  private gamesCompleted: number = 0;
  private whiteWins: number = 0;
  private blackWins: number = 0;
  private draws: number = 0;
  private moveLimit = 200;
  private moveTime = 100; // milliseconds to think per move
  private handicap: 'white' | 'black' | null = null;
  private initialized = false;

  constructor(
    totalGames: number,
    onProgress: (fen: string, lastMove: string | null, progress: number) => void,
    onGameEnd: (result: GameResult) => void,
    startingPosition: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    handicap: 'white' | 'black' | null = null
  ) {
    this.totalGames = totalGames;
    this.onProgress = onProgress;
    this.onGameEnd = onGameEnd;
    this.handicap = handicap;

    // Set the starting position
    if (startingPosition !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
      this.game = new Chess(startingPosition);
    }
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Initialize both engine instances
      await Promise.all([
        StockfishManager.createInstance(this.engine1Id),
        StockfishManager.createInstance(this.engine2Id)
      ]);
      
      // Setup UCI for both engines
      StockfishManager.sendCommand(this.engine1Id, 'uci');
      StockfishManager.sendCommand(this.engine2Id, 'uci');
      
      // Set engine ready
      StockfishManager.sendCommand(this.engine1Id, 'isready');
      StockfishManager.sendCommand(this.engine2Id, 'isready');
      
      // Register message listeners for bestmove responses
      StockfishManager.addMessageListener(this.engine1Id, 'bestmove', (line) => this.handleEngine1Message(line));
      StockfishManager.addMessageListener(this.engine2Id, 'bestmove', (line) => this.handleEngine2Message(line));
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Stockfish engines:', error);
      throw error;
    }
  }

  public async startSimulation(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    this.resetGame();
    this.nextMove();
  }

  private resetGame(): void {
    this.game = new Chess();
    this.isThinking1 = false;
    this.isThinking2 = false;
  }

  private nextMove(): void {
    if (this.game.isGameOver() || this.game.moveNumber() > this.moveLimit) {
      this.handleGameEnd();
      return;
    }

    const isWhiteTurn = this.game.turn() === 'w';
    
    // Determine which engine should play this move
    if (isWhiteTurn) {
      this.isThinking1 = true;
      StockfishManager.sendCommand(this.engine1Id, `position fen ${this.game.fen()}`);
      StockfishManager.sendCommand(this.engine1Id, `go movetime ${this.moveTime}`);
    } else {
      this.isThinking2 = true;
      StockfishManager.sendCommand(this.engine2Id, `position fen ${this.game.fen()}`);
      StockfishManager.sendCommand(this.engine2Id, `go movetime ${this.moveTime}`);
    }
  }

  private handleEngine1Message(line: string): void {
    if (this.isThinking1 && line.startsWith('bestmove')) {
      this.isThinking1 = false;
      const move = line.split(' ')[1];
      if (move && move !== '(none)') {
        try {
          this.game.move(move);
          const lastMove = this.game.history({ verbose: true }).pop();
          const lastMoveStr = lastMove ? `${lastMove.from}${lastMove.to}` : null;
          this.onProgress(this.game.fen(), lastMoveStr, this.getProgress());
          this.nextMove();
        } catch (error) {
          console.error('Invalid move from engine 1:', move, error);
          this.handleGameEnd();
        }
      }
    }
  }

  private handleEngine2Message(line: string): void {
    if (this.isThinking2 && line.startsWith('bestmove')) {
      this.isThinking2 = false;
      const move = line.split(' ')[1];
      if (move && move !== '(none)') {
        try {
          this.game.move(move);
          const lastMove = this.game.history({ verbose: true }).pop();
          const lastMoveStr = lastMove ? `${lastMove.from}${lastMove.to}` : null;
          this.onProgress(this.game.fen(), lastMoveStr, this.getProgress());
          this.nextMove();
        } catch (error) {
          console.error('Invalid move from engine 2:', move, error);
          this.handleGameEnd();
        }
      }
    }
  }

  private handleGameEnd(): void {
    this.gamesCompleted++;
    
    let result: GameResult = {
      winner: 'draw',
      termination: 'unknown',
      moves: Math.floor(this.game.moveNumber() / 2)
    };
    
    if (this.game.isCheckmate()) {
      result.winner = this.game.turn() === 'w' ? 'black' : 'white';
      result.termination = 'checkmate';
    } else if (this.game.isDraw()) {
      result.winner = 'draw';
      if (this.game.isStalemate()) {
        result.termination = 'stalemate';
      } else if (this.game.isThreefoldRepetition()) {
        result.termination = 'threefold repetition';
      } else if (this.game.isInsufficientMaterial()) {
        result.termination = 'insufficient material';
      } else {
        result.termination = '50-move rule';
      }
    } else if (this.game.moveNumber() > this.moveLimit) {
      result.winner = 'draw';
      result.termination = 'move limit exceeded';
    }
    
    if (result.winner === 'white') {
      this.whiteWins++;
    } else if (result.winner === 'black') {
      this.blackWins++;
    } else {
      this.draws++;
    }
    
    this.onGameEnd(result);
    
    if (this.gamesCompleted < this.totalGames) {
      this.resetGame();
      this.nextMove();
    }
  }

  public getStats() {
    return {
      gamesCompleted: this.gamesCompleted,
      whiteWins: this.whiteWins,
      blackWins: this.blackWins,
      draws: this.draws,
      totalGames: this.totalGames,
      whiteWinPercentage: (this.whiteWins / this.gamesCompleted) * 100 || 0,
      blackWinPercentage: (this.blackWins / this.gamesCompleted) * 100 || 0,
      drawPercentage: (this.draws / this.gamesCompleted) * 100 || 0,
    };
  }

  public getProgress(): number {
    return (this.gamesCompleted / this.totalGames) * 100;
  }

  public stop(): void {
    StockfishManager.terminateInstance(this.engine1Id);
    StockfishManager.terminateInstance(this.engine2Id);
  }

  public calculateEloDifference(winPercentage: number): number {
    // Elo difference formula based on win percentage
    return -400 * Math.log10(1 / winPercentage - 1);
  }
} 