import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, ShieldCheck, Send, Lock } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { Field, inputClass } from '@/components/Field'
import { Button } from '@/components/Button'
import { ErrorState, networkErrorMessage } from '@/components/States'
import { consultarAprobacion, registrarDecision } from '@/lib/api'
import type { ConsultarAprobacionResponse, DecisionAprobador, RegistrarDecisionResponse } from '@/lib/types'

const DECISIONES: DecisionAprobador[] = [
  'Aprobar',
  'Aprobar como urgente',
  'Aprobar con ajustes',
  'Solicitar información adicional',
  'Rechazar',
]
const PRIORIDADES = ['', 'Baja', 'Media', 'Alta', 'Crítica']

export function CentroAutorizaciones() {
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token') ?? ''

  const [token, setToken] = useState(tokenFromUrl)
  const [loadingConsulta, setLoadingConsulta] = useState(false)
  const [consultaError, setConsultaError] = useState<string | null>(null)
  const [networkErr, setNetworkErr] = useState<string | null>(null)
  const [microinforme, setMicroinforme] = useState<ConsultarAprobacionResponse | null>(null)
  const [autoConsultado, setAutoConsultado] = useState(false)

  const [decision, setDecision] = useState<DecisionAprobador | ''>('')
  const [comentarios, setComentarios] = useState('')
  const [condiciones, setCondiciones] = useState('')
  const [prioridadAutorizada, setPrioridadAutorizada] = useState('')
  const [decisionLoading, setDecisionLoading] = useState(false)
  const [decisionError, setDecisionError] = useState<string | null>(null)
  const [decisionResultado, setDecisionResultado] = useState<RegistrarDecisionResponse | null>(null)

  const handleConsultar = useCallback(
    async (tokenValue: string) => {
      if (!tokenValue.trim()) {
        setConsultaError('Ingresa el token de aprobación recibido por correo.')
        return
      }
      setLoadingConsulta(true)
      setConsultaError(null)
      setNetworkErr(null)
      setMicroinforme(null)
      setDecisionResultado(null)

      const res = await consultarAprobacion({ token: tokenValue.trim() })
      setLoadingConsulta(false)

      if (res.networkError) {
        setNetworkErr(networkErrorMessage('jmejiaromero.app.n8n.cloud'))
        return
      }
      if (!res.ok || !res.data?.ok) {
        setConsultaError(res.data?.error || `El servidor respondió con un error (HTTP ${res.status}).`)
        return
      }
      setMicroinforme(res.data)
    },
    [],
  )

  // Si el enlace del correo trae ?token=..., lo consultamos automáticamente al
  // cargar la pantalla: el aprobador no necesita copiar ni pegar nada.
  useEffect(() => {
    if (tokenFromUrl && !autoConsultado) {
      setAutoConsultado(true)
      handleConsultar(tokenFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl, autoConsultado])

  async function handleRegistrarDecision() {
    if (!decision) {
      setDecisionError('Selecciona una decisión.')
      return
    }
    setDecisionLoading(true)
    setDecisionError(null)

    const res = await registrarDecision({
      token: token.trim(),
      decision,
      comentarios,
      condiciones: decision === 'Aprobar con ajustes' ? condiciones : '',
      prioridadAutorizada,
    })
    setDecisionLoading(false)

    if (res.networkError) {
      setDecisionError(networkErrorMessage('jmejiaromero.app.n8n.cloud'))
      return
    }
    if (res.status === 400 && res.data?.errors) {
      setDecisionError(res.data.errors.join(' '))
      return
    }
    if (!res.ok || !res.data?.ok) {
      setDecisionError(res.data?.error || `El servidor respondió con un error (HTTP ${res.status}).`)
      return
    }
    setDecisionResultado(res.data)
  }

  const yaRespondida = !!microinforme?.decisionPrevia && microinforme.decisionPrevia !== 'Pendiente'

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-blue-900" />
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Centro de autorizaciones</h1>
          <p className="text-sm text-slate-500">
            Consulta tu microinforme y registra tu decisión con el token recibido por correo (PBI-06 / PBI-07).
          </p>
        </div>
      </div>

      {tokenFromUrl && loadingConsulta && !microinforme ? (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Detectamos tu token en el enlace del correo. Consultando tu microinforme automáticamente...
        </div>
      ) : null}

      <Card>
        <CardBody className="flex flex-wrap items-end gap-4">
          <Field label="Token de aprobación" required className="flex-1 min-w-[280px]">
            <input
              className={inputClass()}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Pega aquí el token recibido por correo"
            />
          </Field>
          <Button onClick={() => handleConsultar(token)} loading={loadingConsulta} icon={<Search className="h-4 w-4" />}>
            Consultar microinforme
          </Button>
        </CardBody>
      </Card>

      {networkErr ? (
        <div className="mt-4">
          <ErrorState message={networkErr} onRetry={() => setNetworkErr(null)} />
        </div>
      ) : null}
      {consultaError ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {consultaError}
        </div>
      ) : null}

      {microinforme ? (
        <>
          <Card className="mt-6">
            <CardHeader
              title={`Hola ${microinforme.tuNombre ?? ''}, ${microinforme.tuCargo ?? ''}`}
              subtitle={`Folio ${microinforme.folio}`}
            />
            <CardBody className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <p><span className="font-medium text-slate-700">Proyecto:</span> {microinforme.proyecto}</p>
              <p><span className="font-medium text-slate-700">Área:</span> {microinforme.area}</p>
              <p><span className="font-medium text-slate-700">Solicitante:</span> {microinforme.solicitante}</p>
              <p><span className="font-medium text-slate-700">Complejidad:</span> {microinforme.complejidad} — {microinforme.horasEstimadas} h</p>
              <p className="sm:col-span-2"><span className="font-medium text-slate-700">Problema:</span> {microinforme.problema}</p>
              <p className="sm:col-span-2"><span className="font-medium text-slate-700">Resultado esperado:</span> {microinforme.resultadoEsperado}</p>
              <p className="sm:col-span-2"><span className="font-medium text-slate-700">Diagnóstico BI:</span> {microinforme.diagnostico}</p>
              <p className="sm:col-span-2"><span className="font-medium text-slate-700">Solución propuesta:</span> {microinforme.solucionPropuesta}</p>
              <p><span className="font-medium text-slate-700">Viabilidad técnica:</span> {microinforme.viabilidad}</p>
              <p><span className="font-medium text-slate-700">Prioridad sugerida:</span> {microinforme.prioridadSugerida}</p>
              <p className="sm:col-span-2"><span className="font-medium text-slate-700">Recomendación BI:</span> {microinforme.recomendacionBI}</p>
            </CardBody>
          </Card>

          {yaRespondida ? (
            <Card className="mt-6 border-indigo-200 bg-indigo-50/50">
              <CardBody className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 text-indigo-700" />
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Esta autorización ya fue respondida</p>
                  <p className="mt-1 text-sm text-indigo-800">
                    Decisión registrada: <strong>{microinforme.decisionPrevia}</strong>
                  </p>
                  <p className="mt-2 text-xs text-indigo-700">
                    El token de esta autorización ya fue utilizado. Por seguridad (PBI-07), no es posible
                    registrar una nueva decisión con el mismo token.
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : decisionResultado ? (
            <Card className="mt-6 border-emerald-200 bg-emerald-50/50">
              <CardBody>
                <p className="text-sm font-semibold text-emerald-900">Decisión registrada correctamente</p>
                <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-emerald-800 sm:grid-cols-2">
                  <p><span className="font-medium">Decisión:</span> {decisionResultado.decisionRegistrada}</p>
                  <p><span className="font-medium">Resolución final:</span> {decisionResultado.resolucionFinal}</p>
                  <p className="sm:col-span-2"><span className="font-medium">Estado de la solicitud:</span> {decisionResultado.estadoSolicitud}</p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card className="mt-6">
              <CardHeader title="Registrar decisión" />
              <CardBody className="flex flex-col gap-4">
                <Field label="Decisión" required>
                  <div className="flex flex-wrap gap-2">
                    {DECISIONES.map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setDecision(d)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          decision === d
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Comentarios">
                  <textarea rows={3} className={inputClass()} value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
                </Field>
                {decision === 'Aprobar con ajustes' ? (
                  <Field label="Condiciones de aprobación" required>
                    <textarea rows={2} className={inputClass()} value={condiciones} onChange={(e) => setCondiciones(e.target.value)} />
                  </Field>
                ) : null}
                <Field label="Prioridad autorizada (opcional)">
                  <select className={inputClass()} value={prioridadAutorizada} onChange={(e) => setPrioridadAutorizada(e.target.value)}>
                    {PRIORIDADES.map((p) => (
                      <option key={p || 'none'} value={p}>{p || 'Sin especificar'}</option>
                    ))}
                  </select>
                </Field>
                {decisionError ? (
                  <p className="text-sm text-red-600">{decisionError}</p>
                ) : null}
                <div className="flex justify-end">
                  <Button onClick={handleRegistrarDecision} loading={decisionLoading} icon={<Send className="h-4 w-4" />}>
                    Registrar decisión
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}
