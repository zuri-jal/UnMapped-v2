import React, { useState } from 'react'

// Expandable card for a single day's activities in the itinerary
export default function DayCard({ day }) {
  const [isExpanded, setIsExpanded] = useState(true)

  // TODO: Add drag-to-reorder activities using @dnd-kit/sortable
  // TODO: Add inline activity edit — click title to edit in place
  // TODO: Add "Add activity" button that pre-fills a chat message in InputForm

  return (
    <div className="card mb-4">
      <button
        className="flex items-center justify-between w-full"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-gold text-white text-sm font-bold flex items-center justify-center shrink-0">
            {day.day_number}
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">Day {day.day_number}</p>
            {day.date && (
              <p className="text-xs text-gray-400">{day.date}</p>
            )}
          </div>
        </div>
        <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3 pl-11 border-t border-warm-gray pt-4">
          {day.activities.length === 0 ? (
            <p className="text-xs text-gray-400">No activities planned yet.</p>
          ) : (
            day.activities.map((activity, index) => (
              <div key={index} className="flex gap-3">
                {activity.time && (
                  <span className="text-xs text-gray-400 w-14 shrink-0 pt-0.5 font-mono">
                    {activity.time}
                  </span>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {activity.description}
                    </p>
                  )}
                  {activity.location && (
                    <p className="text-xs text-gray-400 mt-0.5">📍 {activity.location}</p>
                  )}
                  {activity.estimated_cost != null && (
                    <p className="text-xs text-rose-gold mt-0.5 font-medium">
                      ~${activity.estimated_cost}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
