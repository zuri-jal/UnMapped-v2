import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useTripStore from '../store/tripStore'
import InputForm from './InputForm'

// Left panel — conversation history between user and the AI planner
export default function ChatPanel() {
  const { messages, isLoading, trip, setIsConfirming } = useTripStore()
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  // Auto-scroll to the latest message whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // TODO: Add typing indicator animation while isLoading is true
  // TODO: Add message timestamps in a collapsible tooltip on hover
  // TODO: Wire up Confirm Trip button — show only when trip has flights + hotels selected

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-warm-gray">
        <div>
          <h2 className="text-xl font-semibold text-rose-gold">Unmapped</h2>
          <p className="text-xs text-gray-400 mt-0.5">AI Travel Planner</p>
        </div>
        <button
          className="text-xs text-gray-400 hover:text-rose-gold transition-colors"
          onClick={() => navigate('/profile')}
        >
          My Trips
        </button>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-16 px-4">
            <p className="text-2xl mb-3">🗺️</p>
            <p className="font-medium text-gray-600">Where to next?</p>
            <p className="text-sm mt-1 leading-relaxed">
              Tell me your dream destination, budget, and travel style — I'll handle the rest.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-rose-gold text-white rounded-br-sm'
                    : 'bg-white border border-warm-gray text-gray-800 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-warm-gray rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-rose-gold rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Confirm Trip CTA — shown when a trip exists */}
      {trip && (
        <div className="px-4 py-2 border-t border-warm-gray">
          <button
            className="btn-primary w-full text-sm py-2.5"
            onClick={() => setIsConfirming(true)}
          >
            Confirm & Book Trip
          </button>
        </div>
      )}

      {/* Input form */}
      <InputForm />
    </div>
  )
}
