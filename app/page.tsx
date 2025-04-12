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

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState('')
  const [fluxxBalance, setFluxxBalance] = useState<number>(0)
  const [movesLeft, setMovesLeft] = useState<number>(30)  // Initial moves limit
  const [gameBoard, setGameBoard] = useState<number[][]>([]) // Example board for the game

  const points = user?.points || 0  // Safe fallback to 0 if points are undefined

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

  const handleIncreasePoints = async () => {
    if (!user || movesLeft <= 0) {
      setError('No moves left for this hour')
      return
    }

    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId: user.telegramId }),
      })
      const data = await res.json()
      if (data.success) {
        setUser({ ...user, points: data.points })
        setFluxxBalance(Math.floor(data.points / 10000)) // Update Fluxx balance
        setNotification('Points increased successfully!')
        setTimeout(() => setNotification(''), 3000)

        // Update the moves left after a successful move
        const newMovesLeft = movesLeft - 1
        setMovesLeft(newMovesLeft)

        // Save updated moves left to database
        await fetch('/api/update-moves', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ telegramId: user.telegramId, movesLeft: newMovesLeft }),
        })
      } else {
        setError('Failed to increase points')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while increasing points')
    }
  }

  // Function to reset moves after an hour
  const resetMoves = () => {
    const now = new Date()
    const lastReset = new Date(localStorage.getItem('lastReset') || 0)
    const diffInHours = Math.abs(now.getTime() - lastReset.getTime()) / 36e5

    if (diffInHours >= 1) {
      // Reset moves to 30 if an hour has passed
      setMovesLeft(30)
      localStorage.setItem('lastReset', now.toISOString())  // Store the last reset time
    }
  }

  useEffect(() => {
    resetMoves()
  }, [movesLeft])

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
        <div>Points: {points}</div>  {/* Using the safe points value */}
        <div>Moves Left: {movesLeft}</div>  {/* Displaying the remaining moves */}
      </div>

      {/* Your game tiles logic here */}
      <button
        onClick={handleIncreasePoints}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
      >
        Increase Points
      </button>

      {notification && (
        <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
          {notification}
        </div>
      )}
    </div>
  )
}
