import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ClipboardList, FileSearch, Inbox, ClipboardCheck, ShieldCheck, LayoutDashboard, FolderKanban, LogIn, LogOut, Settings, X, Eye, EyeOff } from 'lucide-react'
import { getApiKey, setApiKey } from '@/lib/config'
import { logout, useSession } from '@/lib/auth'

export function Layout({children}:{children:ReactNode}) {
  const [configOpen,setConfigOpen] = useState(false)
  const {session} = useSession()
  const navigate = useNavigate()
  const links = [
    {to:'/registrar',label:'Solicitar proyecto',icon:ClipboardList},
    {to:'/consultar',label:'Consultar solicitud',icon:FileSearch},
    ...(session ? [{to:'/dashboard',label:'Dashboard ejecutivo',icon:LayoutDashboard},
      {to:'/proyectos',label:'Cartera de proyectos',icon:FolderKanban},
      {to:'/autorizaciones',label:'Autorizaciones',icon:ShieldCheck}] : []),
    ...(session?.user.role === 'admin_bi' ? [{to:'/bandeja',label:'Bandeja BI',icon:Inbox}] : []),
  ]
  return <div className="min-h-screen bg-slate-50 lg:flex">
    <aside className="flex w-full shrink-0 flex-col bg-blue-950 text-blue-50 lg:min-h-screen lg:w-64">
      <div className="flex items-center gap-2 border-b border-blue-900 px-5 py-5">
        <ClipboardCheck className="h-6 w-6 text-blue-300"/>
        <div><p className="text-sm font-semibold">Portal de Proyectos BI</p><p className="text-xs text-blue-300">Inter-Con · Solicitudes y Dirección</p></div>
      </div>
      <nav className="flex flex-wrap gap-1 px-3 py-3 lg:flex-1 lg:flex-col">
        {links.map(({to,label,icon:Icon})=><NavLink key={to} to={to} className={({isActive})=>`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${isActive?'bg-blue-800 text-white':'text-blue-100 hover:bg-blue-900'}`}>
          <Icon className="h-4 w-4"/>{label}
        </NavLink>)}
      </nav>
      <div className="border-t border-blue-900 p-3">
        {session ? <><p className="mb-2 truncate px-2 text-xs text-blue-200">{session.user.name} · {session.user.role === 'admin_bi' ? 'Administrador BI':'Dirección'}</p>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-blue-900" onClick={()=>{void logout();navigate('/login')}}><LogOut className="h-4 w-4"/>Cerrar sesión</button></> :
          <NavLink to="/login" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-blue-900"><LogIn className="h-4 w-4"/>Acceso ejecutivo</NavLink>}
        {session?.user.role === 'admin_bi' ? <button onClick={()=>setConfigOpen(true)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-blue-200 hover:bg-blue-900"><Settings className="h-4 w-4"/>Configuración heredada</button> : null}
      </div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
    </div>
    {configOpen ? <ConfigPanel onClose={()=>setConfigOpen(false)}/> : null}
  </div>
}
function ConfigPanel({onClose}:{onClose:()=>void}) {
 const [value,setValue]=useState(getApiKey())
 const [show,setShow]=useState(false)
 const [saved,setSaved]=useState(false)
 return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
   <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
     <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Configuración heredada</h2><button onClick={onClose} aria-label="Cerrar"><X size={20}/></button></div>
     <label className="block text-sm">API key (pendiente de sustituir por autenticación de servidor)</label>
     <div className="mt-2 flex gap-2"><input className="min-w-0 flex-1 rounded border p-2" type={show?'text':'password'} value={value} onChange={e=>setValue(e.target.value)}/><button type="button" onClick={()=>setShow(!show)} aria-label={show?'Ocultar':'Mostrar'}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
     <p className="mt-2 text-xs text-amber-800">Una clave configurada en el navegador no reemplaza la validación de sesión y rol en n8n.</p>
     <button onClick={()=>{setApiKey(value);setSaved(true)}} className="mt-4 rounded bg-blue-900 px-4 py-2 text-sm text-white">Guardar</button>{saved?<span className="ml-2 text-sm text-emerald-700">Guardado</span>:null}
   </div>
 </div>
}
