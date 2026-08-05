import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Send, Save, HelpCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { Field, inputClass } from '@/components/Field'
import { Button } from '@/components/Button'
import { ErrorState, networkErrorMessage } from '@/components/States'
import { guardarEvaluacion, enviarAutorizacion } from '@/lib/api'
import { getAnalistaNombre, setAnalistaNombre } from '@/lib/config'
import type { AccionEvaluacion, GuardarEvaluacionPayload } from '@/lib/types'

const VIABILIDADES = ['Alta', 'Media', 'Baja']
const COMPLEJIDADES = ['Baja', 'Media', 'Alta', 'Muy alta']
const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Crítica']

type FormValues = Omit<GuardarEvaluacionPayload, 'folio' | 'evaluadoPor' | 'accion'>

const EMPTY_FORM: FormValues = {
  diagnosticoInicial: '',
  solucionPropuesta: '',
  viabilidadTecnica: '',
  viabilidadDatos: '',
  complejidad: '',
  horasEstimadas: null,
  diasHabilesEstimados: null,
  dependencias: '',
  riesgos: '',
  beneficioEsperadoBI: '',
  prioridadSugerida: '',
  posicionPropuesta: null,
  inicioAproximado: '',
  entregaAproximada: '',
  recomendacion: '',
  notasDireccion: '',
  informacionRequerida: '',
}

const REQUIRED_PARA_AUTORIZACION: (keyof FormValues)[] = [
  'diagnosticoInicial',
  'solucionPropuesta',
  'viabilidadTecnica',
  'complejidad',
  'horasEstimadas',
  'prioridadSugerida',
  'recomendacion',
]

