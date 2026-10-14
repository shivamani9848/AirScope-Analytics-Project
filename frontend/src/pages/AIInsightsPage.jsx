import React, { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AppShell from '../components/layout/AppShell'
import PageHeader from '../components/layout/PageHeader'
import { Card } from '../components/design-system/Card'
import Badge from '../components/design-system/Badge'
import Button from '../components/design-system/Button'
import { SparklesIcon, CpuIcon, ActivityIcon, XIcon, ChevronDownIcon, ChevronRightIcon, InfoIcon } from '../components/design-system/Icons'
import { agentPlan, agentExecute } from '../api'

// Inline send icon since SendIcon may not exist in Icons.jsx
function SendIcon({ className = 'w-5 h-5', ...props }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
    </svg>
  )
}

const SUGGESTED_PROMPTS = [
  'Compare PM2.5 levels in London vs Delhi',
  "What's the air quality forecast for Paris?",
  'Which cities have exceeded WHO guidelines this week?',
  'Explain the impact of temperature inversions on PM10',
]

function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-start gap-3 px-1"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
        <CpuIcon className="w-4 h-4" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block h-2 w-2 rounded-full bg-emerald-500"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function ToolTrace({ trace }) {
  const [expanded, setExpanded] = useState(false)

  if (!trace || trace.length === 0) return null

  return (
    <div className="mt-2 border-t border-slate-100 pt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors font-medium"
      >
        {expanded ? (
          <ChevronDownIcon className="w-3.5 h-3.5" />
        ) : (
          <ChevronRightIcon className="w-3.5 h-3.5" />
        )}
        <ActivityIcon className="w-3.5 h-3.5 text-emerald-500" />
        {trace.length} tool {trace.length === 1 ? 'step' : 'steps'} executed
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5">
              {trace.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 font-mono text-[11px] text-slate-600"
                >
                  <span className="font-semibold text-emerald-700">
                    [{step.step ?? idx + 1}] {step.tool}
                  </span>
                  {step.result !== undefined && (
                    <div className="mt-1 text-slate-500 break-all">
                      {typeof step.result === 'string'
                        ? step.result.slice(0, 300) + (step.result.length > 300 ? '…' : '')
                        : JSON.stringify(step.result).slice(0, 300)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function UserMessage({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22 }}
      className="flex justify-end gap-3 px-1"
    >
      <div className="max-w-[75%] space-y-1">
        <div className="rounded-2xl rounded-tr-sm bg-emerald-600 px-4 py-3 text-sm text-white shadow-sm">
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        <p className="text-right text-[11px] text-slate-400">{message.timestamp}</p>
      </div>
    </motion.div>
  )
}

function AssistantMessage({ message }) {
  const isSystem = message.role === 'system'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22 }}
      className="flex items-start gap-3 px-1"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
          isSystem
            ? 'bg-rose-50 border-rose-200 text-rose-600'
            : 'bg-emerald-50 border-emerald-200 text-emerald-600'
        }`}
      >
        {isSystem ? (
          <InfoIcon className="w-4 h-4" />
        ) : (
          <SparklesIcon className="w-4 h-4" />
        )}
      </div>
      <div className="max-w-[80%] space-y-1">
        <div
          className={`rounded-2xl rounded-tl-sm border px-4 py-3 text-sm shadow-sm ${
            isSystem
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          {!isSystem && <ToolTrace trace={message.tool_trace} />}
        </div>
        <p className="text-[11px] text-slate-400">{message.timestamp}</p>
      </div>
    </motion.div>
  )
}

