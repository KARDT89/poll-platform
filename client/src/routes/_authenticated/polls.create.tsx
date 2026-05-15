import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useState } from "react"
import { pollsApi } from "@/api/polls.api"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconLoader2,
  IconCheck,
} from "@tabler/icons-react"

export const Route = createFileRoute("/_authenticated/polls/create")({
  component: CreatePollPage,
})

interface QuestionDraft {
  id: string
  text: string
  isMandatory: boolean
  options: string[]
}

const newQuestion = (): QuestionDraft => ({
  id: crypto.randomUUID(),
  text: "",
  isMandatory: true,
  options: ["", ""],
})

// ── Shared input class ────────────────────────────────────────
const inputCls =
  "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-colors"

function CreatePollPage() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()])

  const mutation = useMutation({
    mutationFn: pollsApi.create,
    onSuccess: () => {
      toast.success("Poll created")
      navigate({ to: "/dashboard" })
    },
    onError: () => toast.error("Failed to create poll"),
  })

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      isAnonymous: false,
      expiresAt: "",
    },
    onSubmit: async ({ value }) => {
      if (!value.title.trim()) return toast.error("Poll title is required")
      if (!value.expiresAt) return toast.error("Expiry date is required")

      for (const q of questions) {
        if (!q.text.trim()) return toast.error("All questions must have text")
        if (q.options.filter(o => o.trim()).length < 2)
          return toast.error("Each question needs at least 2 options")
      }

      mutation.mutate({
        title: value.title,
        description: value.description || undefined,
        isAnonymous: value.isAnonymous,
        expiresAt: new Date(value.expiresAt).toISOString(),
        questions: questions.map(q => ({
          text: q.text,
          isMandatory: q.isMandatory,
          options: q.options.filter(o => o.trim()),
        })),
      })
    },
  })

  const addQuestion = () => setQuestions(p => [...p, newQuestion()])
  const removeQuestion = (id: string) => {
    if (questions.length === 1)
      return toast.error("At least one question required")
    setQuestions(p => p.filter(q => q.id !== id))
  }
  const updateQuestion = (id: string, updates: Partial<QuestionDraft>) =>
    setQuestions(p => p.map(q => (q.id === id ? { ...q, ...updates } : q)))
  const addOption = (qId: string) =>
    setQuestions(p =>
      p.map(q => (q.id === qId ? { ...q, options: [...q.options, ""] } : q))
    )
  const removeOption = (qId: string, idx: number) =>
    setQuestions(p =>
      p.map(q =>
        q.id === qId
          ? { ...q, options: q.options.filter((_, i) => i !== idx) }
          : q
      )
    )
  const updateOption = (qId: string, idx: number, val: string) =>
    setQuestions(p =>
      p.map(q =>
        q.id === qId
          ? { ...q, options: q.options.map((o, i) => (i === idx ? val : o)) }
          : q
      )
    )

  const minDate = new Date(Date.now() + 60_000).toISOString().slice(0, 16)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Link
            to="/dashboard"
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-zinc-600 transition-colors hover:text-white"
          >
            <IconArrowLeft size={14} />
            Dashboard
          </Link>
          <p className="mb-1 text-[10px] tracking-[0.3em] text-zinc-600 uppercase">
            New
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create Poll
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Configure your poll and add questions.
          </p>
        </motion.div>

        <form
          onSubmit={e => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-6"
        >
          {/* ── Poll details card ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950"
          >
            <div className="h-px bg-linear-to-r from-transparent via-red-800/40 to-transparent" />
            <div className="space-y-5 p-6">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
                  Poll details
                </span>
              </div>

              {/* Title */}
              <form.Field name="title">
                {field => (
                  <div className="space-y-1.5">
                    <label className="text-xs tracking-wider text-zinc-500 uppercase">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="What's your poll about?"
                      value={field.state.value}
                      onChange={e => field.handleChange(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}
              </form.Field>

              {/* Description */}
              <form.Field name="description">
                {field => (
                  <div className="space-y-1.5">
                    <label className="text-xs tracking-wider text-zinc-500 uppercase">
                      Description{" "}
                      <span className="text-zinc-700">optional</span>
                    </label>
                    <textarea
                      placeholder="Give respondents some context…"
                      value={field.state.value}
                      onChange={e => field.handleChange(e.target.value)}
                      rows={2}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                )}
              </form.Field>

              {/* Expires at */}
              <form.Field name="expiresAt">
                {field => (
                  <div className="space-y-1.5">
                    <label className="text-xs tracking-wider text-zinc-500 uppercase">
                      Closes at <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      min={minDate}
                      value={field.state.value}
                      onChange={e => field.handleChange(e.target.value)}
                      className={`${inputCls} [color-scheme:dark]`}
                    />
                  </div>
                )}
              </form.Field>

              {/* Anonymous toggle */}
              <form.Field name="isAnonymous">
                {field => (
                  <button
                    type="button"
                    onClick={() => field.handleChange(!field.state.value)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                      field.state.value
                        ? "border-red-900/50 bg-red-950/20 text-white"
                        : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium">Anonymous responses</p>
                      <p className="mt-0.5 text-xs text-zinc-600">
                        Respondents don't need to log in
                      </p>
                    </div>
                    <div
                      className={`flex h-5 w-9 items-center rounded-full border px-0.5 transition-colors ${
                        field.state.value
                          ? "justify-end border-red-500 bg-red-600"
                          : "justify-start border-zinc-700 bg-zinc-800"
                      }`}
                    >
                      <div className="h-3.5 w-3.5 rounded-full bg-white shadow" />
                    </div>
                  </button>
                )}
              </form.Field>
            </div>
          </motion.div>

          {/* ── Questions ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
                Questions
              </span>
              <div className="h-px flex-1 bg-zinc-900" />
              <span className="text-xs text-zinc-700">{questions.length}</span>
            </div>

            <AnimatePresence initial={false}>
              {questions.map((q, qi) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.98,
                    transition: { duration: 0.15 },
                  }}
                  transition={{ delay: qi * 0.04 }}
                  className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950"
                >
                  <div className="h-px bg-linear-to-r from-transparent via-zinc-800/60 to-transparent" />
                  <div className="space-y-4 p-5">
                    {/* Question header */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                        <span className="font-mono text-[10px] text-zinc-500">
                          {String(qi + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="flex-1 text-xs tracking-wider text-zinc-600 uppercase">
                        Question
                      </span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="rounded-lg p-1.5 text-zinc-700 transition-colors hover:bg-red-950/20 hover:text-red-400"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>

                    {/* Question text */}
                    <input
                      type="text"
                      placeholder="Ask something…"
                      value={q.text}
                      onChange={e =>
                        updateQuestion(q.id, { text: e.target.value })
                      }
                      className={inputCls}
                    />

                    {/* Mandatory toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        updateQuestion(q.id, { isMandatory: !q.isMandatory })
                      }
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        q.isMandatory
                          ? "border-red-900/50 bg-red-950/20 text-red-400"
                          : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700"
                      }`}
                    >
                      <div
                        className={`flex h-3 w-3 items-center justify-center rounded border transition-colors ${
                          q.isMandatory
                            ? "border-red-500 bg-red-600"
                            : "border-zinc-600"
                        }`}
                      >
                        {q.isMandatory && (
                          <IconCheck size={8} className="text-white" />
                        )}
                      </div>
                      Required
                    </button>

                    {/* Options */}
                    <div className="space-y-2 pt-1">
                      <p className="text-[10px] tracking-wider text-zinc-700 uppercase">
                        Options
                      </p>
                      <AnimatePresence initial={false}>
                        {q.options.map((opt, oi) => (
                          <motion.div
                            key={oi}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            className="flex items-center gap-2"
                          >
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-800">
                              <span className="font-mono text-[9px] text-zinc-700">
                                {String.fromCharCode(65 + oi)}
                              </span>
                            </div>
                            <input
                              type="text"
                              placeholder={`Option ${oi + 1}`}
                              value={opt}
                              onChange={e =>
                                updateOption(q.id, oi, e.target.value)
                              }
                              className={inputCls}
                            />
                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(q.id, oi)}
                                className="shrink-0 rounded-lg p-1.5 text-zinc-700 transition-colors hover:bg-red-950/20 hover:text-red-400"
                              >
                                <IconTrash size={13} />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <button
                        type="button"
                        onClick={() => addOption(q.id)}
                        className="mt-1 flex items-center gap-2 px-1 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
                      >
                        <IconPlus size={12} />
                        Add option
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add question */}
            <button
              type="button"
              onClick={addQuestion}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-800 py-4 text-sm text-zinc-600 transition-colors hover:border-zinc-700 hover:text-zinc-300"
            >
              <IconPlus size={15} />
              Add question
            </button>
          </div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between pt-2"
          >
            <Link to="/dashboard">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl text-zinc-600 hover:bg-zinc-900 hover:text-white"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="gap-2 rounded-xl bg-red-600 px-8 text-white hover:bg-red-500"
            >
              {mutation.isPending ? (
                <>
                  <IconLoader2 size={15} className="animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <IconCheck size={15} />
                  Create poll
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  )
}
