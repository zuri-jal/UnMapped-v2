import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useTripStore from '../store/tripStore'
import ItineraryTab from './ItineraryTab'
import FlightCard   from './FlightCard'
import HotelCard    from './HotelCard'
import BudgetTab    from './BudgetTab'

const TABS = ['Itinerary', 'Flights', 'Hotels', 'Budget']

export default function RightPanel() {
  const navigate = useNavigate()
  const { tripData, selectedFlightId, selectedHotelId, totalCost } = useTripStore()
  const [active, setActive] = useState('Itinerary')

  const canConfirm   = !!selectedFlightId && !!selectedHotelId
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

        {active === 'Flights' && (() => {
          const flights = Array.isArray(tripData?.flights) ? tripData.flights : []
          return flights.length ? (
            flights.map((f, i) => <FlightCard key={f.flight_number ?? i} flight={f} index={i} />)
          ) : (
            <div className="text-center text-[#8A7A72] py-10">
              <div className="text-3xl mb-2">✈</div>
              <p className="text-xs font-medium text-[#F0ECE8]">No flights available</p>
              <p className="text-[10px] mt-1">
                {tripData ? 'No flight results were returned for this route.' : 'Plan a trip to see flight options.'}
              </p>
            </div>
          )
        })()}

        {active === 'Hotels' && (() => {
          const hotels = Array.isArray(tripData?.hotels) ? tripData.hotels : []
          return hotels.length ? (
            hotels.map((h, i) => <HotelCard key={h.name ?? i} hotel={h} index={i} />)
          ) : (
            <div className="text-center text-[#8A7A72] py-10">
              <div className="text-3xl mb-2">🏨</div>
              <p className="text-xs font-medium text-[#F0ECE8]">No hotels available</p>
              <p className="text-[10px] mt-1">
                {tripData ? 'No hotel results were returned for this destination.' : 'Plan a trip to see hotel options.'}
              </p>
            </div>
          )
        })()}

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
            : 'Select a flight & hotel'}
        </button>
      </div>

    </div>
  )
}
