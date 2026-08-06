import { AlertOctagon } from 'lucide-react'

export function ConfigError({ missing }: { missing: string[] }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <AlertOctagon className="h-8 w-8 text-red-500" />
          <h1 className="text-lg font-semibold text-slate-900">Falta configuración</h1>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Esta aplicación no puede iniciar porque faltan variables de entorno
          obligatorias. Todas las URLs de los webhooks de n8n deben definirse
          explícitamente; no hay valores de producción incluidos en el código por
          seguridad y para evitar apuntar accidentalmente al entorno equivocado.
        </p>
        <div className="mb-4 rounded-md bg-slate-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Variables faltantes o vacías
          </p>
          <ul className="space-y-1 font-mono text-sm text-red-700">
            {missing.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-slate-600">
          Copia <code className="rounded bg-slate-100 px-1 py-0.5">.env.example</code>{' '}
          a <code className="rounded bg-slate-100 px-1 py-0.5">.env</code> en la raíz
          del proyecto, verifica que todas las variables <code>VITE_PBI0X_URL</code>{' '}
          tengan un valor, y reinicia el servidor de desarrollo (o vuelve a compilar
          con <code className="rounded bg-slate-100 px-1 py-0.5">npm run build</code>).
        </p>
      </div>
    </div>
  )
}
