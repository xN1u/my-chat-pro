import React from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { userStore } from '@/store/modules/userStore'

interface PublicRouteProps {
  children: ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const userToken = userStore((state) => state.userToken)

  if (userToken) {
    return <Navigate to="/chat" replace />
  }

  return <>{children}</>
}
