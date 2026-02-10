import React from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { userStore } from '@/store/modules/userStore'

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const userToken = userStore((state) => state.userToken)

  if (!userToken) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
