import { Navigate, useLocation } from 'react-router-dom'
import { LoadingState } from './States'
import { useSession } from '@/lib/auth'
import type { ReactNode } from 'react'

export function PrivateRoute({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { session, checking } = useSession()
  const loc = useLocation()
  if (checking) return <LoadingState label="Validando sesión con el servidor…" />
  if (!session) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if (admin && session.user.role !== 'admin_bi') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
