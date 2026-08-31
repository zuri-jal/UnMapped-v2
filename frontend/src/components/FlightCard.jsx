import React from 'react'
import useTripStore from '../store/tripStore'

const AirlineLogo = ({ name }) => {
  const initials = name?.substring(0, 2).toUpperCase() || '✈'
  return (
    <div className="w-8 h-8 rounded-full bg-plan-surface-2 border border-plan-border-subtle flex items-center justify-center text-plan-primary text-[10px] font-bold shrink-0 shadow-sm">
      {initials}
    </div>
  )
}

export default function FlightCard({ flight, legKey, index }) {
  const { selectFlight, selectedFlightIds, selectedGroundTransportIds } = useTripStore()

  const id = flight.flight_number || flight.offer_id || `flight-${index}`
  // legKey is provided by the parent group; derive a fallback from the flight itself
  const effectiveLegKey = legKey ?? (flight.from && flight.to ? `${flight.from} → ${flight.to}` : 'default')
  const isSelected = selectedFlightIds[effectiveLegKey] === id
  const groundChosen = !!selectedGroundTransportIds?.[effectiveLegKey]

  const stopCount = flight.stops ?? 0
  const stops = stopCount === 0 ? 'Nonstop' : `${stopCount} stop${stopCount > 1 ? 's' : ''}`

  const fmt = (dt) => {
    if (!dt) return '—'
    try { return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    catch { return dt }
  }

  return (
    <div
      onClick={() => selectFlight(effectiveLegKey, id)}
      role="button"
      aria-pressed={isSelected}
      className={`card-dark cursor-pointer transition-all duration-200 mb-3 ${
        isSelected ? 'border-plan-primary ring-1 ring-plan-primary/50 bg-plan-surface-3 shadow-md' : 'hover:border-plan-primary/50 hover-lift'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <AirlineLogo name={flight.airline} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-plan-text-primary truncate">{flight.airline}</p>
            <p className="text-[10px] text-plan-text-secondary mt-0.5 truncate">{flight.flight_number} · {stops}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-plan-primary">${Number(flight.price_usd ?? 0).toLocaleString()}</p>
          {isSelected && <p className="text-[9px] text-plan-primary font-bold tracking-wide">SELECTED ✓</p>}
          {groundChosen && !isSelected && (
            <p className="text-[9px] text-plan-text-muted">Transport chosen</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-[10px] text-plan-text-secondary">
        <div>
          <p className="text-xs font-bold text-plan-text-primary">{fmt(flight.departure_time)}</p>
          <p className="text-[9px] text-plan-text-muted uppercase tracking-wider">Departure</p>
        </div>
        <div className="flex-1 mx-4 text-center min-w-0">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[10px] font-bold text-plan-text-secondary truncate">{flight.from || '---'}</span>
            <div className="flex items-center flex-1 min-w-[20px] max-w-[60px]">
              <div className="flex-1 h-[1px] bg-plan-border-subtle" />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-plan-primary mx-1 shrink-0" strokeWidth="2">
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
              <div className="flex-1 h-[1px] bg-plan-border-subtle" />
            </div>
            <span className="text-[10px] font-bold text-plan-text-secondary truncate">{flight.to || '---'}</span>
          </div>
          <p className="text-[9px] mt-1 text-plan-text-muted truncate">{flight.duration ?? '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-plan-text-primary">{fmt(flight.arrival_time)}</p>
          <p className="text-[9px] text-plan-text-muted uppercase tracking-wider">Arrival</p>
        </div>
      </div>

      {flight.aviation_stack_data && (
        <div className="mt-3 pt-2.5 border-t border-plan-border-subtle">
          <p className="text-[9px] text-plan-success font-bold uppercase tracking-wider flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
            Verified by Aviation Stack
          </p>
          <p className="text-[9px] text-plan-text-secondary mt-1">
            {[
              flight.aviation_stack_data.airline_name,
              flight.aviation_stack_data.aircraft_type,
              flight.aviation_stack_data.status,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}
