import React, { useRef, useEffect, useState } from 'react'
import useTripStore from '../store/tripStore'
import { planTrip } from '../services/api'

const STYLE_CHIPS = ['Adventure', 'Food', 'Luxury', 'Hidden gems', 'Culture', 'Relaxation']
const PROMPTS = [
  '7 days in Japan under $2500',
  'Beach holiday in Southeast Asia',
  'European city break this autumn',
  'Hidden gems in South America',
]
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
  } = useTripStore()

  const [input, setInput]            = useState('')
  const [activeStyles, setStyles]    = useState([])
  const [loadingText, setLoadingTxt] = useState(LOADING_MSGS[0])
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (!isLoading) return
    let i = 0
    const iv = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length
      setLoadingTxt(LOADING_MSGS[i])
    }, 1500)
    return () => clearInterval(iv)
  }, [isLoading])

  const toggleStyle = (s) =>
    setStyles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg) return
    setInput('')
    addMessage('user', msg)
    setLoading(true)

    const travelStyle = activeStyles.length ? activeStyles.join(', ') : 'adventure'
    const { data, error } = await planTrip({
      user_message: msg,
      destination: tripData?.days?.[0]?.location ?? null,
      origin: null,
      departure_date: nextDeparture(),
      duration_days: tripData?.days?.length ?? 7,
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
    <div className="flex flex-col h-full bg-[#0A0A0F]">

      {/* Header */}
      <div className="px-4 py-4 border-b border-[#1E1B25] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#F0ECE8]">AI travel assistant</span>
          <span className="w-2 h-2 rounded-full bg-[#5DCAA5] shrink-0" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-[#8A7A72] mt-8 px-2">
            <div className="text-3xl mb-3">🗺️</div>
            <p className="text-xs font-medium text-[#F0ECE8]">Where to next?</p>
            <p className="text-xs mt-1 leading-relaxed">
              Describe your dream trip and I'll handle flights, hotels and every detail.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] text-xs leading-relaxed rounded-2xl px-3 py-2 ${
                m.role === 'user'
                  ? 'bg-rose-gold/90 text-white rounded-br-sm'
                  : 'bg-[#0F0D12] border border-[#1E1B25] text-[#F0ECE8] rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#0F0D12] border border-[#1E1B25] rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-[#8A7A72] animate-pulse">
              {loadingText}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Travel style chips */}
      <div className="px-3 py-2 border-t border-[#1E1B25] shrink-0">
        <p className="text-[10px] text-[#8A7A72] mb-1.5">Travel style</p>
        <div className="flex flex-wrap gap-1">
          {STYLE_CHIPS.map((s) => (
            <button
              key={s}
              onClick={() => toggleStyle(s)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                activeStyles.includes(s)
                  ? 'bg-rose-gold border-rose-gold text-white'
                  : 'border-[#1E1B25] text-[#8A7A72] hover:border-rose-gold/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested prompts — only before any messages */}
      {messages.length === 0 && !isLoading && (
        <div className="px-3 pb-2 shrink-0">
          <p className="text-[10px] text-[#8A7A72] mb-1.5">Try asking</p>
          <div className="space-y-1">
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="w-full text-left text-[10px] px-2.5 py-1.5 rounded-lg bg-[#0F0D12] border border-[#1E1B25] text-[#8A7A72] hover:border-rose-gold/50 hover:text-[#F0ECE8] transition-colors truncate"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-[#1E1B25] shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={tripData ? 'Ask me to change anything…' : 'Where do you want to go?'}
            className="flex-1 input-dark text-xs py-2 resize-none leading-relaxed"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-8 h-8 flex items-center justify-center bg-rose-gold rounded-lg disabled:opacity-40 hover:bg-rose-gold-dark transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  )
}
