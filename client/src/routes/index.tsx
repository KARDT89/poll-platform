import { createFileRoute, Link } from "@tanstack/react-router"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  IconArrowRight,
  IconBolt,
  IconChartBar,
  IconLink,
  IconLock,
  IconUsers,
  IconClock,
  IconCheck,
  IconArrowUpRight,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react"
import { useAuth } from "@/api/auth-context"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

// Animated number counter
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0
          const duration = 1200
          const step = (timestamp: number) => {
            if (!start) start = timestamp
            const progress = Math.min((timestamp - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

// Simulated live poll widget
function LivePollWidget() {
  const [selected, setSelected] = useState<number | null>(null)
  const [votes, setVotes] = useState([42, 28, 19, 11])

  const handleVote = (i: number) => {
    if (selected !== null) return
    setSelected(i)
    setVotes(prev => prev.map((v, idx) => (idx === i ? v + 1 : v)))
  }

  const total = votes.reduce((a, b) => a + b, 0)
  const options = ["React", "Vue", "Svelte", "Angular"]

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <span className="text-xs tracking-wider text-red-500 uppercase">
          Live poll
        </span>
      </div>
      <h3 className="mb-5 font-semibold text-white">
        What's your favorite frontend framework?
      </h3>
      <div className="space-y-2.5">
        {options.map((opt, i) => {
          const pct = Math.round((votes[i] / total) * 100)
          const isSelected = selected === i
          return (
            <button
              key={opt}
              onClick={() => handleVote(i)}
              disabled={selected !== null}
              className={`relative w-full overflow-hidden rounded-lg border text-left transition-all ${
                isSelected
                  ? "border-red-600 bg-red-950/30"
                  : selected !== null
                    ? "cursor-default border-zinc-800"
                    : "cursor-pointer border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {selected !== null && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`absolute inset-y-0 left-0 ${isSelected ? "bg-red-900/30" : "bg-zinc-800/50"}`}
                />
              )}
              <div className="relative flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-red-500 bg-red-600" : "border-zinc-600"}`}
                  >
                    {isSelected && (
                      <div className="h-1 w-1 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm ${isSelected ? "text-white" : "text-zinc-300"}`}
                  >
                    {opt}
                  </span>
                </div>
                {selected !== null && (
                  <span className="font-mono text-xs text-zinc-500">
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-zinc-600">{total} responses</p>
    </div>
  )
}

// Analytics preview widget
function AnalyticsWidget() {
  const data = [
    { label: "React", votes: 42, pct: 42 },
    { label: "Vue", votes: 28, pct: 28 },
    { label: "Svelte", votes: 19, pct: 19 },
    { label: "Angular", votes: 11, pct: 11 },
  ]

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="mb-0.5 text-xs tracking-wider text-zinc-500 uppercase">
            Live analytics
          </p>
          <p className="font-semibold text-white">Framework poll</p>
        </div>
        <div className="rounded-lg bg-zinc-800 px-2.5 py-1">
          <p className="text-lg font-bold text-white">100</p>
          <p className="text-[10px] text-zinc-500">responses</p>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-zinc-300">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">{item.votes}</span>
                <span className="w-8 text-right font-mono text-xs text-white">
                  {item.pct}%
                </span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <motion.div
                className="h-full rounded-full bg-red-600"
                initial={{ width: 0 }}
                animate={{ width: `${item.pct}%` }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                  delay: i * 0.1 + 0.3,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const features = [
  {
    icon: <IconBolt size={20} />,
    title: "Build in seconds",
    desc: "Create polls with multiple questions, custom options, and expiry times. Share with a single link.",
  },
  {
    icon: <IconChartBar size={20} />,
    title: "Live analytics",
    desc: "Watch responses roll in real-time. Charts update instantly as votes come in via WebSockets.",
  },
  {
    icon: <IconUsers size={20} />,
    title: "Anonymous or authenticated",
    desc: "Choose open voting for broad reach or require login for verified, accountable responses.",
  },
  {
    icon: <IconLink size={20} />,
    title: "Shareable links",
    desc: "Every poll gets a public URL. No installs, no accounts needed for respondents.",
  },
  {
    icon: <IconClock size={20} />,
    title: "Auto-expiry",
    desc: "Set an expiry date and polls close automatically. No manual management needed.",
  },
  {
    icon: <IconLock size={20} />,
    title: "Publish results",
    desc: "When ready, publish final results publicly. The same link shows outcomes to everyone.",
  },
]

const faqs = [
  {
    q: "Do respondents need an account?",
    a: "For anonymous polls, no — anyone with the link can respond. For authenticated polls, respondents need to be logged in.",
  },
  {
    q: "How does live analytics work?",
    a: "We use WebSockets (Socket.io) to push updates to your analytics dashboard the moment a response is submitted. No refreshing needed.",
  },
  {
    q: "Can I edit a poll after creating it?",
    a: "Polls cannot be edited after creation to ensure data integrity. You can always create a new poll.",
  },
  {
    q: "What happens when a poll expires?",
    a: "Expired polls stop accepting responses automatically. You can still view analytics and publish results at any time.",
  },
]
function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const { user, logout } = useAuth()

  return (
    <div className="overflow-x-hidden bg-zinc-950 text-white">
      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-900/80 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <p className="text-xs font-semibold tracking-[0.3em] text-red-500 uppercase">
            Pollify
          </p>
          <div className="flex items-center gap-3">
            <Link to="/explore">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-zinc-400 hover:text-white"
              >
                Explore
              </Button>
            </Link>

            {user ? (
              <>
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Dashboard
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={logout}
                  className="text-xs text-zinc-400 hover:text-red-400"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-red-600 text-xs text-white hover:bg-red-700"
                  >
                    Get started <IconArrowRight size={12} />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center justify-center overflow-hidden pt-14"
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Red glow */}
        <div className="pointer-events-none absolute top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/5 blur-[120px]" />

        {/* Corner accents */}
        <div className="absolute top-20 left-12 h-16 w-px bg-red-600/40" />
        <div className="absolute top-20 left-12 h-px w-16 bg-red-600/40" />
        <div className="absolute right-12 bottom-20 h-16 w-px bg-zinc-700/60" />
        <div className="absolute right-12 bottom-20 h-px w-16 bg-zinc-700/60" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 mx-auto max-w-4xl px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-8 inline-flex items-center gap-2 border-red-900/60 bg-red-950/60 text-[10px] tracking-[0.2em] text-red-400 uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              Real-time polling platform
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-6 text-6xl leading-[1.05] font-bold tracking-tight lg:text-7xl"
          >
            Collect feedback.
            <br />
            <span className="text-zinc-500">Ship what matters.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-zinc-400"
          >
            Create polls in seconds, share via link, and watch live analytics
            update in real-time as responses come in.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <Link to="/register">
              <Button className="gap-2 bg-red-600 px-8 py-5 text-sm text-white hover:bg-red-700">
                Start for free <IconArrowRight size={15} />
              </Button>
            </Link>
            <Link to="/explore">
              <Button
                variant="outline"
                className="border-zinc-800 px-8 py-5 text-sm text-zinc-400 hover:border-zinc-600 hover:text-white"
              >
                Explore
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating widgets */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="absolute top-1/2 left-6 hidden -translate-y-1/2 xl:block"
        >
          <LivePollWidget />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute top-1/2 right-6 hidden -translate-y-1/2 xl:block"
        >
          <AnalyticsWidget />
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
        >
          <div className="h-12 w-px bg-gradient-to-b from-transparent to-zinc-700" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-900 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: 10000, suffix: "+", label: "Polls created" },
              { value: 500000, suffix: "+", label: "Responses collected" },
              { value: 99, suffix: "%", label: "Uptime" },
            ].map(stat => (
              <div key={stat.label}>
                <p className="mb-1 text-4xl font-bold text-white">
                  <Counter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive demo section */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="mb-4 text-xs tracking-[0.3em] text-red-500 uppercase">
                Try it now
              </p>
              <h2 className="mb-5 text-4xl leading-tight font-bold">
                Vote and see results
                <br />
                <span className="text-zinc-500">in real time.</span>
              </h2>
              <p className="mb-6 leading-relaxed text-zinc-400">
                Click an option below. Watch the bars animate instantly — that's
                exactly what your respondents experience.
              </p>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <IconCheck size={14} className="text-red-500" />
                No login required for anonymous polls
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                <IconCheck size={14} className="text-red-500" />
                Results update live for creators
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                <IconCheck size={14} className="text-red-500" />
                Publish final results publicly
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex justify-center"
            >
              <LivePollWidget />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="border-t border-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="mb-4 text-xs tracking-[0.3em] text-red-500 uppercase">
              Everything you need
            </p>
            <h2 className="text-4xl font-bold">Built for speed and clarity.</h2>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-700"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-red-900/40 bg-red-950/60 text-red-500 transition-colors group-hover:bg-red-900/40">
                  {f.icon}
                </div>
                <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-500">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="mb-4 text-xs tracking-[0.3em] text-red-500 uppercase">
              How it works
            </p>
            <h2 className="text-4xl font-bold">Three steps to insight.</h2>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create",
                desc: "Build your poll with multiple questions, set an expiry, and toggle anonymous mode.",
              },
              {
                step: "02",
                title: "Share",
                desc: "Copy the public link and send it anywhere — email, Slack, social, or embed it.",
              },
              {
                step: "03",
                title: "Analyze",
                desc: "Watch your analytics dashboard update live. Publish results when ready.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                {i < 2 && (
                  <div className="absolute top-5 right-0 z-10 hidden h-px w-1/2 translate-x-1/2 border-t border-dashed border-zinc-800 md:block" />
                )}
                <div className="relative">
                  <p className="mb-4 text-5xl font-bold text-zinc-800">
                    {item.step}
                  </p>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-500">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <p className="mb-4 text-xs tracking-[0.3em] text-red-500 uppercase">
              FAQ
            </p>
            <h2 className="text-4xl font-bold">Common questions.</h2>
          </motion.div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-xl border border-zinc-800"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-zinc-900"
                >
                  <span className="text-sm font-medium text-white">
                    {faq.q}
                  </span>
                  {openFaq === i ? (
                    <IconMinus
                      size={16}
                      className="ml-4 shrink-0 text-zinc-500"
                    />
                  ) : (
                    <IconPlus
                      size={16}
                      className="ml-4 shrink-0 text-zinc-500"
                    />
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-400">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mx-auto mb-8 h-px w-16 bg-red-600" />
            <h2 className="mb-6 text-5xl leading-tight font-bold">
              Ready to collect
              <br />
              <span className="text-zinc-500">real feedback?</span>
            </h2>
            <p className="mb-10 text-zinc-400">
              Create your first poll in under a minute. No credit card required.
            </p>
            <Link to="/register">
              <Button className="gap-2 bg-red-600 px-10 py-5 text-base text-white hover:bg-red-700">
                Get started free <IconArrowUpRight size={16} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="text-xs tracking-[0.3em] text-red-500 uppercase">
            Pollify
          </p>
          <p className="text-xs text-zinc-600">Built for the hackathon.</p>
        </div>
      </footer>
    </div>
  )
}
