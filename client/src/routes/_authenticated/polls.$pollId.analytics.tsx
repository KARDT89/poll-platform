import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { pollsApi } from "@/api/polls.api"
import { Button } from "@/components/ui/button"
import {
  IconArrowLeft,
  IconLoader2,
  IconAlertTriangle,
  IconLock,
  IconWifi,
  IconClock,
  IconCheck,
  IconShare,
  IconUsers,
} from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { toast } from "sonner"
import { analyticsApi } from "@/api/analytics.api"

export const Route = createFileRoute("/_authenticated/polls/$pollId/analytics")(
  {
    component: AnalyticsPage,
  }
)

function ResponseRing({ count }: { count: number }) {
  const goal = Math.max(count, 10)
  const pct = Math.min(count / goal, 1)
  const r = 52
  const circ = 2 * Math.PI * r

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg
        width="128"
        height="128"
        viewBox="0 0 128 128"
        className="-rotate-90"
      >
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="#18181b"
          strokeWidth="7"
        />
        <motion.circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="#dc2626"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - pct * circ }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl leading-none font-bold text-white">
          {count}
        </span>
        <span className="mt-1 text-[10px] tracking-widest text-zinc-500 uppercase">
          responses
        </span>
      </div>
    </div>
  )
}

function OptionBar({
  text,
  votes,
  pct,
  isTop,
  delay,
}: {
  text: string
  votes: number
  pct: number
  isTop: boolean
  delay: number
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          {isTop && votes > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: delay + 0.5,
                type: "spring",
                stiffness: 300,
              }}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-600"
            >
              <IconCheck size={9} className="text-white" />
            </motion.div>
          )}
          <span
            className={`text-sm ${isTop && votes > 0 ? "font-medium text-white" : "text-zinc-400"}`}
          >
            {text}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600 tabular-nums">
            {votes} votes
          </span>
          <span
            className={`w-10 text-right font-mono text-sm font-bold ${isTop && votes > 0 ? "text-red-400" : "text-zinc-600"}`}
          >
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="relative h-7 overflow-hidden rounded-lg border border-zinc-800/50 bg-zinc-900">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-lg ${isTop && votes > 0 ? "bg-linear-to-r from-red-700 to-red-500" : "bg-zinc-800"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
        />
        {[25, 50, 75].map(mark => (
          <div
            key={mark}
            className="absolute top-0 bottom-0 w-px bg-zinc-800/50"
            style={{ left: `${mark}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function QuestionCard({
  question,
  index,
  countMap,
}: {
  question: any
  index: number
  countMap: Record<string, number>
}) {
  const questionTotal = question.options.reduce(
    (sum: number, opt: any) => sum + (countMap[opt.id] ?? 0),
    0
  )
  const maxVotes = Math.max(
    ...question.options.map((o: any) => countMap[o.id] ?? 0),
    0
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.08 }}
      className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950"
    >
      <div className="h-px bg-linear-to-r from-transparent via-red-800/50 to-transparent" />
      <div className="p-6">
        <div className="mb-6 flex items-start gap-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
            <span className="font-mono text-xs text-zinc-500">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="leading-snug font-semibold text-white">
              {question.text}
            </p>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="text-xs text-zinc-600">
                {questionTotal} response{questionTotal !== 1 ? "s" : ""}
              </span>
              {question.isMandatory ? (
                <span className="text-[10px] tracking-wider text-red-500/60 uppercase">
                  required
                </span>
              ) : (
                <span className="text-[10px] tracking-wider text-zinc-700 uppercase">
                  optional
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {question.options.map((opt: any, oi: number) => {
            const votes = countMap[opt.id] ?? 0
            const pct = questionTotal > 0 ? (votes / questionTotal) * 100 : 0
            return (
              <OptionBar
                key={opt.id}
                text={opt.text}
                votes={votes}
                pct={pct}
                isTop={votes === maxVotes}
                delay={0.3 + index * 0.08 + oi * 0.06}
              />
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function AnalyticsPage() {
  const { pollId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const socketRef = useRef<Socket | null>(null)
  const [newResponseFlash, setNewResponseFlash] = useState(false)

  const { data: pollData, isLoading: pollLoading } = useQuery({
    queryKey: ["poll", pollId],
    queryFn: () => pollsApi.getById(pollId).then(r => r.data.data),
  })

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics", pollId],
    queryFn: () => analyticsApi.get(pollId).then(r => r.data.data),
    // Fallback polling every 30s in case socket misses something
    refetchInterval: 30_000,
  })

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL ?? "http://localhost:3000", {
      withCredentials: true,
    })
    socketRef.current = socket
    socket.emit("join-poll", pollId)

    socket.on("new-response", () => {
      // Always refetch from server — never trust socket payload for counts
      queryClient.invalidateQueries({ queryKey: ["analytics", pollId] })
      setNewResponseFlash(true)
      setTimeout(() => setNewResponseFlash(false), 2500)
    })

    return () => {
      socket.emit("leave-poll", pollId)
      socket.disconnect()
    }
  }, [pollId, queryClient])

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/polls/${pollId}`)
    toast.success("Poll link copied")
  }

  if (pollLoading || analyticsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <IconLoader2 className="animate-spin text-zinc-600" size={24} />
          <p className="text-[10px] tracking-widest text-zinc-700 uppercase">
            Loading analytics
          </p>
        </div>
      </div>
    )
  }

  if (!pollData || !analyticsData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
            <IconAlertTriangle size={28} className="text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-500">Failed to load analytics.</p>
          <Button
            onClick={() => navigate({ to: "/dashboard" })}
            className="mt-4 bg-zinc-800 text-white hover:bg-zinc-700"
          >
            Back to dashboard
          </Button>
        </div>
      </div>
    )
  }

  const poll = pollData
  const { totalResponses, optionCounts } = analyticsData

  // Handle both camelCase (optionId) and snake_case (option_id) — Drizzle can return either
  const countMap: Record<string, number> = {}
  for (const row of optionCounts) {
    const id: string | undefined = row.optionId ?? row.option_id
    if (id) countMap[id] = Number(row.count)
  }

  const total = Number(totalResponses?.total ?? 0)
  const isExpired = new Date() > new Date(poll.expiresAt)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl space-y-10 px-6 py-10">
        {/* Top row: back + share */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white"
          >
            <IconArrowLeft size={15} />
            Dashboard
          </button>
          <div className="flex items-center gap-3">
            {!isExpired && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="flex items-center gap-1.5 text-[10px] tracking-widest text-green-500 uppercase"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Live
              </motion.div>
            )}
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-white"
            >
              <IconShare size={14} />
              <span className="text-xs">Share</span>
            </button>
          </div>
        </motion.div>

        {/* Poll header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {!poll.isAnonymous && (
              <span className="flex items-center gap-1 rounded-full border border-zinc-800 px-2.5 py-0.5 text-[10px] tracking-wider text-zinc-500 uppercase">
                <IconLock size={9} /> Authenticated
              </span>
            )}
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] tracking-wider uppercase ${
                isExpired
                  ? "border-zinc-800 text-zinc-600"
                  : "border-green-900/60 bg-green-950/30 text-green-600"
              }`}
            >
              {isExpired ? "Closed" : "Accepting responses"}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{poll.title}</h1>
          {poll.description && (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
              {poll.description}
            </p>
          )}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-600">
            <IconClock size={11} />
            {isExpired ? "Closed" : "Closes"}{" "}
            {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
          </div>
        </motion.div>

        {/* Hero stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950"
        >
          <div className="h-px bg-linear-to-r from-transparent via-red-800/50 to-transparent" />
          <div className="flex flex-col items-center gap-8 p-8 sm:flex-row">
            <ResponseRing count={total} />
            <div className="grid w-full flex-1 grid-cols-2 gap-3">
              {[
                { label: "Questions", value: poll.questions?.length ?? 0 },
                {
                  label: "Status",
                  value: isExpired ? "Closed" : "Live",
                  color: isExpired ? "text-zinc-500" : "text-green-500",
                },
                {
                  label: "Type",
                  value: poll.isAnonymous ? "Anonymous" : "Authenticated",
                },
                {
                  label: "Results",
                  value: poll.isPublished ? "Published" : "Private",
                  color: poll.isPublished ? "text-green-500" : "text-zinc-500",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
                >
                  <p className="mb-1.5 text-[10px] tracking-wider text-zinc-600 uppercase">
                    {label}
                  </p>
                  <p
                    className={`text-sm font-semibold ${color ?? "text-white"}`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <AnimatePresence>
            {newResponseFlash && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 border-t border-green-900/40 bg-green-950/20 px-6 py-2.5"
              >
                <IconWifi size={13} className="text-green-500" />
                <span className="text-xs text-green-500">
                  New response just came in
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Breakdown */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-5 flex items-center gap-3"
          >
            <span className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
              Breakdown
            </span>
            <div className="h-px flex-1 bg-zinc-900" />
            <span className="text-xs text-zinc-700">
              {poll.questions?.length} questions
            </span>
          </motion.div>
          <div className="space-y-5">
            {poll.questions
              ?.sort((a: any, b: any) => a.order - b.order)
              .map((q: any, qi: number) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={qi}
                  countMap={countMap}
                />
              ))}
          </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between border-t border-zinc-900 pt-4"
        >
          <p className="text-[10px] tracking-[0.3em] text-zinc-800 uppercase">
            Pollify
          </p>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs text-zinc-600 transition-colors hover:text-white"
          >
            <IconUsers size={12} />
            Copy poll link
          </button>
        </motion.div>
      </div>
    </div>
  )
}
