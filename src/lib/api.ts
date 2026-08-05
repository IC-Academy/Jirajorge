// Cliente HTTP para los webhooks reales de n8n (PBI-01 a PBI-07).
// No hay backend propio: cada funcion aqui hace un fetch() directo desde el
// navegador contra la URL de produccion correspondiente. No se usan datos
// simulados: si una llamada falla, se propaga el error para que la pantalla
// lo muestre (nunca se sustituye por datos falsos).

import { ENV, getApiKey } from './config'
import type {
  ApiResult,
  RegistrarSolicitudPayload,
  RegistrarSolicitudResponse,
  ConsultarSolicitudPayload,
  ConsultarSolicitudResponse,
  ListarSolicitudesPayload,
  ListarSolicitudesResponse,
  GuardarEvaluacionPayload,
  GuardarEvaluacionResponse,
  EnviarAutorizacionPayload,
  EnviarAutorizacionResponse,
  ConsultarAprobacionPayload,
  ConsultarAprobacionResponse,
  RegistrarDecisionPayload,
  RegistrarDecisionResponse,
} from './types'

async function postJson<TResponse>(
  url: string,
  body: unknown,
  opts: { withApiKey?: boolean } = {},
): Promise<ApiResult<TResponse>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.withApiKey) {
    headers['x-api-key'] = getApiKey()
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    let data: TResponse | null = null
    try {
      data = (await res.json()) as TResponse
    } catch {
      data = null
    }

    return {
      ok: res.ok,
      status: res.status,
      data,
      networkError: false,
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      networkError: true,
      errorMessage: err instanceof Error ? err.message : 'Error de red desconocido',
    }
  }
}

export function registrarSolicitud(payload: RegistrarSolicitudPayload) {
  return postJson<RegistrarSolicitudResponse>(ENV.PBI01_URL, payload, { withApiKey: true })
}

export function consultarSolicitud(payload: ConsultarSolicitudPayload) {
  return postJson<ConsultarSolicitudResponse>(ENV.PBI02_URL, payload)
}

export function listarSolicitudes(payload: ListarSolicitudesPayload) {
  return postJson<ListarSolicitudesResponse>(ENV.PBI03_URL, payload, { withApiKey: true })
}

export function guardarEvaluacion(payload: GuardarEvaluacionPayload) {
  return postJson<GuardarEvaluacionResponse>(ENV.PBI04_URL, payload, { withApiKey: true })
}

export function enviarAutorizacion(payload: EnviarAutorizacionPayload) {
  return postJson<EnviarAutorizacionResponse>(ENV.PBI05_URL, payload, { withApiKey: true })
}

export function consultarAprobacion(payload: ConsultarAprobacionPayload) {
  return postJson<ConsultarAprobacionResponse>(ENV.PBI06_URL, payload)
}

export function registrarDecision(payload: RegistrarDecisionPayload) {
  return postJson<RegistrarDecisionResponse>(ENV.PBI07_URL, payload)
}
