// Configuracion central del frontend: URLs reales de los webhooks de n8n y
// preferencias del usuario (x-api-key, nombre del analista) persistidas en localStorage.
//
// IMPORTANTE: no hay backend propio ni mocks. Todas las URLs vienen EXCLUSIVAMENTE de
// variables de entorno VITE_* (ver .env.example). Este archivo NO contiene URLs de
// produccion "de respaldo": si falta una variable, la app debe mostrar un error de
// configuracion claro en vez de intentar adivinar o usar un valor oculto.

interface EnvShape {
  PBI01_URL: string
  PBI02_URL: string
  PBI03_URL: string
  PBI04_URL: string
  PBI05_URL: string
  PBI06_URL: string
  PBI07_URL: string
  DEFAULT_API_KEY: string
}

const REQUIRED_VARS = [
  'VITE_PBI01_URL',
  'VITE_PBI02_URL',
  'VITE_PBI03_URL',
  'VITE_PBI04_URL',
  'VITE_PBI05_URL',
  'VITE_PBI06_URL',
  'VITE_PBI07_URL',
] as const

export const ENV: EnvShape = {
  PBI01_URL: import.meta.env.VITE_PBI01_URL ?? '',
  PBI02_URL: import.meta.env.VITE_PBI02_URL ?? '',
  PBI03_URL: import.meta.env.VITE_PBI03_URL ?? '',
  PBI04_URL: import.meta.env.VITE_PBI04_URL ?? '',
  PBI05_URL: import.meta.env.VITE_PBI05_URL ?? '',
  PBI06_URL: import.meta.env.VITE_PBI06_URL ?? '',
  PBI07_URL: import.meta.env.VITE_PBI07_URL ?? '',
  DEFAULT_API_KEY: import.meta.env.VITE_DEFAULT_API_KEY ?? '',
}

/**
 * Devuelve la lista de variables VITE_* obligatorias que faltan o están vacías.
 * La app debe llamar esto al iniciar y mostrar una pantalla de error de
 * configuración (en vez de intentar funcionar con datos incompletos) si el
 * resultado no está vacío. Ver src/components/ConfigError.tsx.
 */
export function getMissingEnvVars(): string[] {
  return REQUIRED_VARS.filter((key) => !import.meta.env[key])
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
