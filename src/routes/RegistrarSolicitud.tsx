import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { Field, inputClass } from '@/components/Field'
import { Button } from '@/components/Button'
import { ErrorState, networkErrorMessage } from '@/components/States'
import { registrarSolicitud } from '@/lib/api'

const TIPOS_PROYECTO = [
  'Dashboard / BI',
  'Automatización',
  'Aplicación / Portal',
  'Integración de datos',
  'Análisis especial',
  'Mejora a solución existente',
  'Otro',
]
const URGENCIAS = ['Baja', 'Media', 'Alta', 'Crítica']

const schema = z.object({
  nombreProyecto: z.string().min(1, 'Obligatorio'),
  area: z.string().min(1, 'Obligatorio'),
  solicitante: z.string().min(1, 'Obligatorio'),
  correo: z.string().email('Correo inválido'),
  responsableFuncional: z.string(),
  tipoProyecto: z.string().min(1, 'Selecciona un tipo'),
  problemaActual: z.string().min(1, 'Obligatorio'),
  resultadoEsperado: z.string().min(1, 'Obligatorio'),
  usuariosImpactados: z.string(),
  beneficioEsperado: z.string(),
  fuenteDatos: z.string(),
  fechaRequerida: z.string().min(1, 'Obligatorio'),
  urgencia: z.string().min(1, 'Selecciona una urgencia'),
  justificacionUrgencia: z.string(),
  comentariosAdicionales: z.string(),
})

type FormValues = z.infer<typeof schema>

export function RegistrarSolicitud() {
  const [submitting, setSubmitting] = useState(false)
  const [networkErr, setNetworkErr] = useState<string | null>(null)
  const [serverErrors, setServerErrors] = useState<string[] | null>(null)
  const [success, setSuccess] = useState<{ folio: string; codigoConsulta: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    setNetworkErr(null)
    setServerErrors(null)
    const res = await registrarSolicitud(values)
    setSubmitting(false)

    if (res.networkError) {
      setNetworkErr(networkErrorMessage('jmejiaromero.app.n8n.cloud'))
      return
    }
    if (res.status === 400 && res.data?.errors) {
      setServerErrors(res.data.errors)
      return
    }
    if (!res.ok || !res.data?.ok) {
      setServerErrors([res.data?.error || `El servidor respondió con un error (HTTP ${res.status}).`])
      return
    }

    setSuccess({ folio: res.data.folio!, codigoConsulta: res.data.codigoConsulta! })
    reset()
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <h2 className="text-lg font-semibold text-slate-900">Solicitud registrada</h2>
            <p className="text-sm text-slate-600">
              Guarda tu folio y código de consulta para dar seguimiento en la pantalla
              "Consultar solicitud".
            </p>
            <div className="w-full rounded-md bg-slate-50 p-4 text-left text-sm">
              <p><span className="font-medium">Folio:</span> <span className="font-mono">{success.folio}</span></p>
              <p><span className="font-medium">Código de consulta:</span> <span className="font-mono">{success.codigoConsulta}</span></p>
            </div>
            <Button onClick={() => setSuccess(null)}>Registrar otra solicitud</Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Registrar solicitud</h1>
        <p className="text-sm text-slate-500">Envía una nueva solicitud de proyecto BI (PBI-01).</p>
      </div>

      {networkErr ? (
        <div className="mb-4">
          <ErrorState message={networkErr} onRetry={() => setNetworkErr(null)} />
        </div>
      ) : null}

      {serverErrors ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ul className="list-inside list-disc">
            {serverErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Datos del proyecto" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre del proyecto" required error={errors.nombreProyecto?.message}>
              <input className={inputClass(!!errors.nombreProyecto)} {...register('nombreProyecto')} />
            </Field>
            <Field label="Área solicitante" required error={errors.area?.message}>
              <input className={inputClass(!!errors.area)} {...register('area')} />
            </Field>
            <Field label="Tipo de proyecto" required error={errors.tipoProyecto?.message}>
              <select className={inputClass(!!errors.tipoProyecto)} {...register('tipoProyecto')} defaultValue="">
                <option value="" disabled>Selecciona una opción</option>
                {TIPOS_PROYECTO.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Fuente de datos" hint="Sistema, archivo o base de datos origen">
              <input className={inputClass()} {...register('fuenteDatos')} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Solicitante" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre del solicitante" required error={errors.solicitante?.message}>
              <input className={inputClass(!!errors.solicitante)} {...register('solicitante')} />
            </Field>
            <Field label="Correo del solicitante" required error={errors.correo?.message}>
              <input type="email" className={inputClass(!!errors.correo)} {...register('correo')} />
            </Field>
            <Field label="Responsable funcional">
              <input className={inputClass()} {...register('responsableFuncional')} />
            </Field>
            <Field label="Usuarios o áreas impactadas">
              <input className={inputClass()} {...register('usuariosImpactados')} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Descripción de la necesidad" />
          <CardBody className="grid grid-cols-1 gap-4">
            <Field label="Problema actual" required error={errors.problemaActual?.message}>
              <textarea rows={3} className={inputClass(!!errors.problemaActual)} {...register('problemaActual')} />
            </Field>
            <Field label="Resultado esperado" required error={errors.resultadoEsperado?.message}>
              <textarea rows={3} className={inputClass(!!errors.resultadoEsperado)} {...register('resultadoEsperado')} />
            </Field>
            <Field label="Beneficio esperado">
              <textarea rows={2} className={inputClass()} {...register('beneficioEsperado')} />
            </Field>
            <Field label="Comentarios adicionales">
              <textarea rows={2} className={inputClass()} {...register('comentariosAdicionales')} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Urgencia" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Fecha requerida" required error={errors.fechaRequerida?.message}>
              <input type="date" className={inputClass(!!errors.fechaRequerida)} {...register('fechaRequerida')} />
            </Field>
            <Field label="Urgencia solicitada" required error={errors.urgencia?.message}>
              <select className={inputClass(!!errors.urgencia)} {...register('urgencia')} defaultValue="">
                <option value="" disabled>Selecciona una opción</option>
                {URGENCIAS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Field>
            <Field label="Justificación de urgencia" className="sm:col-span-2">
              <textarea rows={2} className={inputClass()} {...register('justificacionUrgencia')} />
            </Field>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={submitting}>
            Registrar solicitud
          </Button>
        </div>
      </form>
    </div>
  )
}
