import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UserStoreType {
  userToken: string | null
  setUserToken: (token: string) => void
  removeUserToken: () => void
}

export const userStore = create<UserStoreType>()(
  persist((set) => ({
      userToken: null as string | null,
      setUserToken: (token: string) => set({ userToken: token }),
      removeUserToken: () => set({ userToken: null }),
    }),{
      name: 'user-token',
    }
  )
)