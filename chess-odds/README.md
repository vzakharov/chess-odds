# Chess Odds Analyzer

A Next.js application that allows you to assess various chess handicaps by simulating games between two Stockfish engines and calculating the Elo difference between them.

## Features

- Interactive chess board where you can remove pieces to create handicap scenarios
- Run simulations of games between two Stockfish engines
- Calculate win percentages and estimated Elo differences
- Real-time progress tracking
- Browser-based simulation using WebAssembly

## How It Works

1. Configure the chess board by removing pieces to create a handicap scenario
2. Set the number of games to simulate
3. Start the simulation to let two Stockfish engines play against each other
4. Review the results, including win percentages and estimated Elo difference

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/chess-odds.git
   cd chess-odds
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Technical Details

This project uses:

- Next.js for the frontend framework
- Stockfish WebAssembly for the chess engine
- chess.js for chess game logic
- chessboardjsx for the interactive chess board
- Tailwind CSS for styling

## ELO Calculation

The Elo difference is calculated using the formula:

```
Elo diff = -400 * log10(1/W - 1)
```

Where W is the winning percentage of the player.

## License

MIT
