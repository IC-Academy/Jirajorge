// Tipos compartidos de los contratos reales de los webhooks PBI-01 a PBI-07.
// Reflejan exactamente los campos que devuelven/reciben los workflows de n8n
// (ver /n8n-workflows/*.json y el README del backend para el detalle completo).

export interface ApiResult<T> {
  ok: boolean
  status: number
  data: T | null
  networkError: boolean
  errorMessage?: string
}

// ---------- PBI-01 Registrar Solicitud ----------
export interface RegistrarSolicitudPayload {
  nombreProyecto: string
  area: string
  solicitante: string
  correo: string
  responsableFuncional: string
  tipoProyecto: string
  problemaActual: string
  resultadoEsperado: string
  usuariosImpactados: string
  beneficioEsperado: string
  fuenteDatos: string
  fechaRequerida: string
  urgencia: string
  justificacionUrgencia: string
  comentariosAdicionales: string
}

export interface RegistrarSolicitudResponse {
  ok: boolean
  folio?: string
  codigoConsulta?: string
  estado?: string
  fechaRegistro?: string
  errors?: string[]
  error?: string
}

// ---------- PBI-02 Consultar Solicitud ----------
export interface ConsultarSolicitudPayload {
  folio: string
  correo: string
  codigo: string
}

export interface ConsultarSolicitudResponse {
  ok: boolean
  folio?: string
  proyecto?: string
  area?: string
  fechaSolicitud?: string
  estado?: string
  prioridad?: string | null
  posicionBacklog?: number | null
  inicioAproximado?: string | null
  entregaAproximada?: string | null
  avance?: number | null
  proximoPaso?: string | null
  comentariosPublicos?: string | null
  errors?: string[]
  error?: string
}

// ---------- PBI-03 Listar Solicitudes (Bandeja BI) ----------
export interface ListarSolicitudesPayload {
  estados: string[]
  area: string
}

export interface SolicitudBandeja {
  recordId: string
  folio: string
  proyecto: string
  area: string
  solicitante: string
  fechaSolicitud: string | null
  fechaRequerida: string | null
  urgencia: string
  estado: string
  diasSinAtender: number | null
  accion: string
}

export interface ListarSolicitudesResponse {
  ok: boolean
  total?: number
  solicitudes?: SolicitudBandeja[]
  error?: string
}

// ---------- PBI-04 Guardar Evaluación ----------
export type AccionEvaluacion = 'guardar_borrador' | 'solicitar_informacion' | 'lista_autorizacion'

export interface GuardarEvaluacionPayload {
  folio: string
  evaluadoPor: string
  accion: AccionEvaluacion
  diagnosticoInicial: string
  solucionPropuesta: string
  viabilidadTecnica: string
  viabilidadDatos: string
  complejidad: string
  horasEstimadas: number | null
  diasHabilesEstimados: number | null
  dependencias: string
  riesgos: string
  beneficioEsperadoBI: string
  prioridadSugerida: string
  posicionPropuesta: number | null
  inicioAproximado: string
  entregaAproximada: string
  recomendacion: string
  notasDireccion: string
  informacionRequerida: string
}

export interface GuardarEvaluacionResponse {
  ok: boolean
  folio?: string
  accion?: string
  estado?: string
  errors?: string[]
  error?: string
}

// ---------- PBI-05 Enviar a Autorización ----------
export interface EnviarAutorizacionPayload {
  folio: string
  enviadoPor: string
}

export interface EnviarAutorizacionResponse {
  ok: boolean
  folio?: string
  estado?: string
  aprobadoresNotificados?: number
  error?: string
}

// ---------- PBI-06 Consultar Aprobación ----------
export interface ConsultarAprobacionPayload {
  token: string
}

export interface ConsultarAprobacionResponse {
  ok: boolean
  folio?: string
  proyecto?: string
  area?: string
  solicitante?: string
  problema?: string
  resultadoEsperado?: string
  diagnostico?: string
  solucionPropuesta?: string
  viabilidad?: string
  complejidad?: string
  horasEstimadas?: number
  recomendacionBI?: string
  prioridadSugerida?: string
  tuCargo?: string
  tuNombre?: string
  decisionPrevia?: string
  error?: string
}

// ---------- PBI-07 Registrar Decisión ----------
export type DecisionAprobador =
  | 'Aprobar'
  | 'Aprobar como urgente'
  | 'Aprobar con ajustes'
  | 'Solicitar información adicional'
  | 'Rechazar'

export interface RegistrarDecisionPayload {
  token: string
  decision: DecisionAprobador
  comentarios: string
  condiciones: string
  prioridadAutorizada: string
}

export interface RegistrarDecisionResponse {
  ok: boolean
  folio?: string
  decisionRegistrada?: string
  resolucionFinal?: string
  estadoSolicitud?: string
  errors?: string[]
  error?: string
}
