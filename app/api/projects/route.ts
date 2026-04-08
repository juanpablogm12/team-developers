import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const { name, description, github_repo } = await req.json()
  if (!name || !description) {
    return NextResponse.json({ error: 'name y description son requeridos' }, { status: 400 })
  }
  const result = db
    .prepare('INSERT INTO projects (name, description, github_repo) VALUES (?, ?, ?)')
    .run(name, description, github_repo || null)
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
  return NextResponse.json(project, { status: 201 })
}
