import React, { useRef, useEffect, useState } from 'react'
import useTripStore from '../store/tripStore'
import { planTrip } from '../services/api'

const LOADING_MSGS = [
  'Finding flights...',
  'Checking what travelers are saying...',
  'Generating your itinerary...',
]

function nextDeparture() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

export default function ChatPanel() {
  const {
    messages, addMessage,
    tripData, setTripData,
    isLoading, setLoading,
    pendingPlanConfirm, setPendingPlanConfirm,
  } = useTripStore()

  const [input, setInput]                   = useState('')
  const [loadingText, setLoadingTxt]        = useState(LOADING_MSGS[0])
  const [pendingConfirm, setPendingConfirm] = useState(null)
  const [departDate, setDepartDate]         = useState('')
  const [durationDays, setDurationDays]     = useState(7)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!pendingPlanConfirm) return
    const { message, departDate: d, durationDays: n, travelStyle: s } = pendingPlanConfirm
    setPendingPlanConfirm(null)
    setDepartDate(d)
    setDurationDays(n)
    setPendingConfirm({ message, travelStyle: s })
  }, [pendingPlanConfirm])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, pendingConfirm])

  useEffect(() => {
    if (!isLoading) return
    let i = 0
    const iv = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length
      setLoadingTxt(LOADING_MSGS[i])
    }, 1500)
    return () => clearInterval(iv)
  }, [isLoading])

  const sendMessage = () => {
    const msg = input.trim()
    if (!msg || pendingConfirm) return
    setInput('')
    addMessage('user', msg)
    // Infer duration from message ("10 day trip" → 10), clamp 1–30, default 7
    const m = msg.match(/\b(\d+)\s*-?\s*days?\b/i)
    setDurationDays(m ? Math.max(1, Math.min(30, parseInt(m[1]))) : 7)
    setDepartDate(nextDeparture())
    setPendingConfirm({ message: msg, travelStyle: 'adventure' })
  }

  const confirmAndPlan = async () => {
    if (!pendingConfirm) return
    const { message, travelStyle } = pendingConfirm
    setPendingConfirm(null)
    setLoading(true)

    const { data, error } = await planTrip({
      user_message: message,
      destination: tripData?.days?.[0]?.location ?? null,
      origin: null,
      departure_date: departDate,
      duration_days: durationDays,
      budget_usd: Number(tripData?.budget_breakdown?.total ?? 2000),
      travel_style: travelStyle,
      travelers: 1,
    })

    if (error) {
      addMessage('assistant', 'Sorry, something went wrong. Please try again.')
    } else if (data) {
      setTripData(data)
      addMessage('assistant', data.summary ?? "Here's your updated trip!")
    }
    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-plan-surface-1 to-plan-bg-base">

      {/* Header */}
      <div className="px-4 py-4 border-b border-plan-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Unmapped Logo" className="w-6 h-6 object-contain" />
          <span className="text-sm font-semibold text-plan-text-primary">AI travel assistant</span>
          <span className="w-2 h-2 rounded-full bg-plan-success shrink-0 shadow-[0_0_8px_#4ECDC4]" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto plan-scroll px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-plan-text-secondary mt-8 px-2">
            <div className="text-3xl mb-3">🗺️</div>
            <p className="text-xs font-medium text-plan-text-primary">Where to next?</p>
            <p className="text-xs mt-1 leading-relaxed text-plan-text-muted">
              Describe your dream trip and I'll handle flights, hotels and every detail.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] text-xs leading-relaxed rounded-2xl px-3 py-2.5 shadow-sm ${
                m.role === 'user'
                  ? 'bg-[#1A1020] border-l-2 border-plan-primary text-plan-text-primary rounded-br-sm'
                  : 'glass-card text-plan-text-primary rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {pendingConfirm && !isLoading && (
          <div className="flex justify-start w-full my-2">
            <div className="bg-plan-surface-2 border border-plan-border-subtle shadow-lg shadow-black/50 rounded-2xl rounded-bl-sm w-full max-w-[95%] overflow-hidden">
              <div className="bg-gradient-to-r from-plan-primary to-plan-primary-hover px-3 py-2">
                <span className="text-[10px] font-semibold text-plan-bg-base uppercase tracking-wider">Trip Details</span>
              </div>
              <div className="p-3">
                <p className="text-[10px] text-plan-text-secondary mb-3">When do you want to go?</p>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-[9px] text-plan-text-muted mb-1 uppercase tracking-wide">Start date</label>
                    <input
                      type="date"
                      value={departDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDepartDate(e.target.value)}
                      className="input-dark !py-2 !px-3 text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-plan-text-muted mb-1 uppercase tracking-wide">Duration (days)</label>
                    <input
                      type="number"
                      value={durationDays}
                      min={1}
                      max={30}
                      onChange={(e) => setDurationDays(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                      className="input-dark !py-2 !px-3 text-xs w-full"
                    />
                  </div>
                </div>
                <button
                  onClick={confirmAndPlan}
                  className="w-full bg-plan-primary text-plan-bg-base text-[11px] font-semibold py-2.5 rounded-xl hover:bg-plan-primary-hover hover-lift transition-all"
                >
                  Looks good, plan my trip &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="glass-card rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-plan-text-secondary animate-pulse">
              {loadingText}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-5 pt-4 bg-plan-surface-2 border-t border-plan-border-accent shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.2)] relative z-10">
        <div className="flex gap-3 items-end">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={tripData ? 'Ask me to change anything…' : 'Where do you want to go?'}
            className="flex-1 input-dark bg-plan-surface-1 text-sm py-3 px-4 resize-none leading-relaxed shadow-inner"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading || !!pendingConfirm}
            className="shrink-0 w-12 h-12 flex items-center justify-center bg-plan-primary rounded-xl disabled:opacity-40 hover:bg-plan-primary-hover transition-colors shadow-md"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" className="text-plan-bg-base" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  )
}
