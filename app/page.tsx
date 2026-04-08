import { FolderKanban, GitPullRequest, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getStats() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const [projectsRes, tasksRes] = await Promise.all([
      fetch(`${baseUrl}/api/projects`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/tasks`, { cache: 'no-store' }),
    ])
    const projects = projectsRes.ok ? await projectsRes.json() : []
    const tasks = tasksRes.ok ? await tasksRes.json() : []
    return { projects, tasks }
  } catch {
    return { projects: [], tasks: [] }
  }
}

export default async function Dashboard() {
  const { projects, tasks } = await getStats()

  const pending = tasks.filter((t: { status: string }) => t.status === 'pending').length
  const inProgress = tasks.filter((t: { status: string }) => t.status === 'in_progress').length
  const prOpen = tasks.filter((t: { status: string }) => t.status === 'pr_open').length
  const done = tasks.filter((t: { status: string }) => t.status === 'done').length

  const stats = [
    { label: 'Proyectos activos', value: projects.length, icon: FolderKanban, color: 'text-indigo-400' },
    { label: 'PRs para revisar', value: prOpen, icon: GitPullRequest, color: 'text-yellow-400' },
    { label: 'En progreso', value: inProgress, icon: Clock, color: 'text-blue-400' },
    { label: 'Completadas', value: done, icon: CheckCircle, color: 'text-green-400' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Resumen de tu equipo de agentes</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <Icon className={`${color} mb-3`} size={22} />
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="text-sm text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {tasks.filter((t: { status: string }) => t.status === 'pr_open').length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
          <h2 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            <GitPullRequest size={18} /> PRs esperando tu revisión
          </h2>
          <div className="space-y-2">
            {tasks
              .filter((t: { status: string; pr_url: string; title: string }) => t.status === 'pr_open' && t.pr_url)
              .map((t: { id: number; title: string; pr_url: string }) => (
                <a
                  key={t.id}
                  href={t.pr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3 hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm text-white">{t.title}</span>
                  <span className="text-xs text-yellow-400">Ver PR →</span>
                </a>
              ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <FolderKanban size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No hay proyectos aún</p>
          <Link
            href="/projects"
            className="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300"
          >
            Crear tu primer proyecto →
          </Link>
        </div>
      )}

      {pending > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-1">Tareas pendientes: {pending}</h2>
          <p className="text-sm text-gray-400">
            Ve a <Link href="/projects" className="text-indigo-400 hover:underline">Proyectos</Link> para lanzar los agentes.
          </p>
        </div>
      )}
    </div>
  )
}
