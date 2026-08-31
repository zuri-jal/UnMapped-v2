import React from 'react'
import DayCard from './DayCard'
import useTripStore from '../store/tripStore'

export default function ItineraryTab() {
  const { tripData } = useTripStore()
  const cities = tripData?.cities

  if (!cities?.length) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-plan-surface-2 flex items-center justify-center mb-4 border border-plan-border-subtle shadow-inner">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-plan-primary" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <p className="text-sm font-semibold text-plan-text-primary">No itinerary available</p>
        <p className="text-[11px] text-plan-text-secondary mt-1">
          Your day-by-day itinerary will appear here once you plan a trip.
        </p>
      </div>
    )
  }

  const cityColors = ['#C9916E', '#4ECDC4', '#A890FE', '#FE90AF', '#FFC371', '#38EF7D']

  let dayOffset = 0
  return (
    <div>
      {cities.map((city, ci) => {
        const count    = city.day_count ?? city.days?.length ?? 0
        const startDay = dayOffset + 1
        const endDay   = dayOffset + count
        dayOffset = endDay

        const rangeLabel = count <= 1 ? `Day ${startDay}` : `Days ${startDay}–${endDay}`
        const cityColor = cityColors[ci % cityColors.length]

        return (
          <div key={ci}>
            <div className="flex items-center gap-2 mt-5 mb-3 first:mt-0">
              <div className="h-px flex-1 bg-plan-border-subtle" />
              <span className="text-[10px] font-bold text-plan-text-secondary uppercase tracking-wider whitespace-nowrap">
                {rangeLabel} — {city.name}
              </span>
              <div className="h-px flex-1 bg-plan-border-subtle" />
            </div>
            {(city.days ?? []).map((day, di) => (
              <DayCard key={day.day ?? day.day_number ?? di} day={day} cityColor={cityColor} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
