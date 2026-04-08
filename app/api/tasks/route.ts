import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  const tasks = projectId
    ? db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC').all(projectId)
    : db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all()
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const { project_id, title, description, type } = await req.json()
  if (!project_id || !title || !description) {
    return NextResponse.json({ error: 'project_id, title y description son requeridos' }, { status: 400 })
  }
  const result = db
    .prepare('INSERT INTO tasks (project_id, title, description, type) VALUES (?, ?, ?, ?)')
    .run(project_id, title, description, type || 'feature')
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid)
  return NextResponse.json(task, { status: 201 })
}
