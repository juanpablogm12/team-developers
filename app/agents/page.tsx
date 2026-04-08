import { Bot, Zap, Code2, Eye } from 'lucide-react'

const agents = [
  {
    name: 'Architect Agent',
    role: 'Planificación',
    model: 'Gemini Flash 2.0',
    description: 'Analiza el requerimiento y genera el plan de implementación: qué archivos crear, estructura del PR, y descomposición de la tarea.',
    icon: Zap,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    cost: 'Bajo',
  },
  {
    name: 'Coder Agent',
    role: 'Implementación',
    model: 'Gemini Flash 2.0',
    description: 'Genera el código de cada archivo definido por el Architect. Hace commits directamente en la branch del proyecto.',
    icon: Code2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    cost: 'Medio',
  },
  {
    name: 'Reviewer Agent',
    role: 'Revisión',
    model: 'Gemini Flash 2.0',
    description: 'Revisa el trabajo del Coder y genera un resumen técnico de los cambios para incluir en el body del PR.',
    icon: Eye,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    cost: 'Bajo',
  },
]

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Agentes</h1>
        <p className="text-gray-400 mt-1">El equipo de IA que trabaja en tus proyectos</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-2">Flujo de trabajo</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="px-3 py-1 bg-gray-800 rounded-full">Tú creas la tarea</span>
          <span>→</span>
          <span className="px-3 py-1 bg-purple-900/50 rounded-full text-purple-300">Architect planifica</span>
          <span>→</span>
          <span className="px-3 py-1 bg-blue-900/50 rounded-full text-blue-300">Coder implementa</span>
          <span>→</span>
          <span className="px-3 py-1 bg-green-900/50 rounded-full text-green-300">Reviewer revisa</span>
          <span>→</span>
          <span className="px-3 py-1 bg-yellow-900/50 rounded-full text-yellow-300">PR para tu aprobación</span>
        </div>
      </div>

      <div className="grid gap-4">
        {agents.map(({ name, role, model, description, icon: Icon, color, bg, cost }) => (
          <div key={name} className={`bg-gray-900 border ${bg} rounded-xl p-5`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg ${bg} border flex items-center justify-center shrink-0`}>
                <Icon size={20} className={color} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold text-white">{name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${bg} border ${color}`}>{role}</span>
                </div>
                <p className="text-sm text-gray-400 mb-3">{description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Bot size={12} /> {model}</span>
                  <span>Costo de tokens: <span className="text-gray-300">{cost}</span></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-2">Próximamente</h2>
        <p className="text-sm text-gray-400">Soporte para Claude API (Anthropic) para tareas de arquitectura compleja que requieren mayor razonamiento.</p>
      </div>
    </div>
  )
}
