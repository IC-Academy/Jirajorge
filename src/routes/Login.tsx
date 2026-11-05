import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { authConfigured, authRequest, saveSession, type Session } from '@/lib/auth'
import { Card, CardBody } from '@/components/Card'
import { Button } from '@/components/Button'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [requested, setRequested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      if (!requested) {
        await authRequest('request-code', { email: email.trim().toLowerCase() })
        setRequested(true)
        setNotice('Si tu correo está autorizado, recibirás un código temporal.')
      } else {
        const response = await authRequest<{ ok: boolean; token: string; user: Session['user'] }>('verify-code', {
          email: email.trim().toLowerCase(), code: code.trim(),
        })
        if (!response.token || !response.user || !['admin_bi','direccion'].includes(response.user.role)) throw new Error('Respuesta de sesión no válida.')
        saveSession({ token: response.token, user: response.user })
        navigate('/dashboard', { replace: true })
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Error de autenticación.') }
    finally { setBusy(false) }
  }
  return <div className="mx-auto mt-8 max-w-md">
    <div className="mb-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-950 text-white"><ShieldCheck /></div>
      <h1 className="text-2xl font-bold text-slate-900">Acceso ejecutivo</h1>
      <p className="mt-2 text-sm text-slate-500">Portal de Proyectos BI · Inter-Con</p>
    </div>
    <Card><CardBody>
      {!authConfigured() ? <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">Inicio de sesión pendiente de conexión: falta configurar el servicio OTP de n8n. No se habilitará acceso sin autenticación.</p> : null}
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700"><span className="mb-1 block">Correo corporativo</span>
          <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input type="email" required autoComplete="email" value={email} disabled={requested} onChange={e=>setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 p-2.5 pl-10" placeholder="nombre@empresa.com" /></div>
        </label>
        {requested ? <label className="block text-sm font-medium text-slate-700"><span className="mb-1 block">Código de verificación</span>
          <div className="relative"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={e=>setCode(e.target.value)} className="w-full rounded-md border border-slate-300 p-2.5 pl-10" /></div>
        </label> : null}
        {notice ? <p role="status" className="text-sm text-blue-800">{notice}</p> : null}
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" disabled={!authConfigured()} loading={busy} className="w-full">{requested ? 'Ingresar al portal' : 'Enviar código'}</Button>
        {requested ? <button type="button" className="w-full text-sm text-slate-600 underline" onClick={()=>{setRequested(false);setCode('');setError('');setNotice('')}}>Cambiar correo</button> : null}
      </form>
    </CardBody></Card>
    <p className="mt-4 text-center text-xs text-slate-500">Acceso exclusivo para administradores y dirección. Las solicitudes públicas no requieren iniciar sesión.</p>
  </div>
}
