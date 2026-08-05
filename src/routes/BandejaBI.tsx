import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Search } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { EmptyState, ErrorState, LoadingState, networkErrorMessage } from '@/components/States'
import { listarSolicitudes } from '@/lib/api'
import { ESTADO_COLORS, ESTADOS_SOLICITUD, URGENCIA_COLORS } from '@/lib/config'
import type { SolicitudBandeja } from '@/lib/types'

export function BandejaBI() {
  const navigate = useNavigate()
  const [solicitudes, setSolicitudes] = useState<SolicitudBandeja[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estadosFiltro, setEstadosFiltro] = useState<string[]>([])
  const [area, setArea] = useState('')

  async function cargar() {
    setLoading(true)
    setError(null)
    const res = await listarSolicitudes({ estados: estadosFiltro, area: area.trim() })

    if (res.networkError) {
      setError(networkErrorMessage('jmejiaromero.app.n8n.cloud'))
      setLoading(false)
      return
    }
    if (!res.ok || !res.data?.ok) {
      setError(res.data?.error || `El servidor respondió con un error (HTTP ${res.status}).`)
      setLoading(false)
      return
    }
    setSolicitudes(res.data.solicitudes ?? [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleEstado(estado: string) {
    setEstadosFiltro((prev) =>
      prev.includes(estado) ? prev.filter((e) => e !== estado) : [...prev, estado],
    )
  }

  const chartData = useMemo(() => {
    if (!solicitudes) return []
    const counts = new Map<string, number>()
    for (const s of solicitudes) counts.set(s.estado, (counts.get(s.estado) ?? 0) + 1)
    return Array.from(counts.entries()).map(([estado, total]) => ({ estado, total }))
  }, [solicitudes])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Bandeja BI</h1>
          <p className="text-sm text-slate-500">
            Solicitudes registradas, obtenidas en tiempo real desde PBI-03 (Airtable vía n8n).
          </p>
        </div>
        <Button variant="secondary" onClick={cargar} icon={<RefreshCw className="h-4 w-4" />} loading={loading}>
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader title="Filtros" />
        <CardBody className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Estado</span>
            <div className="flex flex-wrap gap-2">
              {ESTADOS_SOLICITUD.map((estado) => (
                <button
                  key={estado}
                  onClick={() => toggleEstado(estado)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    estadosFiltro.includes(estado)
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="area" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Área solicitante
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ej. Finanzas"
                className="w-56 rounded-md border border-slate-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <Button onClick={cargar} loading={loading}>
            Aplicar filtros
          </Button>
        </CardBody>
      </Card>

      {solicitudes && solicitudes.length > 0 ? (
        <Card>
          <CardHeader title="Distribución por estado" />
          <CardBody>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="estado" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Solicitudes" subtitle={solicitudes ? `${solicitudes.length} resultado(s)` : undefined} />
        {loading ? (
          <LoadingState label="Consultando PBI-03 (n8n)..." />
        ) : error ? (
          <CardBody>
            <ErrorState message={error} onRetry={cargar} />
          </CardBody>
        ) : !solicitudes || solicitudes.length === 0 ? (
          <EmptyState label="No hay solicitudes que coincidan con los filtros seleccionados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Folio</th>
                  <th className="px-5 py-3">Proyecto</th>
                  <th className="px-5 py-3">Área</th>
                  <th className="px-5 py-3">Solicitante</th>
                  <th className="px-5 py-3">Urgencia</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Días sin atender</th>
                  <th className="px-5 py-3">Próxima acción</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s) => (
                  <tr
                    key={s.recordId}
                    onClick={() => navigate(`/evaluacion/${encodeURIComponent(s.folio)}`)}
                    className="cursor-pointer border-b border-slate-100 hover:bg-blue-50/50"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-slate-700">{s.folio}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{s.proyecto}</td>
                    <td className="px-5 py-3 text-slate-600">{s.area}</td>
                    <td className="px-5 py-3 text-slate-600">{s.solicitante}</td>
                    <td className="px-5 py-3">
                      <Badge label={s.urgencia || '—'} className={URGENCIA_COLORS[s.urgencia] ?? undefined} />
                    </td>
                    <td className="px-5 py-3">
                      <Badge label={s.estado || '—'} className={ESTADO_COLORS[s.estado] ?? undefined} />
                    </td>
                    <td className={`px-5 py-3 ${((s.diasSinAtender ?? 0) > 5) ? 'font-semibold text-red-600' : 'text-slate-600'}`}>
                      {s.diasSinAtender ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{s.accion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
