import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  if (!task) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(task)
}
