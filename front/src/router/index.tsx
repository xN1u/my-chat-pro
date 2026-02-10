import { createBrowserRouter } from "react-router-dom"

import { LoginPage } from '@/pages/LoginPage'
import { LayoutPage } from "@/pages/LayoutPage"
import { ChatPage } from "@/pages/ChatPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { NotChatPage } from "@/pages/NotChatPage"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { PublicRoute } from "@/components/PublicRoute"

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    )
  },
  {
    path: "/chat",
    element: (
      <ProtectedRoute>
        <LayoutPage />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <NotChatPage />
      },
      {
        path: ":id",
        element: <ChatPage />
      }
    ]
  },
  {
    path: "*",
    element: <NotFoundPage />
  }
])