import React from 'react'
import DayCard from './DayCard'
import useTripStore from '../store/tripStore'

export default function ItineraryTab() {
  const { tripData } = useTripStore()
  const cities = tripData?.cities

  if (!cities?.length) {
    return (
      <div className="text-center text-[#8A7A72] py-10 px-3">
        <div className="text-3xl mb-2">📅</div>
        <p className="text-xs">Your day-by-day itinerary will appear here once you plan a trip.</p>
      </div>
    )
  }

  let dayOffset = 0
  return (
    <div>
      {cities.map((city, ci) => {
        const count    = city.day_count ?? city.days?.length ?? 0
        const startDay = dayOffset + 1
        const endDay   = dayOffset + count
        dayOffset = endDay

        const rangeLabel = count <= 1 ? `Day ${startDay}` : `Days ${startDay}–${endDay}`

        return (
          <div key={ci}>
            <div className="flex items-center gap-2 mt-4 mb-2 first:mt-0">
              <div className="h-px flex-1 bg-[#2A2533]" />
              <span className="text-[10px] font-semibold text-[#8A7A72] uppercase tracking-wider whitespace-nowrap">
                {rangeLabel} — {city.name}
              </span>
              <div className="h-px flex-1 bg-[#2A2533]" />
            </div>
            {(city.days ?? []).map((day, di) => (
              <DayCard key={day.day ?? day.day_number ?? di} day={day} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
