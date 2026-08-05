// Configuracion central del frontend: URLs reales de los webhooks de n8n y
// preferencias del usuario (x-api-key, nombre del analista) persistidas en localStorage.
//
// IMPORTANTE: no hay backend propio ni mocks. Todas las URLs de abajo son las URLs de
// PRODUCCION reales de los workflows de n8n (PBI-01 a PBI-07). Los valores por defecto
// (fallback) son exactamente esas URLs reales, para que la app funcione aunque no se
// haya creado un archivo .env local.

export const ENV = {
  PBI01_URL:
    import.meta.env.VITE_PBI01_URL ||
    'https://jmejiaromero.app.n8n.cloud/webhook/b1e1e547-11d8-4c78-b3d4-03dd739c101d/pbi/solicitudes',
  PBI02_URL:
    import.meta.env.VITE_PBI02_URL ||
    'https://jmejiaromero.app.n8n.cloud/webhook/0bdaac18-2853-4006-920e-5f1ca4bec455/pbi/solicitudes/consultar',
  PBI03_URL:
    import.meta.env.VITE_PBI03_URL ||
    'https://jmejiaromero.app.n8n.cloud/webhook/d6f72879-d965-4eb8-94d9-9613c41f68c6/pbi/solicitudes/listar',
  PBI04_URL:
    import.meta.env.VITE_PBI04_URL ||
    'https://jmejiaromero.app.n8n.cloud/webhook/b5297d27-cae5-4533-8767-a8cf7288b453/pbi/evaluaciones/guardar',
  PBI05_URL:
    import.meta.env.VITE_PBI05_URL ||
    'https://jmejiaromero.app.n8n.cloud/webhook/80741b76-4e1c-443c-98b0-4eeb81746d88/pbi/autorizacion/enviar',
  PBI06_URL:
    import.meta.env.VITE_PBI06_URL ||
    'https://jmejiaromero.app.n8n.cloud/webhook/9efa9ca9-7d8a-4dbb-925e-1a6e9ed08e98/pbi/aprobacion/consultar',
  PBI07_URL:
    import.meta.env.VITE_PBI07_URL ||
    'https://jmejiaromero.app.n8n.cloud/webhook/1be6f16a-4715-40dd-8103-f53f8b551f16/pbi/aprobacion/decidir',
  DEFAULT_API_KEY: import.meta.env.VITE_DEFAULT_API_KEY || '',
}

const LS_API_KEY = 'portal_bi_api_key'
const LS_ANALISTA = 'portal_bi_evaluado_por'

export function getApiKey(): string {
  try {
    const stored = window.localStorage.getItem(LS_API_KEY)
    if (stored !== null) return stored
  } catch {
    /* localStorage no disponible */
  }
  return ENV.DEFAULT_API_KEY
}

export function setApiKey(value: string) {
  try {
    window.localStorage.setItem(LS_API_KEY, value)
  } catch {
    /* localStorage no disponible */
  }
}

export function getAnalistaNombre(): string {
  try {
    return window.localStorage.getItem(LS_ANALISTA) || ''
  } catch {
    return ''
  }
}

export function setAnalistaNombre(value: string) {
  try {
    window.localStorage.setItem(LS_ANALISTA, value)
  } catch {
    /* localStorage no disponible */
  }
}

export const ESTADOS_SOLICITUD = [
  'Nueva',
  'Pendiente de evaluación BI',
  'Pendiente de información',
  'En evaluación BI',
  'Lista para autorización',
  'En autorización',
] as const

export const ESTADO_COLORS: Record<string, string> = {
  Nueva: 'bg-slate-100 text-slate-700 border-slate-300',
  'Pendiente de evaluación BI': 'bg-amber-100 text-amber-800 border-amber-300',
  'Pendiente de información': 'bg-orange-100 text-orange-800 border-orange-300',
  'En evaluación BI': 'bg-blue-100 text-blue-800 border-blue-300',
  'Lista para autorización': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'En autorización': 'bg-purple-100 text-purple-800 border-purple-300',
  Aprobada: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Aprobada urgente': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Aprobada con condiciones': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Rechazada: 'bg-red-100 text-red-800 border-red-300',
}

export const URGENCIA_COLORS: Record<string, string> = {
  Baja: 'bg-slate-100 text-slate-600 border-slate-300',
  Media: 'bg-blue-100 text-blue-700 border-blue-300',
  Alta: 'bg-orange-100 text-orange-700 border-orange-300',
  Crítica: 'bg-red-100 text-red-700 border-red-300',
}
