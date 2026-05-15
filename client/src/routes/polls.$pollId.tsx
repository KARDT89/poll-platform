import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { pollsApi } from "@/api/polls.api"
import { useAuth } from "@/api/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  IconClock,
  IconLoader2,
  IconLock,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { socket } from "@/lib/socket"
import { IconUser } from "@tabler/icons-react"

export const Route = createFileRoute("/polls/$pollId")({
  component: RespondPollPage,
})

function RespondPollPage() {
  const { pollId } = Route.useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [totalResponses, setTotalResponses] = useState<number | null>(null)
  const [viewers, setViewers] = useState<number>(1)

  useEffect(() => {
    socket.emit("join-poll", pollId)

    socket.on("new-response", data => {
      setTotalResponses(data.totalResponses)
    })

    socket.on("viewers-update", data => {
      setViewers(data.count)
    })

    return () => {
      socket.emit("leave-poll", pollId)
      socket.off("new-response")
      socket.off("viewers-update")
    }
  }, [pollId])

  const { data, isLoading, error } = useQuery({
    queryKey: ["poll", pollId],
    queryFn: () => pollsApi.getById(pollId).then(r => ({ poll: r.data.data })),
  })

  const mutation = useMutation({
    mutationFn: () =>
      pollsApi.respond(pollId, {
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
      }),
    onSuccess: () => {
      setSubmitted(true)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Submission failed.")
    },
  })

  const handleSubmit = () => {
    if (!data?.poll) return
    const mandatoryIds = data.poll.questions
      .filter((q: any) => q.isMandatory)
      .map((q: any) => q.id)

    const unanswered = mandatoryIds.filter((id: string) => !answers[id])
    if (unanswered.length > 0) {
      toast.error("Please answer all mandatory questions.")
      return
    }
    mutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <IconLoader2 className="animate-spin text-zinc-600" size={24} />
      </div>
    )
  }

  if (error || !data?.poll) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
        <div className="text-center">
          <p className="text-sm text-zinc-500">Poll not found.</p>
        </div>
      </div>
    )
  }

  const poll = data.poll
  console.log(poll)
  const isExpired = new Date() > new Date(poll.expiresAt)
  const requiresAuth = !poll.isAnonymous && !user

  // Submitted state
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-900 bg-red-950">
            <IconCheck size={28} className="text-red-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            Response submitted
          </h2>
          <p className="text-sm text-zinc-500">Thanks for your feedback.</p>
          {poll.isPublished && (
            <Button
              onClick={() =>
                navigate({
                  to: "/polls/$pollId/results",
                  params: { pollId: poll.id },
                })
              }
              className="mt-6 bg-zinc-800 text-white hover:bg-zinc-700"
            >
              View results
            </Button>
          )}
        </motion.div>
      </div>
    )
  }

  if (poll.isPublished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
            <IconCheck size={28} className="text-zinc-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">Results are in</h2>
          <p className="mb-6 text-sm text-zinc-500">
            This poll has been closed and results are published.
          </p>
          <Button
            onClick={() =>
              navigate({
                to: "/polls/$pollId/results",
                params: { pollId: pollId },
              })
            }
            className="bg-red-600 text-white hover:bg-red-700"
          >
            View results
          </Button>
        </div>
      </div>
    )
  }

  // Expired state
  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
            <IconAlertTriangle size={28} className="text-zinc-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">Poll expired</h2>
          <p className="text-sm text-zinc-500">
            This poll is no longer accepting responses.
          </p>
        </div>
      </div>
    )
  }

  // Auth required state
  if (requiresAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
            <IconLock size={28} className="text-zinc-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">Login required</h2>
          <p className="mb-6 text-sm text-zinc-500">
            This poll requires authentication.
          </p>
          <Button
            onClick={() => navigate({ to: "/login" })}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Sign in to respond
          </Button>
        </div>
      </div>
    )
  }

  const answeredCount = Object.keys(answers).length
  const totalMandatory = poll.questions.filter((q: any) => q.isMandatory).length
  const progress =
    totalMandatory > 0
      ? poll.questions.filter((q: any) => q.isMandatory && answers[q.id])
          .length / totalMandatory
      : 1

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
            Closes{" "}
            {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
          </div>
          {totalResponses !== null && (
            <div className="flex items-center gap-1.5 text-zinc-500">
              <IconUser size={12} />
              {totalResponses} responses
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-zinc-900">
        <motion.div
          className="h-full bg-red-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Poll header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="mb-4 flex items-center gap-2">
            {poll.isAnonymous ? (
              <Badge className="border-zinc-800 bg-zinc-900 text-[10px] tracking-wider text-zinc-400 uppercase">
                Anonymous
              </Badge>
            ) : (
              <Badge className="flex items-center gap-1 border-zinc-800 bg-zinc-900 text-[10px] tracking-wider text-zinc-400 uppercase">
                <IconLock size={10} />
                Authenticated
              </Badge>
            )}
          </div>
          <h1 className="mb-2 text-2xl font-bold text-white">{poll.title}</h1>
          {poll.description && (
            <p className="text-sm text-zinc-400">{poll.description}</p>
          )}
        </motion.div>

        {/* Questions */}
        <div className="space-y-6">
          {poll.questions
            .sort((a: any, b: any) => a.order - b.order)
            .map((q: any, qi: number) => (
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
                  <div className="flex-1">
                    <p className="font-medium text-white">{q.text}</p>
                    {q.isMandatory ? (
                      <span className="text-xs text-red-500">* Required</span>
                    ) : (
                      <span className="text-xs text-zinc-600">Optional</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {q.options.map((opt: any) => {
                    const selected = answers[q.id] === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setAnswers(prev => ({ ...prev, [q.id]: opt.id }))
                        }
                        className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                          selected
                            ? "border-red-600 bg-red-950/30 text-white"
                            : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            selected
                              ? "border-red-500 bg-red-600"
                              : "border-zinc-700"
                          }`}
                        >
                          {selected && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-sm">{opt.text}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            ))}
        </div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex items-center gap-4"
        >
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="bg-red-600 px-8 text-white hover:bg-red-700"
          >
            {mutation.isPending ? (
              <IconLoader2 className="animate-spin" size={16} />
            ) : (
              "Submit response"
            )}
          </Button>
          <p className="text-xs text-zinc-600">
            {answeredCount} of {poll.questions.length} answered
          </p>
        </motion.div>
      </div>
    </div>
  )
}
