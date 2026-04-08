import db from '@/lib/db'
import { getFlashModel, getProModel, ask } from './gemini'
import { parseRepo, getDefaultBranch, createBranch, commitFile, createPR } from './github'

interface Task {
  id: number
  project_id: number
  title: string
  description: string
  type: string
}

interface Project {
  id: number
  name: string
  github_repo: string
}

function log(taskId: number, message: string) {
  const current = db.prepare('SELECT agent_log FROM tasks WHERE id = ?').get(taskId) as { agent_log: string } | undefined
  const prev = current?.agent_log || ''
  const timestamp = new Date().toISOString().slice(11, 19)
  db.prepare("UPDATE tasks SET agent_log = ?, updated_at = datetime('now') WHERE id = ?")
    .run(`${prev}[${timestamp}] ${message}\n`, taskId)
}

export async function runOrchestrator({ task, project }: { task: Task; project: Project }) {
  const flash = getFlashModel()
  const pro = getProModel()

  log(task.id, `Orchestrator iniciado para: "${task.title}"`)

  // 1. ARCHITECT: analiza y planifica (Flash — es análisis simple)
  log(task.id, '[Architect Agent] Analizando requerimiento...')
  const plan = await ask(flash, `
Eres un arquitecto de software senior. Analiza este requerimiento y genera un plan de implementación.
Proyecto: ${project.name}
Tarea: ${task.title}
Descripción: ${task.description}
Tipo: ${task.type}

Responde en formato JSON con esta estructura exacta:
{
  "branch": "feat/TASK-${task.id}-nombre-corto-en-kebab-case",
  "files": [
    { "path": "ruta/del/archivo.ext", "description": "qué hace este archivo" }
  ],
  "pr_title": "título del PR",
  "pr_body": "descripción del PR con los cambios realizados"
}
Solo responde el JSON, sin texto adicional.
  `)

  let planJson: {
    branch: string
    files: Array<{ path: string; description: string }>
    pr_title: string
    pr_body: string
  }

  try {
    const cleaned = plan.replace(/```json\n?|\n?```/g, '').trim()
    planJson = JSON.parse(cleaned)
  } catch {
    log(task.id, '[Architect Agent] Error al parsear el plan. Abortando.')
    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('error', task.id)
    return
  }

  log(task.id, `[Architect Agent] Plan generado. Branch: ${planJson.branch}, Archivos: ${planJson.files.length}`)

  // 2. Preparar branch en GitHub
  if (!project.github_repo) {
    log(task.id, 'El proyecto no tiene repositorio GitHub configurado. Abortando.')
    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('error', task.id)
    return
  }

  const { owner, repo } = parseRepo(project.github_repo)
  const baseBranch = await getDefaultBranch(owner, repo)

  log(task.id, `[GitHub] Creando branch "${planJson.branch}" desde "${baseBranch}"...`)
  await createBranch(owner, repo, planJson.branch, baseBranch)

  db.prepare('UPDATE tasks SET branch = ? WHERE id = ?').run(planJson.branch, task.id)

  // 3. CODER: genera e implementa cada archivo (Pro — necesita razonamiento profundo)
  for (const file of planJson.files) {
    log(task.id, `[Coder Agent] Generando ${file.path}...`)

    const code = await ask(pro, `
Eres un desarrollador senior experto. Genera el código completo para este archivo.
Proyecto: ${project.name}
Tarea: ${task.title}
Descripción: ${task.description}
Archivo a crear: ${file.path}
Propósito del archivo: ${file.description}

Genera SOLO el código del archivo, sin explicaciones ni bloques de markdown.
El código debe ser production-ready, limpio y bien estructurado.
    `)

    await commitFile(
      owner, repo, planJson.branch,
      file.path,
      code,
      `feat: add ${file.path} for ${task.title}`
    )

    log(task.id, `[Coder Agent] ${file.path} commiteado.`)
  }

  // 4. REVIEWER: revisa el trabajo (Flash — análisis rápido)
  log(task.id, '[Reviewer Agent] Revisando implementación...')
  const review = await ask(flash, `
Eres un code reviewer senior. Se implementó la siguiente tarea:
Título: ${task.title}
Descripción: ${task.description}
Archivos modificados: ${planJson.files.map(f => f.path).join(', ')}

Genera un resumen de revisión en 2-3 bullets para incluir en el PR body.
Sé conciso y técnico.
  `)

  // 5. Crear PR
  log(task.id, '[GitHub] Creando Pull Request...')
  const prBody = `${planJson.pr_body}\n\n## Review del agente\n${review}\n\n---\n_Generado automáticamente por Team Developers_`
  const { url, number } = await createPR(owner, repo, planJson.pr_title, prBody, planJson.branch, baseBranch)

  db.prepare("UPDATE tasks SET status = ?, pr_url = ?, pr_number = ?, updated_at = datetime('now') WHERE id = ?")
    .run('pr_open', url, number, task.id)

  log(task.id, `[Done] PR #${number} creado: ${url}`)
}
