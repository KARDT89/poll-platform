import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { motion } from "framer-motion"
import { pollsApi } from "@/api/polls.api"
import { Button } from "@/components/ui/button"
import {
  IconLoader2,
  IconClock,
  IconUsers,
  IconLock,
  IconWorld,
  IconFlame,
  IconChartBar,
  IconArrowLeft,
  IconArrowRight,
} from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { socket } from "@/lib/socket"
import { useEffect } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
})

function ExplorePage() {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<"newest" | "popular">("newest")
  const queryClient = useQueryClient()

  useEffect(() => {
    socket.connect()

    socket.emit("join-feed")

    socket.on("connect", () => {
      socket.emit("join-feed")
    })

    socket.on("feed-activity", data => {
      toast(`New response on "${data.pollTitle}"`, {
        description: `${data.totalResponses} total responses`,
        duration: 3000,
      })
      queryClient.invalidateQueries({ queryKey: ["feed"] })
    })

    return () => {
      socket.emit("leave-feed")
      socket.off("connect")
      socket.off("feed-activity")
      socket.disconnect()
    }
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ["feed", page, sort],
    queryFn: () => pollsApi.getFeed(page, sort).then(r => r.data.data),
  })

  const polls = data?.polls ?? []
  const pagination = data?.pagination

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <p className="text-[10px] tracking-[0.3em] text-zinc-600 uppercase">
            Discover
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Explore Polls
          </h1>
          <p className="text-sm text-zinc-500">
            Browse and respond to polls from the community.
          </p>
        </motion.div>

        {/* Sort toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="flex items-center gap-2"
        >
          <button
            onClick={() => {
              setSort("newest")
              setPage(1)
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              sort === "newest"
                ? "border-zinc-700 bg-zinc-800 text-white"
                : "border-zinc-800 text-zinc-500 hover:text-white"
            }`}
          >
            <IconFlame size={11} className="mr-1.5 inline" />
            Newest
          </button>
          <button
            onClick={() => {
              setSort("popular")
              setPage(1)
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              sort === "popular"
                ? "border-zinc-700 bg-zinc-800 text-white"
                : "border-zinc-800 text-zinc-500 hover:text-white"
            }`}
          >
            <IconChartBar size={11} className="mr-1.5 inline" />
            Most popular
          </button>
        </motion.div>

        {/* Feed */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <IconLoader2 className="animate-spin text-zinc-600" size={22} />
          </div>
        ) : polls.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
            <p className="text-sm text-zinc-500">No polls available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {polls.map((poll: any, i: number) => {
              const isExpired = new Date() > new Date(poll.expiresAt)
              const responses = poll._count?.responses ?? 0

              return (
                <motion.div
                  key={poll.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950 transition-colors hover:border-zinc-700"
                >
                  <div className="h-px bg-linear-to-r from-transparent via-zinc-800/60 to-transparent transition-all group-hover:via-red-900/30" />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          {poll.isAnonymous ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] tracking-wider text-zinc-600 uppercase">
                              <IconWorld size={9} /> Anonymous
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] tracking-wider text-zinc-600 uppercase">
                              <IconLock size={9} /> Login required
                            </span>
                          )}
                          {isExpired && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] tracking-wider text-zinc-600 uppercase">
                              Closed
                            </span>
                          )}
                        </div>

                        <h3 className="truncate text-base leading-snug font-semibold text-white">
                          {poll.title}
                        </h3>
                        {poll.description && (
                          <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500">
                            {poll.description}
                          </p>
                        )}
                      </div>

                      <div className="hidden shrink-0 text-right sm:block">
                        <div className="mb-1 flex items-center justify-end gap-1 text-xs text-zinc-500">
                          <IconUsers size={11} />
                          <span>
                            {responses} response{responses !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-1 text-xs text-zinc-700">
                          <IconClock size={11} />
                          <span>
                            {isExpired
                              ? "Closed"
                              : formatDistanceToNow(new Date(poll.expiresAt), {
                                  addSuffix: true,
                                })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t border-zinc-900 pt-4">
                      <Link to="/polls/$pollId" params={{ pollId: poll.id }}>
                        <Button
                          size="sm"
                          className="h-8 gap-1.5 rounded-lg bg-red-600 px-3 text-xs text-white hover:bg-red-500"
                        >
                          {poll.isPublished
                            ? "View results"
                            : isExpired
                              ? "View"
                              : "Respond"}
                        </Button>
                      </Link>
                      {poll.isPublished && (
                        <Link
                          to="/polls/$pollId/results"
                          params={{ pollId: poll.id }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg px-3 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-white"
                          >
                            <IconChartBar size={13} />
                            Results
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between pt-4"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="gap-1.5 text-zinc-500 hover:text-white"
            >
              <IconArrowLeft size={14} />
              Previous
            </Button>
            <span className="text-xs text-zinc-600">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page === pagination.totalPages}
              className="gap-1.5 text-zinc-500 hover:text-white"
            >
              Next
              <IconArrowRight size={14} />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
