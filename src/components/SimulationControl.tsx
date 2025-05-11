'use client';

import React, { useState } from 'react';
import { GameResult } from '../utils/chessEngine';

interface SimulationControlProps {
  onStartSimulation: (numGames: number) => void;
  onStopSimulation: () => void;
  isRunning: boolean;
  progress: number;
  stats: {
    gamesCompleted: number;
    whiteWins: number;
    blackWins: number;
    draws: number;
    whiteWinPercentage: number;
    blackWinPercentage: number;
    drawPercentage: number;
  };
  eloDifference: number | null;
  lastResult: GameResult | null;
}

const SimulationControl: React.FC<SimulationControlProps> = ({
  onStartSimulation,
  onStopSimulation,
  isRunning,
  progress,
  stats,
  eloDifference,
  lastResult
}) => {
  const [numGames, setNumGames] = useState(100);

  const handleNumGamesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setNumGames(value);
    }
  };

  const handleStartSimulation = () => {
    onStartSimulation(numGames);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Simulation Control</h2>
      
      <div className="mb-4">
        <label htmlFor="numGames" className="block text-sm font-medium text-gray-700 mb-1">
          Number of Games
        </label>
        <input
          type="number"
          id="numGames"
          value={numGames}
          onChange={handleNumGamesChange}
          min="1"
          max="1000"
          disabled={isRunning}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
        />
      </div>

      <div className="mb-6">
        <button
          onClick={isRunning ? onStopSimulation : handleStartSimulation}
          className={`w-full py-2 px-4 rounded-md font-medium text-white ${
            isRunning
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors`}
        >
          {isRunning ? 'Stop Simulation' : 'Start Simulation'}
        </button>
      </div>

      {isRunning && (
        <div className="mb-4">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                  Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-indigo-600">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-sm text-gray-600">Games Completed</div>
          <div className="text-lg font-semibold">{stats.gamesCompleted}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-sm text-gray-600">Estimated Elo Difference</div>
          <div className="text-lg font-semibold">
            {eloDifference !== null ? `${Math.round(eloDifference)}` : 'N/A'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-green-50 p-3 rounded-md">
          <div className="text-sm text-green-600">White Wins</div>
          <div className="text-lg font-semibold">{stats.whiteWins}</div>
          <div className="text-xs text-gray-500">
            {stats.whiteWinPercentage.toFixed(1)}%
          </div>
        </div>
        <div className="bg-red-50 p-3 rounded-md">
          <div className="text-sm text-red-600">Black Wins</div>
          <div className="text-lg font-semibold">{stats.blackWins}</div>
          <div className="text-xs text-gray-500">
            {stats.blackWinPercentage.toFixed(1)}%
          </div>
        </div>
        <div className="bg-blue-50 p-3 rounded-md">
          <div className="text-sm text-blue-600">Draws</div>
          <div className="text-lg font-semibold">{stats.draws}</div>
          <div className="text-xs text-gray-500">
            {stats.drawPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {lastResult && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h3 className="text-md font-semibold mb-1">Last Game Result</h3>
          <div className="text-sm">
            <div>
              Winner: <span className="font-medium">{lastResult.winner}</span>
            </div>
            <div>
              Termination: <span className="font-medium">{lastResult.termination}</span>
            </div>
            <div>
              Moves: <span className="font-medium">{lastResult.moves}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationControl; 