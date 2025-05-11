import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chess Odds - Assess Chess Handicaps with Stockfish",
  description: "Evaluate different chess handicaps by simulating games between Stockfish engines and calculating the Elo difference.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-gray-800 text-white p-4">
            <div className="container mx-auto">
              <h1 className="text-xl font-bold">Chess Odds Analyzer</h1>
            </div>
          </header>
          <main className="flex-grow">
            {children}
          </main>
          <footer className="bg-gray-100 p-4 text-center text-gray-500 text-sm">
            <div className="container mx-auto">
              <p>Chess Odds Analyzer - Evaluate chess handicaps using Stockfish engine</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
