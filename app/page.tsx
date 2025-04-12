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
  firstName: string
  points: number
  telegramId: string
}

interface Tile {
  color: string
  matched: boolean
}

const colors = ['red', 'blue', 'green', 'yellow', 'purple']

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [tiles, setTiles] = useState<Tile[][]>([])
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState('')
  const [movesLeft, setMovesLeft] = useState<number>(30)
  const [fluxxBalance, setFluxxBalance] = useState<number>(0)

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
              calculateFluxxBalance(data.points) // Update Fluxx balance on initial load
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (movesLeft < 30) setMovesLeft((prev) => prev + 1)
    }, 3600000) // Update moves every hour

    return () => clearInterval(interval)
  }, [movesLeft])

  const calculateFluxxBalance = (points: number) => {
    const fluxx = Math.floor(points / 10000) // 1 Fluxx = 10,000 points
    setFluxxBalance(fluxx)
  }

  const handleTileClick = (rowIdx: number, colIdx: number) => {
    if (movesLeft <= 0) {
      setError('You have no moves left this hour')
      return
    }

    // Example: Simplified logic for matching tiles (you can extend this to match)
    const newTiles = [...tiles]
    const tile = newTiles[rowIdx][colIdx]
    tile.matched = true

    // Update tiles
    setTiles(newTiles)

    // Increment points
    const earnedPoints = 5
    const newPoints = user?.points + earnedPoints || 0
    calculateFluxxBalance(newPoints)

    // Update user points in the backend
    fetch('/api/increase-points', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegramId: user?.telegramId, points: earnedPoints }),
    })

    setMovesLeft((prev) => prev - 1)
  }

  const generateGameBoard = () => {
    const rows = 5
    const cols = 5
    const board: Tile[][] = []

    for (let row = 0; row < rows; row++) {
      const rowTiles: Tile[] = []
      for (let col = 0; col < cols; col++) {
        const randomColor = colors[Math.floor(Math.random() * colors.length)]
        rowTiles.push({ color: randomColor, matched: false })
      }
      board.push(rowTiles)
    }

    setTiles(board)
  }

  useEffect(() => {
    generateGameBoard()
  }, [])

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>
  }

  if (!user) return <div className="container mx-auto p-4">Loading...</div>

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between mb-4">
        <div className="font-bold">Hello, {user.firstName}</div>
        <div>
          Fluxx Balance: {fluxxBalance} Fluxx
        </div>
      </header>

      <div className="flex justify-between mb-4">
        <div>Points: {user.points}</div>
        <div>Moves Left: {movesLeft}</div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {tiles.map((row, rowIdx) => (
          <div key={rowIdx} className="flex">
            {row.map((tile, colIdx) => (
              <button
                key={colIdx}
                onClick={() => handleTileClick(rowIdx, colIdx)}
                style={{ backgroundColor: tile.color }}
                className="w-12 h-12 border-2"
              >
                {tile.matched ? '✔️' : ''}
              </button>
            ))}
          </div>
        ))}
      </div>

      {notification && (
        <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
          {notification}
        </div>
      )}
    </div>
  )
}
