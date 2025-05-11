'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Chess, Square } from 'chess.js';
import { ChessPiece, BoardSquare, getBoardFromFen } from '../utils/fenUtils';

// Dynamically import Chessboard component from chessboardjsx
const Chessboard = dynamic(() => import('chessboardjsx').then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-200 animate-pulse rounded-md"></div>
});

interface ChessBoardProps {
  startingFen?: string;
  onBoardChange: (fen: string, removedPieces: ChessPiece[]) => void;
  disabled?: boolean;
  width?: number;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  onBoardChange,
  disabled = false,
  width = 400
}) => {
  const [chess] = useState(new Chess(startingFen));
  const [fen, setFen] = useState(startingFen);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [removedPieces, setRemovedPieces] = useState<ChessPiece[]>([]);
  const [boardSquares, setBoardSquares] = useState<BoardSquare[]>(getBoardFromFen(startingFen));

  useEffect(() => {
    setBoardSquares(getBoardFromFen(fen));
  }, [fen]);

  const handleSquareClick = (square: Square) => {
    if (disabled) return;

    const piece = chess.get(square);
    if (piece) {
      // Remove the piece
      chess.remove(square);
      const newFen = chess.fen();
      setFen(newFen);

      // Track removed pieces
      const removedPiece: ChessPiece = {
        type: piece.type as 'p' | 'n' | 'b' | 'r' | 'q' | 'k',
        color: piece.color as 'w' | 'b',
        square
      };
      const updatedRemovedPieces = [...removedPieces, removedPiece];
      setRemovedPieces(updatedRemovedPieces);

      // Notify parent
      onBoardChange(newFen, updatedRemovedPieces);
    }
  };

  const resetBoard = () => {
    if (disabled) return;
    
    const newChess = new Chess(startingFen);
    setFen(startingFen);
    setRemovedPieces([]);
    setBoardSquares(getBoardFromFen(startingFen));
    onBoardChange(startingFen, []);
    chess.load(startingFen);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        <Chessboard
          width={width}
          position={fen}
          onSquareClick={handleSquareClick}
          boardStyle={{
            borderRadius: '5px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)'
          }}
          squareStyles={{
            ...(selectedSquare ? { [selectedSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } } : {})
          }}
          lightSquareStyle={{ backgroundColor: '#f0d9b5' }}
          darkSquareStyle={{ backgroundColor: '#b58863' }}
        />
      </div>
      
      {!disabled && (
        <div className="mt-2 mb-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={resetBoard}
          >
            Reset Board
          </button>
        </div>
      )}

      <div className="mt-2">
        <h3 className="text-lg font-semibold mb-2">Removed Pieces:</h3>
        <div className="flex flex-wrap gap-2">
          {removedPieces.map((piece, index) => (
            <div 
              key={index} 
              className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded"
              title={`${piece.color === 'w' ? 'White' : 'Black'} ${getPieceName(piece.type)}`}
            >
              {getPieceSymbol(piece)}
            </div>
          ))}
          {removedPieces.length === 0 && (
            <div className="text-gray-500">No pieces removed</div>
          )}
        </div>
      </div>
    </div>
  );
};

const getPieceName = (type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k'): string => {
  switch (type) {
    case 'p': return 'Pawn';
    case 'n': return 'Knight';
    case 'b': return 'Bishop';
    case 'r': return 'Rook';
    case 'q': return 'Queen';
    case 'k': return 'King';
  }
};

const getPieceSymbol = (piece: ChessPiece): string => {
  const symbols: Record<string, string> = {
    'w_p': '♙', 'w_n': '♘', 'w_b': '♗', 'w_r': '♖', 'w_q': '♕', 'w_k': '♔',
    'b_p': '♟', 'b_n': '♞', 'b_b': '♝', 'b_r': '♜', 'b_q': '♛', 'b_k': '♚'
  };
  
  return symbols[`${piece.color}_${piece.type}`] || '';
};

export default ChessBoard; 