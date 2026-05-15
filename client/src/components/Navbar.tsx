import { Link, useRouterState } from "@tanstack/react-router"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/api/auth-context"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authApi } from "@/api/auth.api"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { useState } from "react"
import {
  IconLayoutDashboard,
  IconPlus,
  IconLogout,
  IconMenu2,
  IconX,
  IconChartBar,
} from "@tabler/icons-react"

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { to: "/polls/create", label: "New Poll", icon: IconPlus },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      logout()
      queryClient.clear()
      toast.success("Logged out")
      navigate({ to: "/login" })
    },
    onError: () => toast.error("Failed to logout"),
  })

  if (!user) return null

  return (
    <>
      <nav className="sticky top-0 z-50 w-full">
        {/* Backdrop */}
        <div className="absolute inset-0 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md" />

        {/* Red accent line */}
        <div className="absolute right-0 bottom-0 left-0 h-px">
          <div className="h-full bg-gradient-to-r from-transparent via-red-800/40 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="group flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-600 transition-colors group-hover:bg-red-500">
                <IconChartBar size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold tracking-[0.15em] text-white uppercase">
                Pollify
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden items-center gap-1 sm:flex">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                const isActive =
                  currentPath === to || currentPath.startsWith(to + "/")
                return (
                  <Link key={to} to={to}>
                    <motion.div
                      className={`relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-zinc-500 hover:text-zinc-200"
                      }`}
                      whileTap={{ scale: 0.97 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-lg border border-zinc-700/60 bg-zinc-800"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                      <Icon size={14} className="relative z-10 shrink-0" />
                      <span className="relative z-10 font-medium">{label}</span>
                    </motion.div>
                  </Link>
                )
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* User menu — desktop */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen(p => !p)}
                  className="flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-1.5 transition-colors hover:border-zinc-800 hover:bg-zinc-900"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-300 uppercase">
                      {user.name?.[0] ?? "?"}
                    </span>
                  </div>
                  <span className="max-w-[120px] truncate text-sm text-zinc-400">
                    {user.name}
                  </span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      {/* Click-away */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl shadow-black/40"
                      >
                        <div className="border-b border-zinc-900 px-4 py-3">
                          <p className="text-xs tracking-wider text-zinc-600 uppercase">
                            Signed in as
                          </p>
                          <p className="mt-0.5 truncate text-sm font-medium text-white">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {user.email}
                          </p>
                        </div>
                        <div className="p-1.5">
                          <button
                            onClick={() => {
                              setUserMenuOpen(false)
                              logoutMutation.mutate()
                            }}
                            disabled={logoutMutation.isPending}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-red-950/30 hover:text-red-400"
                          >
                            <IconLogout size={14} />
                            {logoutMutation.isPending
                              ? "Logging out…"
                              : "Log out"}
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(p => !p)}
                className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white sm:hidden"
              >
                {mobileOpen ? <IconX size={18} /> : <IconMenu2 size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="relative overflow-hidden border-t border-zinc-900 bg-zinc-950 sm:hidden"
            >
              <div className="space-y-1 px-4 py-3">
                {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                  const isActive = currentPath === to
                  return (
                    <Link key={to} to={to} onClick={() => setMobileOpen(false)}>
                      <div
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          isActive
                            ? "border border-zinc-700/50 bg-zinc-800 text-white"
                            : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
                        }`}
                      >
                        <Icon size={15} />
                        <span className="font-medium">{label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Mobile user section */}
              <div className="border-t border-zinc-900 px-4 py-3">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
                    <span className="text-xs font-bold text-zinc-300 uppercase">
                      {user.name?.[0] ?? "?"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    logoutMutation.mutate()
                  }}
                  disabled={logoutMutation.isPending}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-red-950/30 hover:text-red-400"
                >
                  <IconLogout size={14} />
                  {logoutMutation.isPending ? "Logging out…" : "Log out"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  )
}
