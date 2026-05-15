import { createContext, useContext, useEffect, useState } from "react"
import { authApi } from "../api/auth.api"
import { IconLoader } from "@tabler/icons-react"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      setLoading(false)
      return
    }
    // token exists, re-hydrate user
    authApi
      .getMe()
      .then(({ data }) => setUser(data.data.user))
      .catch(() => localStorage.removeItem("accessToken"))
      .finally(() => setLoading(false))
  }, [])

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <IconLoader className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password })
    localStorage.setItem("accessToken", data.data.accessToken)

    setUser(data.data.user)
  }

  const logout = async () => {
    await authApi.logout()
    localStorage.removeItem("accessToken")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}
