import React from 'react'
import useTripStore from '../store/tripStore'

export default function FlightCard({ flight, index }) {
  const { selectFlight, selectedFlightId } = useTripStore()
  // Prefer flight_number; fall back to index string so selection still works
  const id = flight.flight_number || `flight-${index}`
  const isSelected = selectedFlightId === id

  const stopCount = flight.stops ?? 0
  const stops = stopCount === 0 ? 'Nonstop' : `${stopCount} stop${stopCount > 1 ? 's' : ''}`

  const fmt = (dt) => {
    if (!dt) return '—'
    try { return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    catch { return dt }
  }

  return (
    <div
      onClick={() => selectFlight(id)}
      role="button"
      aria-pressed={isSelected}
      className={`card-dark cursor-pointer transition-all mb-2 ${
        isSelected ? 'border-rose-gold ring-1 ring-rose-gold/50' : 'hover:border-rose-gold/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#F0ECE8] truncate">{flight.airline}</p>
          <p className="text-[10px] text-[#8A7A72] mt-0.5">{flight.flight_number} · {stops}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-rose-gold">${Number(flight.price_usd ?? 0).toLocaleString()}</p>
          {isSelected && <p className="text-[9px] text-rose-gold font-medium">Selected ✓</p>}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2.5 text-[10px] text-[#8A7A72]">
        <div>
          <p className="text-xs font-medium text-[#F0ECE8]">{fmt(flight.departure_time)}</p>
          <p className="text-[9px]">Departure</p>
        </div>
        <div className="flex-1 mx-2 text-center">
          <div className="flex items-center">
            <div className="flex-1 h-px bg-[#1E1B25]" />
            <span className="mx-1 text-[#8A7A72]">✈</span>
            <div className="flex-1 h-px bg-[#1E1B25]" />
          </div>
          <p className="text-[9px] mt-0.5 text-[#8A7A72]">{flight.duration ?? '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-[#F0ECE8]">{fmt(flight.arrival_time)}</p>
          <p className="text-[9px]">Arrival</p>
        </div>
      </div>
    </div>
  )
}
