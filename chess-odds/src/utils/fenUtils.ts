import { Chess, Square } from 'chess.js';

export interface ChessPiece {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  square: Square;
}

export interface BoardSquare {
  piece: ChessPiece | null;
  square: Square;
}

export const getFenFromRemovedPieces = (removedPieces: ChessPiece[]): string => {
  const chess = new Chess();
  
  // Remove the specified pieces
  removedPieces.forEach(piece => {
    const { square } = piece;
    chess.remove(square);
  });
  
  return chess.fen();
};

export const getBoardFromFen = (fen: string): BoardSquare[] => {
  const chess = new Chess(fen);
  const board: BoardSquare[] = [];
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  ranks.slice().reverse().forEach(rank => {
    files.forEach(file => {
      const square = `${file}${rank}` as Square;
      const piece = chess.get(square);
      board.push({
        square,
        piece: piece ? {
          type: piece.type as 'p' | 'n' | 'b' | 'r' | 'q' | 'k',
          color: piece.color as 'w' | 'b',
          square
        } : null
      });
    });
  });
  
  return board;
};

export const getPiecesFromFen = (fen: string): ChessPiece[] => {
  const chess = new Chess(fen);
  const pieces: ChessPiece[] = [];
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  ranks.forEach(rank => {
    files.forEach(file => {
      const square = `${file}${rank}` as Square;
      const piece = chess.get(square);
      if (piece) {
        pieces.push({
          type: piece.type as 'p' | 'n' | 'b' | 'r' | 'q' | 'k',
          color: piece.color as 'w' | 'b',
          square
        });
      }
    });
  });
  
  return pieces;
};

export const calculateHandicapValue = (
  whiteWins: number, 
  blackWins: number, 
  draws: number,
  total: number
): number => {
  // Calculate winning percentage for white
  const whiteWinPercentage = whiteWins / total;
  
  // ELO difference calculation
  if (whiteWinPercentage === 0) return -9999; // Complete disadvantage
  if (whiteWinPercentage === 1) return 9999;  // Complete advantage
  
  // Formula: Elo diff = -400 * log10(1/percentage - 1)
  return -400 * Math.log10(1 / whiteWinPercentage - 1);
}; 