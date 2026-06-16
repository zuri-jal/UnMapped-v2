import React from 'react'
import DayCard from './DayCard'
import useTripStore from '../store/tripStore'

export default function ItineraryTab() {
  const { tripData } = useTripStore()

  if (!tripData?.days?.length) {
    return (
      <div className="text-center text-[#8A7A72] py-10 px-3">
        <div className="text-3xl mb-2">📅</div>
        <p className="text-xs">Your day-by-day itinerary will appear here once you plan a trip.</p>
      </div>
    )
  }

  return (
    <div>
      {tripData.days.map((day, i) => (
        <DayCard key={day.day ?? day.day_number ?? i} day={day} />
      ))}
    </div>
  )
}
