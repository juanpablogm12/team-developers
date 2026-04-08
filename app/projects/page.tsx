'use client'
import { useState, useEffect } from 'react'
import { Plus, FolderKanban, ChevronDown, ChevronUp, Loader2, ExternalLink, Play } from 'lucide-react'

interface Project { id: number; name: string; description: string; github_repo: string; status: string; created_at: string }
interface Task { id: number; project_id: number; title: string; description: string; type: string; status: string; pr_url: string; branch: string; agent_log: string }

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pendiente',   color: 'bg-gray-700 text-gray-300' },
  in_progress: { label: 'En progreso', color: 'bg-blue-900 text-blue-300' },
  pr_open:     { label: 'PR abierto',  color: 'bg-yellow-900 text-yellow-300' },
  done:        { label: 'Completado',  color: 'bg-green-900 text-green-300' },
  error:       { label: 'Error',       color: 'bg-red-900 text-red-300' },
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewTask, setShowNewTask] = useState<number | null>(null)
  const [launching, setLaunching] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', description: '', github_repo: '' })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', type: 'feature' })

  const load = async () => {
    const [p, t] = await Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json()),
    ])
    setProjects(p)
    setTasks(t)
  }

  useEffect(() => { load() }, [])

  // Polling para tareas en progreso
  useEffect(() => {
    const inProgress = tasks.some(t => t.status === 'in_progress')
    if (!inProgress) return
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [tasks])

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm({ name: '', description: '', github_repo: '' })
    setShowNewProject(false)
    load()
  }

  const createTask = async (e: React.FormEvent, projectId: number) => {
    e.preventDefault()
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...taskForm, project_id: projectId }),
    })
    setTaskForm({ title: '', description: '', type: 'feature' })
    setShowNewTask(null)
    load()
  }

  const runAgent = async (taskId: number) => {
    setLaunching(taskId)
    await fetch('/api/run-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId }),
    })
    setLaunching(null)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Proyectos</h1>
          <p className="text-gray-400 mt-1">Gestiona tus proyectos y lanza agentes</p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Nuevo proyecto
        </button>
      </div>

      {showNewProject && (
        <div className="bg-gray-900 border border-indigo-500/50 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4">Nuevo proyecto</h2>
          <form onSubmit={createProject} className="space-y-4">
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              placeholder="Nombre del proyecto"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Descripción del proyecto"
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
            />
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              placeholder="Repositorio GitHub (ej: usuario/repo)"
              value={form.github_repo}
              onChange={e => setForm(f => ({ ...f, github_repo: e.target.value }))}
            />
            <div className="flex gap-3">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Crear</button>
              <button type="button" onClick={() => setShowNewProject(false)} className="text-gray-400 hover:text-white px-4 py-2 text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 && !showNewProject && (
        <div className="text-center py-20 text-gray-500">
          <FolderKanban size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hay proyectos. Crea el primero.</p>
        </div>
      )}

      <div className="space-y-4">
        {projects.map(project => {
          const projectTasks = tasks.filter(t => t.project_id === project.id)
          const isExpanded = expanded === project.id
          return (
            <div key={project.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 hover:bg-gray-800/50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : project.id)}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                    <FolderKanban size={18} className="text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{project.name}</div>
                    <div className="text-sm text-gray-400">{project.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {project.github_repo && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      {project.github_repo}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">{projectTasks.length} tareas</span>
                  {isExpanded ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-800 p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-300">Tareas</h3>
                    <button
                      onClick={() => setShowNewTask(project.id)}
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      <Plus size={14} /> Nueva tarea
                    </button>
                  </div>

                  {showNewTask === project.id && (
                    <form onSubmit={e => createTask(e, project.id)} className="bg-gray-800 rounded-lg p-4 space-y-3">
                      <input
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                        placeholder="Título de la tarea"
                        value={taskForm.title}
                        onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                        required
                      />
                      <textarea
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                        placeholder="Describe qué debe hacer el agente..."
                        rows={3}
                        value={taskForm.description}
                        onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                        required
                      />
                      <select
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                        value={taskForm.type}
                        onChange={e => setTaskForm(f => ({ ...f, type: e.target.value }))}
                      >
                        <option value="feature">Feature</option>
                        <option value="fix">Bug fix</option>
                        <option value="refactor">Refactor</option>
                        <option value="test">Tests</option>
                      </select>
                      <div className="flex gap-2">
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Crear tarea</button>
                        <button type="button" onClick={() => setShowNewTask(null)} className="text-gray-400 hover:text-white text-xs px-3 py-1.5">Cancelar</button>
                      </div>
                    </form>
                  )}

                  {projectTasks.length === 0 && !showNewTask && (
                    <p className="text-sm text-gray-600 text-center py-4">No hay tareas. Crea una para lanzar un agente.</p>
                  )}

                  <div className="space-y-2">
                    {projectTasks.map(task => {
                      const s = STATUS_LABELS[task.status] || STATUS_LABELS.pending
                      return (
                        <div key={task.id} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
                                <span className="text-xs text-gray-500 capitalize">{task.type}</span>
                              </div>
                              <div className="text-sm font-medium text-white">{task.title}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{task.description}</div>
                              {task.branch && (
                                <div className="text-xs text-gray-600 mt-1 font-mono">{task.branch}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {task.pr_url && (
                                <a href={task.pr_url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300">
                                  <ExternalLink size={13} /> Ver PR
                                </a>
                              )}
                              {task.status === 'pending' && (
                                <button
                                  onClick={() => runAgent(task.id)}
                                  disabled={launching === task.id}
                                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                                >
                                  {launching === task.id ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                                  Lanzar agente
                                </button>
                              )}
                              {task.status === 'in_progress' && (
                                <div className="flex items-center gap-1.5 text-xs text-blue-400">
                                  <Loader2 size={13} className="animate-spin" /> Trabajando...
                                </div>
                              )}
                            </div>
                          </div>
                          {task.agent_log && (
                            <div className="mt-3 bg-gray-950 rounded p-3 font-mono text-xs text-gray-400 max-h-40 overflow-y-auto whitespace-pre">
                              {task.agent_log}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
