import React from 'react'
import useTripStore from '../store/tripStore'

// Card for a single flight offer — airline, route, price, and select action
export default function FlightCard({ flight }) {
  const { selectFlight, selectedFlightId } = useTripStore()
  const isSelected = selectedFlightId === flight.offer_id

  // TODO: Add airline logo via logo lookup by IATA carrier code (e.g. Clearbit Logos API)
  // TODO: Add expandable section showing full fare conditions and baggage policy
  // TODO: Add "Best Value" / "Fastest" / "Nonstop" badge based on comparison logic

  return (
    <div
      className={`card cursor-pointer transition-all ${
        isSelected
          ? 'border-rose-gold ring-1 ring-rose-gold'
          : 'hover:border-rose-gold/40'
      }`}
      onClick={() => selectFlight(flight.offer_id)}
      role="button"
      aria-pressed={isSelected}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{flight.airline}</p>
          <p className="text-sm text-gray-500">
            {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-rose-gold">
            {flight.currency} {flight.price.toLocaleString()}
          </p>
          {isSelected && (
            <span className="text-xs text-rose-gold font-medium">Selected ✓</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
        <div className="text-left">
          <p className="font-medium">{flight.departure_time}</p>
          <p className="text-xs text-gray-400">{flight.origin}</p>
        </div>
        <div className="flex flex-col items-center text-gray-400 text-xs">
          <span>──── {flight.duration} ────</span>
        </div>
        <div className="text-right">
          <p className="font-medium">{flight.arrival_time}</p>
          <p className="text-xs text-gray-400">{flight.destination}</p>
        </div>
      </div>
    </div>
  )
}