function OllamaBanner({ onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5"
    >
      <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <p className="flex-1 text-sm text-amber-800 leading-relaxed">
        <span className="font-semibold">Requires Ollama running locally.</span> This feature connects
        to <code className="rounded bg-amber-100 px-1 font-mono text-xs">http://127.0.0.1:11434</code>{' '}
        using the <code className="rounded bg-amber-100 px-1 font-mono text-xs">gemma3:4b</code> model.
        If AI responses fail, verify your Ollama server is running.
      </p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss banner"
        className="shrink-0 rounded-lg p-1 text-amber-600 hover:bg-amber-100 transition-colors"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

function EmptyState({ onSuggest }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 flex-col items-center justify-center py-10 px-4 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200">
        <SparklesIcon className="h-8 w-8 text-emerald-500" />
      </div>
      <h2 className="mb-1 text-lg font-semibold text-slate-800">Ask anything about environmental data</h2>
      <p className="mb-6 max-w-xs text-sm text-slate-500 leading-relaxed">
        Your AI assistant can analyse trends, compare cities, and forecast pollution levels.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSuggest(prompt)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 shadow-sm transition-all duration-150 hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-800 hover:shadow-card active:scale-[0.98]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AIInsightsPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(true)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  const addMessage = useCallback((role, content, extra = {}) => {
    setMessages((prev) => [
      ...prev,
      { role, content, timestamp: formatTime(new Date()), ...extra },
    ])
  }, [])

  const handleSend = useCallback(
    async (promptOverride) => {
      const prompt = (promptOverride ?? input).trim()
      if (!prompt || loading) return

      setInput('')
      addMessage('user', prompt)
      setLoading(true)

      try {
        // Step 1: Plan
        let plan = []
        let summary = ''
        try {
          const planResult = await agentPlan(prompt)
          plan = planResult?.plan ?? []
          summary = planResult?.summary ?? ''
        } catch (planErr) {
          const msg = planErr?.response?.data?.detail ?? planErr?.message ?? 'Planning step failed.'
          addMessage('system', `⚠️ Planning failed: ${msg}`)
          setLoading(false)
          return
        }

        // Step 2: Execute
        try {
          const execResult = await agentExecute({ prompt, plan })
          const response = execResult?.response ?? summary ?? 'No response returned.'
          const tool_trace = execResult?.tool_trace ?? []
          addMessage('assistant', response, { tool_trace })
        } catch (execErr) {
          const msg = execErr?.response?.data?.detail ?? execErr?.message ?? 'Execution step failed.'
          addMessage('system', `⚠️ Execution failed: ${msg}`)
        }
      } catch (err) {
        const msg = err?.response?.data?.detail ?? err?.message ?? 'An unexpected error occurred.'
        addMessage('system', `⚠️ ${msg}`)
      } finally {
        setLoading(false)
        setTimeout(() => textareaRef.current?.focus(), 50)
      }
    },
    [input, loading, addMessage]
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleSuggest = useCallback(
    (prompt) => {
      handleSend(prompt)
    },
    [handleSend]
  )

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="AI Environmental Insights"
          subtitle="Powered by local LLM (Ollama). Ask about air quality trends, city comparisons, pollution forecasts."
          badge={
            <Badge variant="enterprise" size="md" dot>
              Enterprise
            </Badge>
          }
        />

        {/* Ollama banner */}
        <AnimatePresence>
          {bannerVisible && <OllamaBanner onDismiss={() => setBannerVisible(false)} />}
        </AnimatePresence>

        {/* Chat card */}
        <Card padding="p-0" hover={false} className="flex flex-col overflow-hidden">
          {/* Message list */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto" style={{ maxHeight: '55vh', minHeight: '320px' }}>
            <div className="flex flex-1 flex-col justify-end gap-4 p-5">
              <AnimatePresence initial={false}>
                {messages.length === 0 && !loading ? (
                  <EmptyState key="empty" onSuggest={handleSuggest} />
                ) : (
                  messages.map((msg, idx) =>
                    msg.role === 'user' ? (
                      <UserMessage key={idx} message={msg} />
                    ) : (
                      <AssistantMessage key={idx} message={msg} />
                    )
                  )
                )}
                {loading && <ThinkingIndicator key="thinking" />}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input row */}
          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
            <div className="flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about air quality trends, forecasts, city comparisons…"
                disabled={loading}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  minHeight: '42px',
                  maxHeight: '96px',
                  overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
                }}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                loading={loading}
                variant="primary"
                size="md"
                aria-label="Send message"
                className="shrink-0 px-3.5"
              >
                {!loading && <SendIcon className="w-4 h-4" />}
                <span className="sr-only">Send</span>
              </Button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Press <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-[10px]">Enter</kbd> to send,{' '}
              <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-[10px]">Shift+Enter</kbd> for new line
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
