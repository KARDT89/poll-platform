import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { pollsApi } from "@/api/polls.api"
import { Button } from "@/components/ui/button"
import {
  IconLoader2,
  IconLock,
  IconWorld,
  IconUsers,
  IconArrowLeft,
  IconClock,
} from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { socket } from "@/lib/socket"
import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

export const Route = createFileRoute("/_authenticated/polls/$pollId/results")({
  component: ResultsPage,
})

function ResultsPage() {
  const { pollId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [viewers, setViewers] = useState(1)

  useEffect(() => {
    socket.emit("join-poll", pollId)

    socket.on("connect", () => {
      // re-join room if socket reconnects mid-session
      socket.emit("join-poll", pollId)
    })

    socket.on("new-response", () => {
      queryClient.invalidateQueries({ queryKey: ["poll-results", pollId] })
    })

    socket.on("viewers-update", data => {
      setViewers(data.count)
    })

    return () => {
      socket.emit("leave-poll", pollId)
      socket.off("connect")
      socket.off("new-response")
      socket.off("viewers-update")
    }
  }, [pollId])

  const { data, isLoading, error } = useQuery({
    queryKey: ["poll-results", pollId],
    queryFn: () => pollsApi.getResults(pollId).then(r => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <IconLoader2 className="animate-spin text-zinc-600" size={24} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="text-center">
          <p className="text-sm text-zinc-500">Results not available yet.</p>
          <Button
            variant="ghost"
            className="mt-4 text-zinc-500"
            onClick={() => navigate({ to: "/dashboard" })}
          >
            Back to dashboard
          </Button>
        </div>
      </div>
    )
  }

  const { poll, results } = data
  const totalResponses = poll._count?.responses ?? 0

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-zinc-900 px-6 py-4">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            <span>{viewers} viewing</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <IconClock size={12} />
            Closed{" "}
            {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Full progress bar (closed) */}
      <div className="h-0.5 bg-red-600" />

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/dashboard" })}
            className="mb-6 -ml-2 gap-1.5 text-zinc-600 hover:text-white"
          >
            <IconArrowLeft size={14} />
            Dashboard
          </Button>

          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] tracking-wider text-zinc-600 uppercase">
              {poll.isAnonymous ? (
                <>
                  <IconWorld size={9} /> Anonymous
                </>
              ) : (
                <>
                  <IconLock size={9} /> Authenticated
                </>
              )}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] tracking-wider text-zinc-600 uppercase">
              Results published
            </span>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-white">{poll.title}</h1>
          {poll.description && (
            <p className="mb-4 text-sm text-zinc-400">{poll.description}</p>
          )}

          <div className="flex items-center gap-1.5 text-sm text-zinc-500">
            <IconUsers size={14} />
            <span>
              {totalResponses} total response{totalResponses !== 1 ? "s" : ""}
            </span>
          </div>
        </motion.div>

        {/* Results per question */}
        <div className="space-y-6">
          {results.map((q: any, qi: number) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qi * 0.08 }}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="mb-5 flex items-start gap-3">
                <span className="mt-0.5 font-mono text-xs text-zinc-600">
                  0{qi + 1}
                </span>
                <p className="flex-1 font-medium text-white">{q.text}</p>
              </div>

              <div className="space-y-3">
                {q.options
                  .sort((a: any, b: any) => b.count - a.count)
                  .map((opt: any) => {
                    const pct =
                      totalResponses > 0
                        ? Math.round((opt.count / totalResponses) * 100)
                        : 0
                    const isTop =
                      opt.count ===
                        Math.max(...q.options.map((o: any) => o.count)) &&
                      opt.count > 0

                    return (
                      <div key={opt.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span
                            className={
                              isTop ? "font-medium text-white" : "text-zinc-400"
                            }
                          >
                            {opt.text}
                          </span>
                          <span
                            className={`text-xs tabular-nums ${isTop ? "text-red-400" : "text-zinc-600"}`}
                          >
                            {pct}% · {opt.count}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                          <motion.div
                            className={`h-full rounded-full ${isTop ? "bg-red-600" : "bg-zinc-700"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{
                              duration: 0.6,
                              delay: qi * 0.08 + 0.2,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
