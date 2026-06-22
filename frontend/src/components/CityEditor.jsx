import React, { useState } from 'react'
import useTripStore from '../store/tripStore'

export default function CityEditor() {
  const { tripData, reorderCities, removeCity, updateCityDayCount, setCities } = useTripStore()
  const [suggestDismissed, setSuggestDismissed] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)

  const cities    = tripData?.cities ?? []
  const suggested = tripData?.suggested_route_order

  const currentOrder    = cities.map((c) => c.name)
  const suggestActive   = !suggestDismissed &&
    suggested?.length &&
    JSON.stringify(suggested) !== JSON.stringify(currentOrder)

  const applyOrder = () => {
    const reordered = [
      ...suggested
        .map((name) => cities.find((c) => c.name === name))
        .filter(Boolean),
      // Include any cities the backend didn't mention in the suggestion
      ...cities.filter((c) => !suggested.includes(c.name)),
    ]
    setCities(reordered)
    setSuggestDismissed(true)
  }

  if (!cities.length) {
    return (
      <div className="text-center text-[#8A7A72] py-10 px-3">
        <div className="text-3xl mb-2">🗺️</div>
        <p className="text-xs">No cities yet — plan a trip to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Suggested order banner */}
      {suggestActive && (
        <div className="card-dark border border-rose-gold/30 p-3 mb-2">
          <p className="text-[10px] text-[#8A7A72] mb-1 uppercase tracking-wider font-medium">Suggested efficient order</p>
          <p className="text-xs font-medium text-[#F0ECE8] mb-3">
            {suggested.join(' → ')}
          </p>
          <div className="flex gap-2">
            <button
              onClick={applyOrder}
              className="text-[10px] font-medium text-rose-gold border border-rose-gold/40 rounded px-2.5 py-1 hover:bg-rose-gold/10 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => setSuggestDismissed(true)}
              className="text-[10px] text-[#8A7A72] border border-[#2A2533] rounded px-2.5 py-1 hover:border-[#8A7A72] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* City rows */}
      {cities.map((city, ci) => (
        <div key={ci} className="card-dark flex items-center gap-3">
          {/* Reorder controls */}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              onClick={() => reorderCities(ci, ci - 1)}
              disabled={ci === 0}
              className="text-[10px] text-[#8A7A72] hover:text-[#F0ECE8] disabled:opacity-25 leading-none px-0.5"
              title="Move up"
            >
              ▲
            </button>
            <button
              onClick={() => reorderCities(ci, ci + 1)}
              disabled={ci === cities.length - 1}
              className="text-[10px] text-[#8A7A72] hover:text-[#F0ECE8] disabled:opacity-25 leading-none px-0.5"
              title="Move down"
            >
              ▼
            </button>
          </div>

          {/* City info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#F0ECE8] truncate">{city.name}</p>
            {city.country && (
              <p className="text-[9px] text-[#8A7A72]">{city.country}</p>
            )}
          </div>

          {/* Day count editor */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => updateCityDayCount(ci, (city.day_count ?? 1) - 1)}
              className="w-5 h-5 rounded bg-[#1E1B25] text-[#8A7A72] hover:text-[#F0ECE8] text-xs flex items-center justify-center transition-colors"
            >
              −
            </button>
            <span className="text-[11px] font-medium text-[#F0ECE8] w-8 text-center">
              {city.day_count ?? city.days?.length ?? '?'}d
            </span>
            <button
              onClick={() => updateCityDayCount(ci, (city.day_count ?? 1) + 1)}
              className="w-5 h-5 rounded bg-[#1E1B25] text-[#8A7A72] hover:text-[#F0ECE8] text-xs flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>

          {/* Remove */}
          <button
            onClick={() => removeCity(ci)}
            disabled={cities.length === 1}
            className="text-[10px] text-[#8A7A72] hover:text-red-400 disabled:opacity-25 ml-1 shrink-0 transition-colors"
            title={cities.length === 1 ? 'Cannot remove the only city' : 'Remove city'}
          >
            ✕
          </button>
        </div>
      ))}

      {/* Add city — requires backend re-plan */}
      <button
        onClick={() => setShowAddNote((v) => !v)}
        className="w-full card-dark border-dashed text-xs text-[#8A7A72] hover:text-[#F0ECE8] hover:border-rose-gold/30 transition-colors py-3 text-center"
      >
        + Add city
      </button>
      {showAddNote && (
        <p className="text-[10px] text-amber-400/80 text-center leading-relaxed px-2">
          Adding a new city requires regenerating the itinerary. Type your updated trip in the chat to re-plan.
          <br />
          <span className="text-[#8A7A72]">(Backend endpoint for incremental city addition is not yet implemented.)</span>
        </p>
      )}

      <p className="text-[9px] text-[#8A7A72] text-center px-2 leading-relaxed pt-1">
        Reorder and day-count changes update the display locally. Re-plan via chat to regenerate the full itinerary.
      </p>
    </div>
  )
}
