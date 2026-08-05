import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react'
import { Button } from './Button'

export function LoadingState({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function EmptyState({ label = 'No hay datos para mostrar.' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <Inbox className="h-10 w-10" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function ErrorState({
  title = 'No se pudo completar la solicitud',
  message,
  onRetry,
}: {
  title?: string
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertTriangle className="h-8 w-8 text-red-500" />
      <p className="text-sm font-semibold text-red-800">{title}</p>
      <p className="max-w-md text-sm text-red-700">{message}</p>
      {onRetry ? (
        <Button variant="danger" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
          Reintentar
        </Button>
      ) : null}
    </div>
  )
}

export function networkErrorMessage(host: string) {
  return `No se pudo conectar con el servidor (${host}). Verifica tu conexión a internet o que el servicio de n8n esté disponible, y vuelve a intentar.`
}
