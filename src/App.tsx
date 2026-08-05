import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { BandejaBI } from '@/routes/BandejaBI'
import { RegistrarSolicitud } from '@/routes/RegistrarSolicitud'
import { ConsultarSolicitud } from '@/routes/ConsultarSolicitud'
import { EvaluacionBI } from '@/routes/EvaluacionBI'
import { CentroAutorizaciones } from '@/routes/CentroAutorizaciones'

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/bandeja" replace />} />
          <Route path="/bandeja" element={<BandejaBI />} />
          <Route path="/registrar" element={<RegistrarSolicitud />} />
          <Route path="/consultar" element={<ConsultarSolicitud />} />
          <Route path="/evaluacion/:folio" element={<EvaluacionBI />} />
          <Route path="/autorizaciones" element={<CentroAutorizaciones />} />
          <Route path="*" element={<Navigate to="/bandeja" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
