import React from 'react'
import useTripStore from '../store/tripStore'

const STEPS = [
  'Understanding your request…',
  'Searching flights…',
  'Checking hotel availability…',
  'Crafting your itinerary…',
  'Almost ready…',
]

// Full-screen loading overlay shown while the AI is generating a trip plan
export default function LoadingState() {
  const { setLoading } = useTripStore()

  // TODO: Drive step animation from actual API progress events (SSE or polling)
  // TODO: Cycle through STEPS with a 1.5s interval using useEffect + setInterval
  // TODO: Add destination imagery in the background while loading (blur overlay)
  // TODO: Add a cancel button that aborts the in-flight fetch request via AbortController

  return (
    <div className="fixed inset-0 bg-warm-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      {/* Spinner */}
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 border-4 border-warm-gray rounded-full" />
        <div className="absolute inset-0 border-4 border-rose-gold border-t-transparent rounded-full animate-spin" />
      </div>

      <p className="text-lg font-semibold text-gray-800">Planning your trip</p>
      <p className="text-sm text-gray-500 mt-1">Searching flights, hotels, and crafting your itinerary…</p>

      {/* Step indicators */}
      <div className="mt-8 space-y-2">
        {STEPS.map((step, index) => (
          <div
            key={step}
            className="flex items-center gap-2 text-sm text-gray-400"
            style={{ animationDelay: `${index * 0.3}s` }}
          >
            {/* TODO: Replace with a checkmark icon when that step completes */}
            <div className="w-1.5 h-1.5 rounded-full bg-rose-gold/40" />
            {step}
          </div>
        ))}
      </div>
    </div>
  )
}
