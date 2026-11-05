import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock3, FolderKanban, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { listarSolicitudes } from '@/lib/api'
import { loadProjects, projectsConfigured, type Project } from '@/lib/projects'
import { useSession } from '@/lib/auth'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { EmptyState, ErrorState, LoadingState } from '@/components/States'
import { ESTADO_COLORS } from '@/lib/config'
import type { SolicitudBandeja } from '@/lib/types'

export function DashboardEjecutivo() {
  const navigate = useNavigate()
  const { session } = useSession()
  const [items, setItems] = useState<SolicitudBandeja[] | null>(null)
  const [error, setError] = useState('')
  const [projectError, setProjectError] = useState('')
  const [portfolio, setPortfolio] = useState<Project[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  async function load() {
    setLoading(true); setError(''); setProjectError('')
    const res = await listarSolicitudes({ estados: [], area: '' })
    if (!res.ok || !res.data?.ok) setError(res.data?.error || 'No fue posible consultar las solicitudes reales.')
    else setItems(res.data.solicitudes || [])
    if (projectsConfigured()) {
      try {const data = await loadProjects(); setPortfolio(data.projects)}
      catch(e) {setProjectError(e instanceof Error ? e.message : 'No fue posible cargar los proyectos.')}
    } else setProjectError('La cartera de proyectos requiere el workflow PBI-08 y su configuración.')
    setLoading(false)
  }
  useEffect(() => { void load() }, [])
  const counts = useMemo(() => {
    const all = items || []
    return {
      total: all.length,
      pending: all.filter(s => /autorizaci[oó]n|lista para autorizar/i.test(s.estado)).length,
      approved: all.filter(s => /aprobad/i.test(s.estado)).length,
      delayed: all.filter(s => (s.diasSinAtender ?? 0) > 5 && !/aprobad|rechazad/i.test(s.estado)).length,
    }
  }, [items])
  const filtered = (items || []).filter(s => [s.proyecto, s.folio, s.area, s.estado].some(v => v.toLowerCase().includes(search.toLowerCase())))
  const cards = [
    { label: 'Solicitudes registradas', value: counts.total, icon: FolderKanban },
    { label: 'En autorización', value: counts.pending, icon: Clock3 },
    { label: 'Aprobadas', value: counts.approved, icon: CheckCircle2 },
    { label: 'Sin atender +5 días', value: counts.delayed, icon: AlertTriangle },
  ]
  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Vista compartida · Dirección</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Dashboard ejecutivo</h1>
        <p className="mt-1 text-sm text-slate-500">Cartera de solicitudes de proyectos BI · información registrada en Airtable</p>
        {session ? <p className="mt-1 text-xs text-slate-500">Sesión: {session.user.name}</p> : null}
      </div>
      <Button variant="secondary" onClick={load} loading={loading} icon={<RefreshCw size={16}/>}>Actualizar</Button>
    </div>
    {error ? <ErrorState message={error} onRetry={load}/> : null}
    {loading ? <LoadingState label="Consultando solicitudes reales…" /> : !error ? <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(({label,value,icon:Icon})=><Card key={label}><CardBody><div className="flex items-center gap-2 text-slate-500"><Icon size={18}/><span className="text-xs font-medium">{label}</span></div><div className="mt-3 text-3xl font-bold text-slate-900">{value}</div></CardBody></Card>)}
      </div>
      <Card>
        <CardHeader title="Cartera de proyectos en ejecución" subtitle="Información real de proyectos, actividades y fechas de Airtable." />
        {portfolio ? <><CardBody><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
          ['Proyectos registrados', portfolio.length],
          ['En desarrollo', portfolio.filter(p => /en desarrollo|en pruebas|en análisis/i.test(p.status)).length],
          ['Vencidos', portfolio.filter(p => !!p.dueDate && p.dueDate < new Date().toISOString().slice(0,10) && !/cerrado|publicado|cancelado/i.test(p.status)).length],
          ['Avance promedio', portfolio.length ? `${Math.round(portfolio.reduce((a,p)=>a+(p.progress??0),0)/portfolio.length)}%` : '—'],
        ].map(([label,value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>)}</div></CardBody>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-2">Proyecto</th><th className="px-4 py-2">Estado</th><th className="px-4 py-2">Avance</th><th className="px-4 py-2">Fecha compromiso</th></tr></thead><tbody>{portfolio.slice(0,12).map(p=><tr key={p.id} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{p.name}</td><td className="px-4 py-3">{p.status}</td><td className="px-4 py-3">{p.progress===null?'—':`${p.progress}%`}</td><td className="px-4 py-3">{p.dueDate||'—'}</td></tr>)}</tbody></table></div></> : <CardBody><p className="text-sm text-amber-800">{projectError || 'Cargando proyectos…'}</p></CardBody>}
      </Card>
      <Card>
        <CardHeader title="Solicitudes de proyectos" subtitle="Misma vista para Dirección Financiera y Dirección General. Los permisos de edición son independientes." />
        <CardBody><label className="block text-sm text-slate-600">Buscar por proyecto, área, folio o estado
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar solicitud…" className="mt-1 block w-full max-w-lg rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </label></CardBody>
        {!filtered.length ? <EmptyState label="No hay solicitudes que coincidan con la búsqueda."/> :
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Folio</th><th className="px-4 py-3">Proyecto</th><th className="px-4 py-3">Área</th><th className="px-4 py-3">Urgencia</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Días sin atender</th></tr></thead>
          <tbody>{filtered.map(s=><tr key={s.recordId} className="border-t border-slate-100"><td className="px-4 py-3 font-mono text-xs">{s.folio}</td><td className="px-4 py-3 font-medium">{s.proyecto}</td><td className="px-4 py-3">{s.area}</td><td className="px-4 py-3">{s.urgencia}</td><td className="px-4 py-3"><Badge label={s.estado} className={ESTADO_COLORS[s.estado]}/></td><td className="px-4 py-3">{s.diasSinAtender ?? '—'}</td></tr>)}</tbody></table></div>}
      </Card>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>Alcance de los datos:</strong> los indicadores anteriores se calculan con solicitudes PBI-03; el avance porcentual, las fechas compromiso y las actividades por proyecto requieren un endpoint adicional de cartera de proyectos. No se muestran cifras simuladas.
      </div>
      <div className="flex flex-wrap gap-2"><Button onClick={()=>navigate('/proyectos')}>Ver proyectos y actividades</Button>{session?.user.role === 'admin_bi' ? <Button variant="secondary" onClick={()=>navigate('/bandeja')}>Abrir bandeja operativa BI</Button> : null}</div>
    </> : null}
  </div>
}
