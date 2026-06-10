import React from 'react'
import DayCard from './DayCard'
import useTripStore from '../store/tripStore'

// Itinerary tab — renders a DayCard for each day in the planned trip
export default function ItineraryTab() {
  const { trip } = useTripStore()

  // TODO: Add "Regenerate Itinerary" button that sends a /update request with "regenerate all days"
  // TODO: Add "Export to Google Calendar" button using the Calendar API
  // TODO: Add a trip notes / highlights section at the top

  if (!trip?.days?.length) {
    return (
      <div className="text-center text-gray-400 py-12">
        <p className="text-2xl mb-2">📅</p>
        <p className="text-sm">No itinerary generated yet.</p>
        <p className="text-xs mt-1">Chat with the planner to build your day-by-day schedule.</p>
      </div>
    )
  }

  return (
    <div>
      {trip.days.map((day) => (
        <DayCard key={day.day_number} day={day} />
      ))}
    </div>
  )
}
