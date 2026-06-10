import React, { useState } from 'react'
import TripMap from './TripMap'
import ItineraryTab from './ItineraryTab'
import FlightCard from './FlightCard'
import HotelCard from './HotelCard'
import TransportTab from './TransportTab'
import BudgetTab from './BudgetTab'
import useTripStore from '../store/tripStore'

const TABS = ['Itinerary', 'Flights', 'Hotels', 'Transport', 'Budget']

// Right panel — map at the top, tabbed content below
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Itinerary')
  const { trip } = useTripStore()

  // TODO: Add Share Trip button that generates a shareable link via Supabase short URLs
  // TODO: Add Export PDF button that calls POST /confirm with pdf_only=true flag
  // TODO: Add inline edit for destination name / dates in the trip header

  return (
    <div className="flex flex-col h-full">
      {/* Trip header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-warm-gray">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {trip?.destination ?? 'Your Trip'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {trip?.departure_date} → {trip?.return_date}
            {trip?.days?.length ? ` · ${trip.days.length} days` : ''}
          </p>
        </div>
        {/* TODO: Add share / export actions */}
      </div>

      {/* Leaflet map */}
      <div className="h-64 shrink-0">
        <TripMap />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-warm-gray px-6 gap-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'border-rose-gold text-rose-gold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'Itinerary' && <ItineraryTab />}

        {activeTab === 'Flights' && (
          <div className="space-y-4">
            {trip?.flights?.length ? (
              trip.flights.map((flight) => (
                <FlightCard key={flight.offer_id} flight={flight} />
              ))
            ) : (
              <p className="text-sm text-gray-400">No flights found yet.</p>
            )}
          </div>
        )}

        {activeTab === 'Hotels' && (
          <div className="space-y-4">
            {trip?.hotels?.length ? (
              trip.hotels.map((hotel) => (
                <HotelCard key={hotel.offer_id} hotel={hotel} />
              ))
            ) : (
              <p className="text-sm text-gray-400">No hotels found yet.</p>
            )}
          </div>
        )}

        {activeTab === 'Transport' && <TransportTab />}
        {activeTab === 'Budget' && <BudgetTab />}
      </div>
    </div>
  )
}
