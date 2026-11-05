import { useEffect, useState } from 'react'

export type Role = 'admin_bi' | 'direccion'
export interface User { id: string; email: string; name: string; role: Role }
export interface Session { token: string; user: User }
const KEY = 'jirajorge_session'
const AUTH_URL = import.meta.env.VITE_AUTH_URL || ''

export function authConfigured() { return Boolean(AUTH_URL) }
export function currentSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const item: unknown = JSON.parse(raw)
    if (!item || typeof item !== 'object') return null
    const s = item as Partial<Session>
    if (typeof s.token !== 'string' || !s.token || !s.user || !['admin_bi', 'direccion'].includes(s.user.role)) return null
    return s as Session
  } catch { return null }
}
export function saveSession(s: Session | null) {
  if (s) sessionStorage.setItem(KEY, JSON.stringify(s))
  else sessionStorage.removeItem(KEY)
  window.dispatchEvent(new Event('jirajorge-session'))
}
export async function authRequest<T>(action: string, data: Record<string, unknown> = {}): Promise<T> {
  if (!AUTH_URL) throw new Error('Autenticación no configurada. Falta VITE_AUTH_URL.')
  const res = await fetch(AUTH_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...data }),
  })
  const payload = await res.json().catch(() => null)
  if (!res.ok || !payload?.ok) throw new Error(payload?.error || 'No se pudo completar la autenticación.')
  return payload as T
}
export async function validateSession(): Promise<Session | null> {
  const s = currentSession()
  if (!s || !AUTH_URL) return null
  try {
    const result = await authRequest<{ ok: boolean; user: User }>('me', { token: s.token })
    if (!result.user || result.user.id !== s.user.id || result.user.role !== s.user.role) return null
    return { token: s.token, user: result.user }
  } catch { return null }
}
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    let active = true
    const onChange = () => { setSession(currentSession()) }
    window.addEventListener('jirajorge-session', onChange)
    void validateSession().then(s => {
      if (!active) return
      saveSession(s)
      setSession(s)
      setChecking(false)
    })
    return () => { active = false; window.removeEventListener('jirajorge-session', onChange) }
  }, [])
  return { session, checking }
}
export async function logout() {
  const s = currentSession()
  saveSession(null)
  if (s) await authRequest('logout', { token: s.token }).catch(() => {})
}
