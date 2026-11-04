import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ConfigError } from '@/components/ConfigError'
import { getMissingEnvVars } from '@/lib/config'
import { BandejaBI } from '@/routes/BandejaBI'
import { RegistrarSolicitud } from '@/routes/RegistrarSolicitud'
import { ConsultarSolicitud } from '@/routes/ConsultarSolicitud'
import { EvaluacionBI } from '@/routes/EvaluacionBI'
import { CentroAutorizaciones } from '@/routes/CentroAutorizaciones'
import { Login } from '@/routes/Login'
import { DashboardEjecutivo } from '@/routes/DashboardEjecutivo'
import { PrivateRoute } from '@/components/PrivateRoute'

export default function App() {
  const missingEnvVars = getMissingEnvVars()
  if (missingEnvVars.length > 0) return <ConfigError missing={missingEnvVars} />
  return <HashRouter><Layout><Routes>
    <Route path="/" element={<Navigate to="/registrar" replace />} />
    <Route path="/registrar" element={<RegistrarSolicitud />} />
    <Route path="/consultar" element={<ConsultarSolicitud />} />
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={<PrivateRoute><DashboardEjecutivo /></PrivateRoute>} />
    <Route path="/bandeja" element={<PrivateRoute admin><BandejaBI /></PrivateRoute>} />
    <Route path="/evaluacion/:folio" element={<PrivateRoute admin><EvaluacionBI /></PrivateRoute>} />
    <Route path="/autorizaciones" element={<PrivateRoute><CentroAutorizaciones /></PrivateRoute>} />
    <Route path="*" element={<Navigate to="/registrar" replace />} />
  </Routes></Layout></HashRouter>
}
