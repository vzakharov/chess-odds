'use client';

import React, { useState, useEffect } from 'react';
import ChessBoard from '../components/ChessBoard';
import SimulationControl from '../components/SimulationControl';
import { ChessPiece } from '../utils/fenUtils';
import { ChessEngine, GameResult } from '../utils/chessEngine';

export default function Home() {
  const [boardFen, setBoardFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [removedPieces, setRemovedPieces] = useState<ChessPiece[]>([]);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [chessEngine, setChessEngine] = useState<ChessEngine | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    gamesCompleted: 0,
    whiteWins: 0,
    blackWins: 0,
    draws: 0,
    totalGames: 0,
    whiteWinPercentage: 0,
    blackWinPercentage: 0,
    drawPercentage: 0,
  });
  const [eloDifference, setEloDifference] = useState<number | null>(null);

  // Clean up the chess engine when component unmounts
  useEffect(() => {
    return () => {
      if (chessEngine) {
        chessEngine.stop();
      }
    };
  }, [chessEngine]);

  const handleBoardChange = (fen: string, pieces: ChessPiece[]) => {
    setBoardFen(fen);
    setRemovedPieces(pieces);
  };

  const handleStartSimulation = async (numGames: number) => {
    if (isSimulationRunning || isInitializing) return;

    setError(null);
    setIsInitializing(true);
    
    try {
      setIsSimulationRunning(true);
      setSimulationProgress(0);
      setStats({
        gamesCompleted: 0,
        whiteWins: 0,
        blackWins: 0,
        draws: 0,
        totalGames: numGames,
        whiteWinPercentage: 0,
        blackWinPercentage: 0,
        drawPercentage: 0,
      });
      setEloDifference(null);

      const engine = new ChessEngine(
        numGames,
        (fen, lastMove, progress) => {
          setSimulationProgress(progress);
        },
        (result) => {
          setLastResult(result);
          const currentStats = engine.getStats();
          setStats(currentStats);
          
          // Calculate Elo difference if we have enough games
          if (currentStats.gamesCompleted > 0) {
            const whiteWinRate = currentStats.whiteWins / currentStats.gamesCompleted;
            // Only calculate if not 0% or 100%
            if (whiteWinRate > 0 && whiteWinRate < 1) {
              const elo = engine.calculateEloDifference(whiteWinRate);
              setEloDifference(elo);
            }
          }
          
          // Check if simulation is complete
          if (currentStats.gamesCompleted >= numGames) {
            setIsSimulationRunning(false);
          }
        },
        boardFen
      );
      
      setChessEngine(engine);
      
      // Initialize and start the engine
      await engine.initialize();
      await engine.startSimulation();
    } catch (err) {
      console.error('Failed to start simulation:', err);
      setError('Failed to initialize chess engines. Please try again.');
      setIsSimulationRunning(false);
      if (chessEngine) {
        chessEngine.stop();
        setChessEngine(null);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const handleStopSimulation = () => {
    if (chessEngine) {
      chessEngine.stop();
      setChessEngine(null);
    }
    setIsSimulationRunning(false);
  };

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Chess Handicap Analyzer</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Configure Chess Board</h2>
            <p className="text-gray-600 mb-4">
              Click on pieces to remove them and create a handicap scenario.
            </p>
            <div className="flex justify-center">
              <ChessBoard 
                onBoardChange={handleBoardChange}
                disabled={isSimulationRunning || isInitializing}
              />
            </div>
          </div>
          
          <div>
            <SimulationControl
              onStartSimulation={handleStartSimulation}
              onStopSimulation={handleStopSimulation}
              isRunning={isSimulationRunning || isInitializing}
              progress={simulationProgress}
              stats={stats}
              eloDifference={eloDifference}
              lastResult={lastResult}
            />
            
            <div className="mt-6 bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">How It Works</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Remove pieces from the board to create a handicap scenario</li>
                <li>Start the simulation to run a series of games between two Stockfish engines</li>
                <li>The results will show win percentages and calculate the Elo difference</li>
                <li>Higher Elo difference means a stronger advantage for White</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
