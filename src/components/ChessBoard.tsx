'use client';

import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChessPiece, BoardSquare, getBoardFromFen } from '../utils/fenUtils';

interface ChessBoardProps {
  startingFen?: string;
  onBoardChange: (fen: string, removedPieces: ChessPiece[]) => void;
  disabled?: boolean;
  width?: number;
}

const pieceUnicode: Record<string, string> = {
  'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
  'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
};

function renderBoard(fen: string) {
  const rows = fen.split(' ')[0].split('/');
  return (
    <table className="border-collapse" style={{ border: '2px solid #333' }}>
      <tbody>
        {rows.map((row, i) => {
          const squares = [];
          for (const char of row) {
            if (isNaN(Number(char))) {
              squares.push(char);
            } else {
              for (let k = 0; k < Number(char); k++) squares.push(null);
            }
          }
          return (
            <tr key={i}>
              {squares.map((piece, j) => {
                const isLight = (i + j) % 2 === 1;
                return (
                  <td
                    key={j}
                    style={{
                      width: 40,
                      height: 40,
                      background: isLight ? '#f0d9b5' : '#b58863',
                      textAlign: 'center',
                      fontSize: 28,
                      fontFamily: 'serif',
                      userSelect: 'none',
                    }}
                  >
                    {piece ? pieceUnicode[piece] : ''}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  onBoardChange,
  disabled = false,
  width = 400
}) => {
  const [fen, setFen] = useState(startingFen);

  useEffect(() => {
    setFen(startingFen);
  }, [startingFen]);

  const handleFenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFen = e.target.value;
    setFen(newFen);
    onBoardChange(newFen, []);
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="text"
        className="mb-4 w-full p-2 border rounded text-sm"
        value={fen}
        onChange={handleFenChange}
        disabled={disabled}
        placeholder="Enter FEN string"
        style={{ maxWidth: width }}
      />
      <div className="mb-4">
        {renderBoard(fen)}
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