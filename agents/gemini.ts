import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Flash: tareas rápidas y baratas (review, tests, análisis simple)
export function getFlashModel() {
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
}

// Pro: implementación de código, razonamiento complejo
export function getProModel() {
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) // upgrade a gemini-pro cuando disponible
}

export async function ask(model: ReturnType<typeof getFlashModel>, prompt: string): Promise<string> {
  const result = await model.generateContent(prompt)
  return result.response.text()
}
