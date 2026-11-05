import { currentSession } from './auth'
export interface Project {
 id: string; name: string; area: string; owner: string; sponsor: string
 status: string; priority: string; health: string; progress: number | null
 startDate: string | null; dueDate: string | null; nextMilestone: string
 milestoneDate: string | null; blocker: string
}
export interface Activity {
 id: string; projectId: string; name: string; phase: string; owner: string
 status: string; progress: number | null; startDate: string | null
 dueDate: string | null; blocker: string
}
const URL = import.meta.env.VITE_PROJECTS_URL || ''
export function projectsConfigured() { return !!URL }
export async function projectsRequest<T>(action: string, data: Record<string, unknown> = {}): Promise<T> {
 const token = currentSession()?.token
 if (!token) throw new Error('Sesión requerida.')
 if (!URL) throw new Error('Servicio de proyectos no configurado (VITE_PROJECTS_URL).')
 const response = await fetch(URL, {
   method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
   body: JSON.stringify({ action, ...data }),
 })
 const result = await response.json().catch(()=>null)
 if (!response.ok || !result?.ok) throw new Error(result?.error || 'No se pudo consultar la cartera de proyectos.')
 return result as T
}
export async function loadProjects() {
 const result = await projectsRequest<{ok:boolean; projects:Project[]; activities:Activity[]}>('list')
 if (!Array.isArray(result.projects) || !Array.isArray(result.activities)) throw new Error('La respuesta del servidor no contiene la cartera completa.')
 return result
}
export async function updateActivity(id:string, patch:{status:string; progress:number; blocker:string}) {
 return projectsRequest<{ok:boolean}>('activity-update', {id,patch})
}
export async function updateProject(id:string, patch:{status:string; priority:string; blocker:string; nextMilestone:string; milestoneDate:string}) {
 return projectsRequest<{ok:boolean}>('project-update', {id,patch})
}
