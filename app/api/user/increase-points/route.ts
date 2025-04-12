// Increase points endpoint (POST /api/increase-points)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { telegramId, points } = await req.json()

    if (!telegramId || points === undefined) {
      return NextResponse.json({ error: 'Invalid telegramId or points' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { telegramId },
      data: { points: { increment: points } },
    })

    return NextResponse.json({ success: true, points: updatedUser.points })
  } catch (error) {
    console.error('Error increasing points:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
