import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useTripStore from '../store/tripStore'
import ItineraryTab from './ItineraryTab'
import FlightCard   from './FlightCard'
import HotelCard, { PlacesHotelCard } from './HotelCard'
import BudgetTab    from './BudgetTab'
import TransportTab from './TransportTab'

const TABS = ['Itinerary', 'Flights', 'Hotels', 'Transport', 'Budget']

export default function RightPanel() {
  const navigate = useNavigate()
  const { tripData, selectedFlightIds, selectedGroundTransportIds, totalCost } = useTripStore()
  const [active, setActive] = useState('Itinerary')

  const cities = tripData?.cities ?? []

  // Group flights[] by leg (from → to), preserving sequential backend order
  const flightLegs = (() => {
    const map = new Map()
    for (const f of (tripData?.flights ?? [])) {
      const key = f.from && f.to ? `${f.from} → ${f.to}` : 'Unknown leg'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(f)
    }
    return [...map.entries()]
  })()

  // Can confirm when at least one transport (flight or ground) is selected
  const canConfirm = (
    Object.keys(selectedFlightIds ?? {}).length > 0 ||
    Object.keys(selectedGroundTransportIds ?? {}).length > 0
  )
  const totalDisplay = totalCost > 0 ? totalCost.toLocaleString() : '—'

  return (
    <div className="flex flex-col h-full bg-plan-bg-base">

      {/* Tab bar */}
      <div className="flex border-b border-plan-border-subtle shrink-0 overflow-x-auto plan-scroll whitespace-nowrap px-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-4 py-3 text-[11px] font-semibold transition-all border-b-2 ${
              active === t
                ? 'border-plan-primary text-plan-primary'
                : 'border-transparent text-plan-text-secondary hover:text-plan-text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto plan-scroll px-3 py-4 min-h-0">
        {active === 'Itinerary' && <ItineraryTab />}

        {active === 'Flights' && (
          <div className="space-y-5">
            {flightLegs.length ? (
              flightLegs.map(([legKey, legFlights]) => (
                <div key={legKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-plan-text-secondary uppercase tracking-wider whitespace-nowrap">
                      ✈ {legKey}
                    </span>
                    <div className="h-px flex-1 bg-plan-border-subtle" />
                  </div>
                  {legFlights.map((f, i) => (
                    <FlightCard key={f.flight_number ?? f.offer_id ?? i} flight={f} legKey={legKey} index={i} />
                  ))}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-plan-surface-2 flex items-center justify-center mb-4 border border-plan-border-subtle shadow-inner">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-plan-primary" strokeWidth="1.5">
                    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-plan-text-primary">No flights available</p>
                <p className="text-[11px] text-plan-text-secondary mt-1">
                  {tripData ? 'No flight results were returned for this route.' : 'Plan a trip to see flight options.'}
                </p>
              </div>
            )}
          </div>
        )}

        {active === 'Hotels' && (
          <div className="space-y-5">
            {cities.length ? (
              cities.map((city, ci) => (
                <div key={ci}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-plan-text-secondary uppercase tracking-wider whitespace-nowrap">
                      {city.name}{city.country ? `, ${city.country}` : ''}
                    </span>
                    <div className="h-px flex-1 bg-plan-border-subtle" />
                  </div>
                  <p className="text-[10px] font-bold text-plan-success uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7"/></svg>
                    AI Recommended
                  </p>
                  {city.hotel ? (
                    <HotelCard hotel={city.hotel} cityName={city.name} index={ci} />
                  ) : (
                    <p className="text-[11px] text-plan-text-muted">No hotel found for {city.name}.</p>
                  )}

                  {city.places_hotels?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] font-bold text-plan-success/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                        Verified Hotels Nearby
                      </p>
                      {city.places_hotels.map((h, hi) => (
                        <PlacesHotelCard key={h.name ?? hi} hotel={h} cityKey={city.name} index={hi} />
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-plan-surface-2 flex items-center justify-center mb-4 border border-plan-border-subtle shadow-inner">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-plan-primary" strokeWidth="1.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-plan-text-primary">No hotels available</p>
                <p className="text-[11px] text-plan-text-secondary mt-1">
                  {tripData ? 'No hotel results were returned.' : 'Plan a trip to see hotel options.'}
                </p>
              </div>
            )}
          </div>
        )}

        {active === 'Transport' && <TransportTab />}
        {active === 'Budget' && <BudgetTab />}
      </div>

      {/* Confirm button — pinned to bottom */}
      <div className="px-3 pb-4 pt-3 border-t border-plan-border-subtle bg-plan-surface-1 shrink-0 z-10 shadow-[0_-8px_15px_rgba(0,0,0,0.2)]">
        <button
          disabled={!canConfirm}
          onClick={() => navigate('/confirm')}
          className={`w-full py-3 rounded-xl text-xs font-semibold transition-all shadow-md ${
            canConfirm
              ? 'bg-gradient-to-r from-plan-primary to-plan-primary-hover text-plan-bg-base hover:shadow-lg hover:-translate-y-[1px]'
              : 'bg-plan-surface-2 border border-plan-border-subtle text-plan-text-muted cursor-not-allowed shadow-none'
          }`}
        >
          {canConfirm
            ? `Confirm trip · $${totalDisplay}`
            : 'Select a flight to continue'}
        </button>
      </div>

    </div>
  )
}
