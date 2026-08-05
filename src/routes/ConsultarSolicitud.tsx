import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { Field, inputClass } from '@/components/Field'
import { Button } from '@/components/Button'
import { ErrorState, networkErrorMessage } from '@/components/States'
import { Badge } from '@/components/Badge'
import { consultarSolicitud } from '@/lib/api'
import { ESTADO_COLORS } from '@/lib/config'
import type { ConsultarSolicitudResponse } from '@/lib/types'

const schema = z.object({
  folio: z.string().min(1, 'Obligatorio'),
  correo: z.string().email('Correo inválido'),
  codigo: z.string().min(1, 'Obligatorio'),
})

type FormValues = z.infer<typeof schema>

export function ConsultarSolicitud() {
  const [loading, setLoading] = useState(false)
  const [networkErr, setNetworkErr] = useState<string | null>(null)
  const [notFound, setNotFound] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ConsultarSolicitudResponse | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    setNetworkErr(null)
    setNotFound(null)
    setResultado(null)
    const res = await consultarSolicitud(values)
    setLoading(false)

    if (res.networkError) {
      setNetworkErr(networkErrorMessage('jmejiaromero.app.n8n.cloud'))
      return
    }
    if (res.status === 404) {
      setNotFound(res.data?.error || 'No se encontró una solicitud con esos datos.')
      return
    }
    if (!res.ok || !res.data?.ok) {
      setNotFound(res.data?.error || `El servidor respondió con un error (HTTP ${res.status}).`)
      return
    }
    setResultado(res.data)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Consultar solicitud</h1>
        <p className="text-sm text-slate-500">
          Consulta pública de estatus (PBI-02): ingresa tu folio, correo y código de consulta.
        </p>
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Folio" required error={errors.folio?.message}>
              <input className={inputClass(!!errors.folio)} placeholder="SOL-..." {...register('folio')} />
            </Field>
            <Field label="Correo" required error={errors.correo?.message}>
              <input type="email" className={inputClass(!!errors.correo)} {...register('correo')} />
            </Field>
            <Field label="Código de consulta" required error={errors.codigo?.message}>
              <input className={inputClass(!!errors.codigo)} {...register('codigo')} />
            </Field>
            <div className="sm:col-span-3">
              <Button type="submit" loading={loading} icon={<Search className="h-4 w-4" />}>
                Consultar
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {networkErr ? (
        <div className="mt-4">
          <ErrorState message={networkErr} onRetry={() => setNetworkErr(null)} />
        </div>
      ) : null}

      {notFound ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {notFound}
        </div>
      ) : null}

      {resultado ? (
        <Card className="mt-4">
          <CardHeader
            title={resultado.proyecto || 'Solicitud'}
            subtitle={`Folio ${resultado.folio}`}
            action={<Badge label={resultado.estado || '—'} className={ESTADO_COLORS[resultado.estado ?? ''] ?? undefined} />}
          />
          <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <p><span className="font-medium text-slate-700">Área:</span> {resultado.area || '—'}</p>
            <p><span className="font-medium text-slate-700">Fecha de solicitud:</span> {resultado.fechaSolicitud ? new Date(resultado.fechaSolicitud).toLocaleString('es-MX') : '—'}</p>
            <p><span className="font-medium text-slate-700">Prioridad:</span> {resultado.prioridad ?? '—'}</p>
            <p><span className="font-medium text-slate-700">Posición en backlog:</span> {resultado.posicionBacklog ?? '—'}</p>
            <p><span className="font-medium text-slate-700">Inicio aproximado:</span> {resultado.inicioAproximado ?? '—'}</p>
            <p><span className="font-medium text-slate-700">Entrega aproximada:</span> {resultado.entregaAproximada ?? '—'}</p>
            <p><span className="font-medium text-slate-700">Avance:</span> {resultado.avance != null ? `${resultado.avance}%` : '—'}</p>
            <p className="sm:col-span-2"><span className="font-medium text-slate-700">Próximo paso:</span> {resultado.proximoPaso ?? '—'}</p>
            <p className="sm:col-span-2"><span className="font-medium text-slate-700">Comentarios:</span> {resultado.comentariosPublicos ?? '—'}</p>
          </CardBody>
        </Card>
      ) : null}
    </div>
  )
}
