import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useTripStore from '../store/tripStore'
import ItineraryTab from './ItineraryTab'
import FlightCard   from './FlightCard'
import HotelCard    from './HotelCard'
import BudgetTab    from './BudgetTab'
import TransportTab from './TransportTab'

const TABS = ['Itinerary', 'Flights', 'Hotels', 'Ground Transport', 'Budget']

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
    <div className="flex flex-col h-full bg-[#0A0A0F]">

      {/* Tab bar */}
      <div className="flex border-b border-[#1E1B25] shrink-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`flex-1 py-2.5 text-[10px] font-medium transition-colors border-b-2 ${
              active === t
                ? 'border-rose-gold text-rose-gold'
                : 'border-transparent text-[#8A7A72] hover:text-[#F0ECE8]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {active === 'Itinerary' && <ItineraryTab />}

        {active === 'Flights' && (
          <div className="space-y-5">
            {flightLegs.length ? (
              flightLegs.map(([legKey, legFlights]) => (
                <div key={legKey}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-semibold text-[#8A7A72] uppercase tracking-wider whitespace-nowrap">
                      ✈ {legKey}
                    </span>
                    <div className="h-px flex-1 bg-[#1E1B25]" />
                  </div>
                  {legFlights.map((f, i) => (
                    <FlightCard key={f.flight_number ?? f.offer_id ?? i} flight={f} legKey={legKey} index={i} />
                  ))}
                </div>
              ))
            ) : (
              <div className="text-center text-[#8A7A72] py-10">
                <div className="text-3xl mb-2">✈</div>
                <p className="text-xs font-medium text-[#F0ECE8]">No flights available</p>
                <p className="text-[10px] mt-1">
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-semibold text-[#8A7A72] uppercase tracking-wider whitespace-nowrap">
                      {city.name}{city.country ? `, ${city.country}` : ''}
                    </span>
                    <div className="h-px flex-1 bg-[#1E1B25]" />
                  </div>
                  {city.hotel ? (
                    <HotelCard hotel={city.hotel} cityName={city.name} index={ci} />
                  ) : (
                    <p className="text-[10px] text-[#8A7A72]">No hotel found for {city.name}.</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-[#8A7A72] py-10">
                <div className="text-3xl mb-2">🏨</div>
                <p className="text-xs font-medium text-[#F0ECE8]">No hotels available</p>
                <p className="text-[10px] mt-1">
                  {tripData ? 'No hotel results were returned.' : 'Plan a trip to see hotel options.'}
                </p>
              </div>
            )}
          </div>
        )}

        {active === 'Ground Transport' && <TransportTab />}
        {active === 'Budget' && <BudgetTab />}
      </div>

      {/* Confirm button — pinned to bottom */}
      <div className="px-3 pb-3 pt-2 border-t border-[#1E1B25] shrink-0">
        <button
          disabled={!canConfirm}
          onClick={() => navigate('/confirm')}
          className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
            canConfirm
              ? 'bg-rose-gold text-white hover:bg-rose-gold-dark'
              : 'bg-[#1E1B25] text-[#8A7A72] cursor-not-allowed'
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
