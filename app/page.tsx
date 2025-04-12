'use client'

import { useEffect, useState } from 'react'
import { WebApp } from '@twa-dev/types'

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

interface User {
  firstName: string;
  points: number;
  telegramId: string;
  movesLeft: number;
}

type Tile = {
  id: number;
  type: string; // Tile type (e.g., color)
}

const TILE_TYPES = ['red', 'blue', 'green', 'yellow', 'purple'] // Tile colors

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fluxxBalance, setFluxxBalance] = useState<number>(0)
  const [movesLeft, setMovesLeft] = useState<number>(30)  // Initial moves limit
  const [gameBoard, setGameBoard] = useState<Tile[][]>([]) // 2D array for the game board

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()

      const initDataUnsafe = tg.initDataUnsafe || {}

      if (initDataUnsafe.user) {
        fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(initDataUnsafe.user),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              setError(data.error)
            } else {
              setUser(data)
              setFluxxBalance(Math.floor(data.points / 10000)) // Calculate Fluxx balance
              setMovesLeft(data.movesLeft)  // Set initial moves left
              generateGameBoard()
            }
          })
          .catch(() => {
            setError('Failed to fetch user data')
          })
      } else {
        setError('No user data available')
      }
    } else {
      setError('This app should be opened in Telegram')
    }
  }, [])

  // Generate a random game board
  const generateGameBoard = () => {
    const board: Tile[][] = []
    for (let i = 0; i < 5; i++) {
      const row: Tile[] = []
      for (let j = 0; j < 5; j++) {
        const randomType = TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)]
        row.push({ id: i * 5 + j, type: randomType })
      }
      board.push(row)
    }
    setGameBoard(board)
  }

  // Swap tiles logic
  const handleTileSwap = (x1: number, y1: number, x2: number, y2: number) => {
    const newBoard = [...gameBoard]
    const tile1 = newBoard[x1][y1]
    const tile2 = newBoard[x2][y2]

    // Swap the tiles
    newBoard[x1][y1] = tile2
    newBoard[x2][y2] = tile1

    // Check for matches (this is a simplified example)
    if (checkForMatches(newBoard)) {
      setGameBoard(newBoard)
      // Increase points and handle move
      setUser({ ...user!, points: user!.points + 5 })
      setMovesLeft(movesLeft - 1)
      updateDatabase(user!.telegramId, user!.points + 5)
    }
  }

  // Check for matches (3 or more tiles of the same type in a row or column)
  const checkForMatches = (board: Tile[][]) => {
    let matchFound = false
    // Horizontal check
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length - 2; j++) {
        if (board[i][j].type === board[i][j + 1].type && board[i][j].type === board[i][j + 2].type) {
          matchFound = true
          // Handle the match (reset the tiles, add points, etc.)
        }
      }
    }
    // Vertical check
    for (let i = 0; i < board.length - 2; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j].type === board[i + 1][j].type && board[i][j].type === board[i + 2][j].type) {
          matchFound = true
          // Handle the match (reset the tiles, add points, etc.)
        }
      }
    }
    return matchFound
  }

  // Save the updated points and moves to the database
  const updateDatabase = async (telegramId: string, points: number) => {
    await fetch('/api/update-points', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegramId, points }),
    })
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>
  }

  if (!user) return <div className="container mx-auto p-4">Loading...</div>

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between mb-4">
        <div className="font-bold">Hello, {user?.firstName || "Guest"}</div>
        <div>Fluxx Balance: {fluxxBalance} Fluxx</div>
      </header>

      <div className="mb-4 flex justify-between">
        <div>Points: {user?.points}</div>
        <div>Moves Left: {movesLeft}</div>
      </div>

      <div className="game-board">
        {gameBoard.map((row, rowIndex) => (
          <div key={rowIndex} className="game-row flex">
            {row.map((tile, colIndex) => (
              <div
                key={tile.id}
                className={`tile ${tile.type}`}
                onClick={() => handleTileSwap(rowIndex, colIndex, rowIndex, colIndex + 1)} // Example of swapping adjacent tiles
              >
                {tile.type[0].toUpperCase()}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