export function EvaluacionBI() {
  const { folio = '' } = useParams()
  const [evaluadoPor, setEvaluadoPor] = useState(getAnalistaNombre())
  const [accionEnCurso, setAccionEnCurso] = useState<AccionEvaluacion | null>(null)
  const [networkErr, setNetworkErr] = useState<string | null>(null)
  const [serverErrors, setServerErrors] = useState<string[] | null>(null)
  const [clientErrors, setClientErrors] = useState<string[] | null>(null)
  const [okMessage, setOkMessage] = useState<string | null>(null)
  const [listaParaAutorizacion, setListaParaAutorizacion] = useState(false)

  const [envioAutorizacion, setEnvioAutorizacion] = useState<{
    loading: boolean
    error: string | null
    ok: string | null
  }>({ loading: false, error: null, ok: null })

  const { register, getValues } = useForm<FormValues>({ defaultValues: EMPTY_FORM })

  async function ejecutarAccion(accion: AccionEvaluacion) {
    const values = getValues()
    setServerErrors(null)
    setClientErrors(null)
    setNetworkErr(null)
    setOkMessage(null)

    if (!evaluadoPor.trim()) {
      setClientErrors(['Indica tu nombre en "Evaluado por" antes de continuar.'])
      return
    }
    if (accion === 'solicitar_informacion' && !values.informacionRequerida.trim()) {
      setClientErrors(['Describe qué información adicional se requiere del solicitante.'])
      return
    }
    if (accion === 'lista_autorizacion') {
      const faltantes = REQUIRED_PARA_AUTORIZACION.filter((k) => {
        const v = values[k]
        return v === '' || v === null || v === undefined
      })
      if (faltantes.length > 0) {
        setClientErrors([
          `Faltan campos obligatorios para enviar a autorización: ${faltantes.join(', ')}.`,
        ])
        return
      }
    }

    setAnalistaNombre(evaluadoPor)
    setAccionEnCurso(accion)

    const payload: GuardarEvaluacionPayload = {
      folio,
      evaluadoPor,
      accion,
      ...values,
      horasEstimadas: values.horasEstimadas ? Number(values.horasEstimadas) : null,
      diasHabilesEstimados: values.diasHabilesEstimados ? Number(values.diasHabilesEstimados) : null,
      posicionPropuesta: values.posicionPropuesta ? Number(values.posicionPropuesta) : null,
    }

    const res = await guardarEvaluacion(payload)
    setAccionEnCurso(null)

    if (res.networkError) {
      setNetworkErr(networkErrorMessage('jmejiaromero.app.n8n.cloud'))
      return
    }
    if (res.status === 400 && res.data?.errors) {
      setServerErrors(res.data.errors)
      return
    }
    if (res.status === 404) {
      setServerErrors([res.data?.error || 'No existe una solicitud con ese folio.'])
      return
    }
    if (!res.ok || !res.data?.ok) {
      setServerErrors([res.data?.error || `El servidor respondió con un error (HTTP ${res.status}).`])
      return
    }

    setOkMessage(`Guardado correctamente. Nuevo estado: ${res.data.estado}.`)
    if (accion === 'lista_autorizacion') setListaParaAutorizacion(true)
  }

  async function handleEnviarAutorizacion() {
    setEnvioAutorizacion({ loading: true, error: null, ok: null })
    const res = await enviarAutorizacion({ folio, enviadoPor: evaluadoPor })

    if (res.networkError) {
      setEnvioAutorizacion({ loading: false, error: networkErrorMessage('jmejiaromero.app.n8n.cloud'), ok: null })
      return
    }
    if (!res.ok || !res.data?.ok) {
      setEnvioAutorizacion({
        loading: false,
        error: res.data?.error || `El servidor respondió con un error (HTTP ${res.status}).`,
        ok: null,
      })
      return
    }
    setEnvioAutorizacion({
      loading: false,
      error: null,
      ok: `Se notificó a ${res.data.aprobadoresNotificados ?? 0} aprobador(es). Estado actualizado a "${res.data.estado}".`,
    })
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Evaluación BI</h1>
        <p className="text-sm text-slate-500 font-mono">{folio}</p>
      </div>

      <Card className="mb-6">
        <CardBody className="flex items-end gap-4">
          <Field label="Evaluado por" required className="w-72">
            <input
              className={inputClass()}
              value={evaluadoPor}
              onChange={(e) => setEvaluadoPor(e.target.value)}
              placeholder="Tu nombre"
            />
          </Field>
        </CardBody>
      </Card>

      {networkErr ? (
        <div className="mb-4">
          <ErrorState message={networkErr} onRetry={() => setNetworkErr(null)} />
        </div>
      ) : null}
      {clientErrors ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <ul className="list-inside list-disc">{clientErrors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      ) : null}
      {serverErrors ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ul className="list-inside list-disc">{serverErrors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      ) : null}
      {okMessage ? (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> {okMessage}
        </div>
      ) : null}

      {listaParaAutorizacion ? (
        <Card className="mb-6 border-indigo-200 bg-indigo-50/50">
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-900">
                Evaluación lista. ¿Enviar ahora a autorización?
              </p>
              <p className="text-xs text-indigo-700">
                Se generará el microinforme y se notificará a los aprobadores activos (PBI-05).
              </p>
              {envioAutorizacion.ok ? (
                <p className="mt-1 text-sm font-medium text-emerald-700">{envioAutorizacion.ok}</p>
              ) : null}
              {envioAutorizacion.error ? (
                <p className="mt-1 text-sm font-medium text-red-700">{envioAutorizacion.error}</p>
              ) : null}
            </div>
            <Button onClick={handleEnviarAutorizacion} loading={envioAutorizacion.loading} icon={<Send className="h-4 w-4" />}>
              Enviar a autorización ahora
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <form className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Diagnóstico" />
          <CardBody className="grid grid-cols-1 gap-4">
            <Field label="Diagnóstico inicial">
              <textarea rows={3} className={inputClass()} {...register('diagnosticoInicial')} />
            </Field>
            <Field label="Solución propuesta">
              <textarea rows={3} className={inputClass()} {...register('solucionPropuesta')} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Viabilidad técnica">
                <select className={inputClass()} {...register('viabilidadTecnica')} defaultValue="">
                  <option value="">Selecciona</option>
                  {VIABILIDADES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Viabilidad de datos">
                <select className={inputClass()} {...register('viabilidadDatos')} defaultValue="">
                  <option value="">Selecciona</option>
                  {VIABILIDADES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Complejidad">
                <select className={inputClass()} {...register('complejidad')} defaultValue="">
                  <option value="">Selecciona</option>
                  {COMPLEJIDADES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Estimación" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Horas estimadas">
              <input type="number" min={0} className={inputClass()} {...register('horasEstimadas')} />
            </Field>
            <Field label="Días hábiles estimados">
              <input type="number" min={0} className={inputClass()} {...register('diasHabilesEstimados')} />
            </Field>
            <Field label="Inicio aproximado">
              <input type="date" className={inputClass()} {...register('inicioAproximado')} />
            </Field>
            <Field label="Entrega aproximada">
              <input type="date" className={inputClass()} {...register('entregaAproximada')} />
            </Field>
            <Field label="Dependencias">
              <textarea rows={2} className={inputClass()} {...register('dependencias')} />
            </Field>
            <Field label="Riesgos">
              <textarea rows={2} className={inputClass()} {...register('riesgos')} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recomendación para dirección" />
          <CardBody className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Beneficio esperado BI">
                <textarea rows={2} className={inputClass()} {...register('beneficioEsperadoBI')} />
              </Field>
              <Field label="Prioridad sugerida">
                <select className={inputClass()} {...register('prioridadSugerida')} defaultValue="">
                  <option value="">Selecciona</option>
                  {PRIORIDADES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Posición propuesta en backlog">
              <input type="number" min={0} className={inputClass()} {...register('posicionPropuesta')} />
            </Field>
            <Field label="Recomendación">
              <textarea rows={3} className={inputClass()} {...register('recomendacion')} />
            </Field>
            <Field label="Notas para dirección">
              <textarea rows={2} className={inputClass()} {...register('notasDireccion')} />
            </Field>
            <Field
              label="Información requerida del solicitante"
              hint='Obligatorio solo si usarás el botón "Solicitar información al solicitante".'
            >
              <textarea rows={2} className={inputClass()} {...register('informacionRequerida')} />
            </Field>
          </CardBody>
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            icon={<Save className="h-4 w-4" />}
            loading={accionEnCurso === 'guardar_borrador'}
            onClick={() => ejecutarAccion('guardar_borrador')}
          >
            Guardar borrador
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={<HelpCircle className="h-4 w-4" />}
            loading={accionEnCurso === 'solicitar_informacion'}
            onClick={() => ejecutarAccion('solicitar_informacion')}
          >
            Solicitar información al solicitante
          </Button>
          <Button
            type="button"
            icon={<Send className="h-4 w-4" />}
            loading={accionEnCurso === 'lista_autorizacion'}
            onClick={() => ejecutarAccion('lista_autorizacion')}
          >
            Enviar a autorización
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <Link to="/bandeja" className="text-sm text-blue-700 hover:underline">← Volver a la Bandeja BI</Link>
      </div>
    </div>
  )
}
