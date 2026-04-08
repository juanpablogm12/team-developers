'use client'
import { useEffect, useState } from 'react'
import { GitPullRequest, ExternalLink } from 'lucide-react'

interface Task { id: number; title: string; pr_url: string; pr_number: number; status: string; branch: string; updated_at: string }

export default function PRsPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    fetch('/api/tasks').then(r => r.json()).then(all =>
      setTasks(all.filter((t: Task) => t.pr_url))
    )
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pull Requests</h1>
        <p className="text-gray-400 mt-1">PRs generados por los agentes esperando tu revisión</p>
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <GitPullRequest size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay PRs abiertos aún</p>
        </div>
      )}

      <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <GitPullRequest size={16} className="text-yellow-400" />
              </div>
              <div>
                <div className="font-medium text-white">{task.title}</div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">{task.branch}</div>
              </div>
            </div>
            <a
              href={task.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLink size={14} /> Revisar PR
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
