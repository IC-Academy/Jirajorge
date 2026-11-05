import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity as ActivityIcon, AlertCircle, CalendarDays, Columns3, List, RefreshCw, Save } from 'lucide-react'
import { useSession } from '@/lib/auth'
import { loadProjects, projectsConfigured, updateActivity, updateProject, type Project, type Activity } from '@/lib/projects'
import { Card, CardBody, CardHeader } from '@/components/Card'
import { Button } from '@/components/Button'
import { LoadingState, ErrorState, EmptyState } from '@/components/States'

const activityStatuses = ['No iniciada','En curso','Bloqueada','Terminada']
const projectStatuses = ['Backlog','Programado','En desarrollo','En pruebas','Bloqueado','Completado','Cancelado']
const priorities = ['Baja','Media','Alta','Crítica']
function pct(v:number|null) { return typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.max(0, Math.min(100, v))) : null }
function today() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}` }
function progressBar(v:number|null) { const n=pct(v); return <div className="flex min-w-28 items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-700" style={{width:`${n??0}%`}} /></div><span className="text-xs">{n===null?'—':`${n}%`}</span></div> }

export function Proyectos() {
 const {session} = useSession()
 const admin = session?.user.role === 'admin_bi'
 const [projects,setProjects] = useState<Project[]>([])
 const [activities,setActivities] = useState<Activity[]>([])
 const [loading,setLoading] = useState(true)
 const [error,setError] = useState('')
 const [search,setSearch] = useState('')
 const [selected,setSelected] = useState('')
 const [view,setView] = useState<'lista'|'kanban'|'cronograma'>('lista')
 const [editing,setEditing] = useState<Activity|null>(null)
 const [editingProject,setEditingProject] = useState<Project|null>(null)
 const [saving,setSaving] = useState(false)
 const [message,setMessage] = useState('')
 const refresh=useCallback(async ()=>{
   if (!projectsConfigured()) {setLoading(false);setError('Falta configurar VITE_PROJECTS_URL y su workflow de n8n.');return}
   setLoading(true);setError('')
   try {const res=await loadProjects();setProjects(res.projects);setActivities(res.activities)}
   catch(e){setError(e instanceof Error?e.message:'No fue posible consultar los proyectos.')}
   finally {setLoading(false)}
 },[])
 useEffect(()=>{void refresh()},[refresh])
 const matching=useMemo(()=>projects.filter(p=>[p.id,p.name,p.area,p.status,p.priority].some(x=>x?.toLowerCase().includes(search.toLowerCase()))),[projects,search])
 const project=projects.find(p=>p.id===selected)
 const tasks=activities.filter(a=>a.projectId===selected)
 const current=today()
 const delayed=projects.filter(p=>p.dueDate && p.dueDate<current && !/completado|cancelado/i.test(p.status)).length
 const blocked=projects.filter(p=>/bloqueado/i.test(p.status)||!!p.blocker).length
 async function saveActivity() {
  if(!editing)return
  setSaving(true);setMessage('')
  try {await updateActivity(editing.id,{status:editing.status,progress:pct(editing.progress)??0,blocker:editing.blocker});setEditing(null);await refresh();setMessage('Actividad actualizada correctamente.')}
  catch(e){setMessage(e instanceof Error?e.message:'Error al guardar actividad.')}
  finally{setSaving(false)}
 }
 async function saveProject() {
  if(!editingProject)return
  setSaving(true);setMessage('')
  try {await updateProject(editingProject.id,{status:editingProject.status,priority:editingProject.priority,blocker:editingProject.blocker,nextMilestone:editingProject.nextMilestone,milestoneDate:editingProject.milestoneDate||''});setEditingProject(null);await refresh();setMessage('Proyecto actualizado correctamente.')}
  catch(e){setMessage(e instanceof Error?e.message:'Error al guardar proyecto.')}
  finally{setSaving(false)}
 }
 return <div className="space-y-6">
  <div className="flex flex-wrap items-start justify-between gap-3"><div>
   <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Portafolio de proyectos · BI</p>
   <h1 className="text-2xl font-bold">Cartera de proyectos</h1><p className="text-sm text-slate-500">Seguimiento ejecutivo, prioridades, actividades y compromisos.</p>
  </div><Button variant="secondary" icon={<RefreshCw size={16}/>} loading={loading} onClick={refresh}>Actualizar</Button></div>
  {error?<ErrorState message={error} onRetry={refresh}/>:null}
  {loading?<LoadingState label="Consultando cartera de proyectos…"/>:!error?<>
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    {[['Proyectos',projects.length],['Actividades',activities.length],['Proyectos vencidos',delayed],['Con bloqueos',blocked]].map(([label,num])=><Card key={label}><CardBody><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold">{num}</p></CardBody></Card>)}
  </div>
  <Card><CardHeader title="Portafolio" subtitle="Selecciona un proyecto para consultar sus actividades y avances."/>
   <CardBody className="flex flex-wrap items-center gap-3">
    <input aria-label="Buscar proyectos" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Buscar proyecto, área, prioridad…" value={search} onChange={e=>setSearch(e.target.value)}/>
    <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
      {([['lista','Lista',List],['kanban','Kanban',Columns3],['cronograma','Cronograma',CalendarDays]] as const).map(([id,label,Icon])=><button key={id} type="button" onClick={()=>setView(id)} className={`flex items-center gap-1 rounded-md px-3 py-2 text-xs ${view===id?'bg-white font-semibold shadow-sm':'text-slate-600'}`}><Icon size={15}/>{label}</button>)}
    </div>
   </CardBody>
   {!matching.length?<EmptyState label="No hay proyectos para mostrar."/>:view==='lista'?
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Proyecto','Estado','Prioridad','Avance','Compromiso','Acción'].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead>
      <tbody>{matching.map(p=><tr key={p.id} className={`border-t border-slate-100 ${p.id===selected?'bg-blue-50':''}`}>
       <td className="px-4 py-3"><button type="button" className="text-left font-semibold text-blue-900 hover:underline" onClick={()=>setSelected(p.id)}><span className="block text-xs font-normal text-slate-500">{p.id}</span>{p.name}</button></td><td className="px-4 py-3">{p.status}</td><td className="px-4 py-3">{p.priority}</td><td className="px-4 py-3">{progressBar(p.progress)}</td><td className={`px-4 py-3 ${p.dueDate && p.dueDate<current && p.status!=='Completado'?'font-semibold text-red-700':''}`}>{p.dueDate||'—'}</td><td className="px-4 py-3">{admin?<button className="text-sm font-semibold text-blue-800 underline" onClick={()=>setEditingProject({...p})}>Editar</button>:<span className="text-slate-400">Consulta</span>}</td>
      </tr>)}</tbody></table></div>:
      view==='kanban'?<div className="grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-4">{projectStatuses.filter(st=>matching.some(p=>p.status===st)).map(st=><div key={st} className="rounded-lg bg-slate-100 p-3"><p className="mb-3 text-sm font-semibold">{st} · {matching.filter(p=>p.status===st).length}</p><div className="space-y-2">{matching.filter(p=>p.status===st).map(p=><button key={p.id} type="button" onClick={()=>setSelected(p.id)} className="w-full rounded-lg border bg-white p-3 text-left shadow-sm"><span className="text-xs text-slate-500">{p.id}</span><p className="text-sm font-semibold">{p.name}</p><div className="mt-2">{progressBar(p.progress)}</div></button>)}</div></div>)}</div>:
      <div className="overflow-x-auto p-4"><p className="mb-3 text-xs text-slate-500">Fechas estimadas de inicio y entrega registradas. Se muestran como etiquetas para evitar escalas engañosas.</p>
      <div className="min-w-[600px] space-y-2">{matching.map(p=><button key={p.id} onClick={()=>setSelected(p.id)} className="grid w-full grid-cols-[2fr_1fr_1fr_1fr] items-center gap-3 rounded border p-3 text-left text-sm hover:bg-blue-50"><span className="font-semibold">{p.name}</span><span>{p.startDate||'Sin inicio'}</span><span>{p.dueDate||'Sin entrega'}</span>{progressBar(p.progress)}</button>)}</div></div>}
  </Card>
  {project?<Card><CardHeader title={project.name} subtitle={`${project.id} · ${project.area} · ${tasks.length} actividades`}/><CardBody className="space-y-4">
    <div className="grid gap-3 text-sm sm:grid-cols-3"><p><b>Responsable:</b> {project.owner||'—'}</p><p><b>Próximo hito:</b> {project.nextMilestone||'—'}</p><p><b>Fecha del hito:</b> {project.milestoneDate||'—'}</p></div>
    {project.blocker?<div className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900"><AlertCircle size={18}/>{project.blocker}</div>:null}
    <div className="space-y-2">{tasks.map(a=><div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"><div><p className="text-sm font-semibold">{a.name}</p><p className="text-xs text-slate-500">{a.id} · {a.status} · {a.dueDate||'Sin fecha'}</p></div><div className="flex items-center gap-3">{progressBar(a.progress)}{admin?<button onClick={()=>setEditing({...a})} className="text-sm font-semibold text-blue-900 underline">Editar</button>:null}</div></div>)}</div>
    {!tasks.length?<EmptyState label="Este proyecto no tiene actividades registradas."/>:null}
  </CardBody></Card>:null}
  </>:null}
  {message?<p role="status" className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">{message}</p>:null}
  {editing?<div role="dialog" aria-modal="true" aria-label="Editar actividad" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"><h2 className="font-semibold">Editar actividad</h2><p className="my-2 text-sm text-slate-600">{editing.name}</p>
     <label className="mt-3 block text-sm">Estado<select value={editing.status} onChange={e=>setEditing({...editing,status:e.target.value})} className="mt-1 block w-full rounded border p-2">{activityStatuses.map(x=><option key={x}>{x}</option>)}</select></label>
     <label className="mt-3 block text-sm">Avance (%)<input type="number" min={0} max={100} value={editing.progress??0} onChange={e=>setEditing({...editing,progress:Number(e.target.value)})} className="mt-1 block w-full rounded border p-2"/></label>
     <label className="mt-3 block text-sm">Bloqueo<textarea value={editing.blocker} onChange={e=>setEditing({...editing,blocker:e.target.value})} className="mt-1 block w-full rounded border p-2"/></label>
     <div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={()=>setEditing(null)}>Cancelar</Button><Button loading={saving} icon={<Save size={16}/>} onClick={saveActivity}>Guardar</Button></div>
   </div>
  </div>:null}
  {editingProject?<div role="dialog" aria-modal="true" aria-label="Editar proyecto" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl"><h2 className="font-semibold">Actualizar proyecto</h2><p className="my-2 text-sm text-slate-600">{editingProject.name}</p>
      <label className="mt-3 block text-sm">Estado<select className="mt-1 block w-full rounded border p-2" value={editingProject.status} onChange={e=>setEditingProject({...editingProject,status:e.target.value})}>{projectStatuses.map(x=><option key={x}>{x}</option>)}</select></label>
      <label className="mt-3 block text-sm">Prioridad<select className="mt-1 block w-full rounded border p-2" value={editingProject.priority} onChange={e=>setEditingProject({...editingProject,priority:e.target.value})}>{priorities.map(x=><option key={x}>{x}</option>)}</select></label>
      <label className="mt-3 block text-sm">Próximo hito<input className="mt-1 block w-full rounded border p-2" value={editingProject.nextMilestone} onChange={e=>setEditingProject({...editingProject,nextMilestone:e.target.value})}/></label>
      <label className="mt-3 block text-sm">Fecha próximo hito<input type="date" className="mt-1 block w-full rounded border p-2" value={editingProject.milestoneDate||''} onChange={e=>setEditingProject({...editingProject,milestoneDate:e.target.value})}/></label>
      <label className="mt-3 block text-sm">Bloqueo<textarea className="mt-1 block w-full rounded border p-2" value={editingProject.blocker} onChange={e=>setEditingProject({...editingProject,blocker:e.target.value})}/></label>
      <div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={()=>setEditingProject(null)}>Cancelar</Button><Button loading={saving} onClick={saveProject} icon={<ActivityIcon size={16}/>}>Guardar</Button></div>
    </div>
  </div>:null}
 </div>
}
