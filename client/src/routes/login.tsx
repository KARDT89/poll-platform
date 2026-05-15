import {
  createFileRoute,
  Link,
  useNavigate,
  redirect,
} from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { z } from "zod"
// import { authApi } from '@/api/auth.api'
import { useAuth } from "@/api/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconArrowRight, IconLoader2 } from "@tabler/icons-react"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
})

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const mutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: () => {
      toast.success("Welcome back.")
      navigate({ to: "/dashboard" })
    },
    onError: () => toast.error("Invalid credentials."),
  })

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value)
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message)
        return
      }
      mutation.mutate(value)
    },
  })

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Left panel */}
      <div className="relative hidden w-1/2 items-end overflow-hidden bg-zinc-900 p-16 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(220,38,38,0.15),transparent_60%)]" />
        <div className="absolute top-16 left-16 h-32 w-px bg-red-600" />
        <div className="absolute top-16 left-16 h-px w-32 bg-red-600" />
        <div className="absolute right-16 bottom-16 h-32 w-px bg-zinc-700" />
        <div className="absolute right-16 bottom-16 h-px w-32 bg-zinc-700" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="mb-4 text-xs tracking-[0.3em] text-red-500 uppercase">
            Pollify
          </p>
          <h1 className="mb-6 text-5xl leading-tight font-bold text-white">
            Collect feedback.
            <br />
            <span className="text-zinc-500">Ship faster.</span>
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
            Real-time polls with live analytics. Share a link, watch responses
            roll in.
          </p>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <div className="mb-10">
            <p className="mb-2 text-xs tracking-[0.3em] text-red-500 uppercase lg:hidden">
              Pollify
            </p>
            <h2 className="text-2xl font-bold text-white">Sign in</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Enter your credentials to continue
            </p>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="space-y-5"
          >
            <form.Field name="email">
              {field => (
                <div className="space-y-1.5">
                  <Label className="text-xs tracking-wider text-zinc-400 uppercase">
                    Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    className="border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus-visible:border-red-600 focus-visible:ring-red-600"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {field => (
                <div className="space-y-1.5">
                  <Label className="text-xs tracking-wider text-zinc-400 uppercase">
                    Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    className="border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 focus-visible:border-red-600 focus-visible:ring-red-600"
                  />
                </div>
              )}
            </form.Field>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-red-600 font-medium tracking-wide text-white hover:bg-red-700"
            >
              {mutation.isPending ? (
                <IconLoader2 className="animate-spin" size={16} />
              ) : (
                <>
                  Sign in <IconArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-600">
            No account?{" "}
            <Link
              to="/register"
              className="text-red-500 transition-colors hover:text-red-400"
            >
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
