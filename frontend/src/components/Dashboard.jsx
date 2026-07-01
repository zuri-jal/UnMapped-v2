import React, { useState } from 'react'
import TripMap from './TripMap'
import ItineraryTab from './ItineraryTab'
import FlightCard from './FlightCard'
import HotelCard from './HotelCard'
import TransportTab from './TransportTab'
import BudgetTab from './BudgetTab'
import CityEditor from './CityEditor'
import useTripStore from '../store/tripStore'

const TABS = ['Itinerary', 'Flights', 'Hotels', 'Cities', 'Ground Transport', 'Budget']

// TODO: Add Share Trip button that generates a shareable link via Supabase short URLs
// TODO: Add Export PDF button that calls POST /confirm with pdf_only=true flag
// TODO: Add inline edit for destination name / dates in the trip header

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Itinerary')
  const { tripData } = useTripStore()

  const cities    = tripData?.cities ?? []
  const totalDays = cities.reduce((s, c) => s + (c.day_count ?? 0), 0) || tripData?.days?.length

  // Group flights[] by leg (from → to), preserving the sequential order from the backend
  const flightLegs = (() => {
    const map = new Map()
    for (const f of (tripData?.flights ?? [])) {
      const key = f.from && f.to ? `${f.from} → ${f.to}` : 'Unknown leg'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(f)
    }
    return [...map.entries()]   // [[legKey, [flightOffers]], ...]
  })()

  // Header title: for multi-city, join city names; for single, use destination field
  const headerTitle =
    cities.length > 1
      ? cities.map((c) => c.name).join(' · ')
      : (tripData?.destination ?? 'Your Trip')

  return (
    <div className="flex flex-col h-full">
      {/* Trip header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-warm-gray">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{headerTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tripData?.departure_date} → {tripData?.return_date}
            {totalDays ? ` · ${totalDays} days` : ''}
            {cities.length > 1 ? ` · ${cities.length} cities` : ''}
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
          <div className="space-y-6">
            {flightLegs.length ? (
              flightLegs.map(([legKey, legFlights]) => (
                <div key={legKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-semibold text-[#8A7A72] uppercase tracking-wider whitespace-nowrap">
                      ✈ {legKey}
                    </span>
                    <div className="h-px flex-1 bg-[#1E1B25]" />
                  </div>
                  {legFlights.map((flight, i) => (
                    <FlightCard
                      key={flight.offer_id ?? flight.flight_number ?? i}
                      flight={flight}
                      legKey={legKey}
                      index={i}
                    />
                  ))}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No flights found yet.</p>
            )}
          </div>
        )}

        {activeTab === 'Hotels' && (
          <div className="space-y-6">
            {cities.length ? (
              cities.map((city, ci) => (
                <div key={ci}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-[#8A7A72] uppercase tracking-wider whitespace-nowrap">
                      {city.name}{city.country ? `, ${city.country}` : ''}
                    </span>
                    <div className="h-px flex-1 bg-[#1E1B25]" />
                  </div>
                  {city.hotel ? (
                    <HotelCard hotel={city.hotel} cityName={city.name} index={ci} />
                  ) : (
                    <p className="text-xs text-[#8A7A72]">No hotel found for {city.name}.</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No hotels found yet.</p>
            )}
          </div>
        )}

        {activeTab === 'Cities'            && <CityEditor />}
        {activeTab === 'Ground Transport' && <TransportTab />}
        {activeTab === 'Budget'            && <BudgetTab />}
      </div>
    </div>
  )
}
