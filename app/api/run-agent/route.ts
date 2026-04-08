import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { runOrchestrator } from '@/agents/orchestrator'

export async function POST(req: NextRequest) {
  const { task_id } = await req.json()
  if (!task_id) return NextResponse.json({ error: 'task_id requerido' }, { status: 400 })

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task_id) as {
    id: number; project_id: number; title: string; description: string; type: string; status: string
  } | undefined

  if (!task) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
  if (task.status !== 'pending') {
    return NextResponse.json({ error: 'La tarea ya fue procesada' }, { status: 400 })
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(task.project_id) as {
    id: number; name: string; github_repo: string
  } | undefined

  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

  db.prepare('UPDATE tasks SET status = ?, updated_at = datetime("now") WHERE id = ?')
    .run('in_progress', task_id)

  // Lanzar en background
  runOrchestrator({ task, project }).catch((err) => {
    console.error('Agent error:', err)
    db.prepare('UPDATE tasks SET status = ?, agent_log = ?, updated_at = datetime("now") WHERE id = ?')
      .run('error', String(err), task_id)
  })

  return NextResponse.json({ message: 'Agente lanzado', task_id })
}
