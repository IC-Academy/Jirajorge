import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  ClipboardList,
  FileSearch,
  Inbox,
  ClipboardCheck,
  ShieldCheck,
  Settings,
  X,
} from 'lucide-react'
import { getApiKey, setApiKey } from '@/lib/config'

const NAV_ITEMS = [
  { to: '/bandeja', label: 'Bandeja BI', icon: Inbox },
  { to: '/registrar', label: 'Registrar solicitud', icon: ClipboardList },
  { to: '/consultar', label: 'Consultar solicitud', icon: FileSearch },
  { to: '/autorizaciones', label: 'Centro de autorizaciones', icon: ShieldCheck },
]

export function Layout({ children }: { children: ReactNode }) {
  const [configOpen, setConfigOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-blue-950 text-blue-50">
        <div className="flex items-center gap-2 border-b border-blue-900 px-5 py-5">
          <ClipboardCheck className="h-6 w-6 text-blue-300" />
          <div>
            <p className="text-sm font-semibold leading-tight">Portal BI</p>
            <p className="text-xs text-blue-300">Analista y Autorizaciones</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-blue-800 text-white' : 'text-blue-100 hover:bg-blue-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={() => setConfigOpen(true)}
          className="flex items-center gap-3 border-t border-blue-900 px-5 py-4 text-sm text-blue-200 hover:bg-blue-900"
        >
          <Settings className="h-4 w-4" />
          Configuración
        </button>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-800">
          <strong>Modo de pruebas activo:</strong> todas las notificaciones por correo del
          backend se redirigen a un correo interno de validación mientras se completa la
          puesta en marcha (SEND_REAL_EMAILS=false en n8n).
        </div>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>

      {configOpen ? <ConfigPanel onClose={() => setConfigOpen(false)} /> : null}
    </div>
  )
}

function ConfigPanel({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState(getApiKey())
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setApiKey(value)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Configuración</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          API Key (x-api-key)
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Pega aquí la clave del portal"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <p className="mt-2 text-xs text-slate-500">
          Esta clave protege los endpoints internos del portal (Bandeja BI, Evaluación,
          Enviar a autorización). Mientras no esté configurada del lado de n8n, las llamadas
          funcionan igual (modo de compatibilidad), pero se recomienda solicitarla al
          administrador del portal y configurarla aquí.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          {saved ? <span className="text-sm text-emerald-600">Guardado</span> : null}
          <button
            onClick={handleSave}
            className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
