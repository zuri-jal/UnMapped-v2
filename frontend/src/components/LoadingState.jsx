import React, { useState, useEffect } from 'react'

const STEPS = [
  'Understanding your request…',
  'Finding flights…',
  'Checking hotel availability…',
  'Crafting your itinerary…',
  'Almost ready…',
]

export default function LoadingState() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1500)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="fixed inset-0 bg-[#0A0A0F]/95 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      {/* Spinner */}
      <div className="relative w-14 h-14 mb-6">
        <div className="absolute inset-0 border-2 border-[#1E1B25] rounded-full" />
        <div className="absolute inset-0 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-base font-semibold text-[#F0ECE8]">Planning your trip</p>
      <p className="text-sm text-[#8A7A72] mt-1 animate-pulse">{STEPS[step]}</p>
    </div>
  )
}
