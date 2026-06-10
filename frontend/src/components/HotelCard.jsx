import React from 'react'
import useTripStore from '../store/tripStore'

// Card for a single hotel offer — name, stars, price, amenities, and select action
export default function HotelCard({ hotel }) {
  const { selectHotel, selectedHotelId } = useTripStore()
  const isSelected = selectedHotelId === hotel.offer_id

  // TODO: Add hotel image via Unsplash API (search by hotel name + city)
  // TODO: Render amenity icons using a lookup map (wifi → 📶, pool → 🏊, etc.)
  // TODO: Add "View on Map" button that pans TripMap to hotel.coordinates

  const starDisplay = hotel.stars ? '★'.repeat(hotel.stars) + '☆'.repeat(5 - hotel.stars) : null

  return (
    <div
      className={`card cursor-pointer transition-all ${
        isSelected
          ? 'border-rose-gold ring-1 ring-rose-gold'
          : 'hover:border-rose-gold/40'
      }`}
      onClick={() => selectHotel(hotel.offer_id)}
      role="button"
      aria-pressed={isSelected}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <p className="font-semibold text-gray-900 truncate">{hotel.name}</p>
          {starDisplay && (
            <p className="text-sm text-rose-gold tracking-widest">{starDisplay}</p>
          )}
          <p className="text-xs text-gray-500 mt-0.5">{hotel.city}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-rose-gold">
            {hotel.currency} {hotel.price_per_night.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">per night</p>
          {isSelected && (
            <span className="text-xs text-rose-gold font-medium">Selected ✓</span>
          )}
        </div>
      </div>

      {hotel.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {hotel.amenities.slice(0, 5).map((amenity) => (
            <span
              key={amenity}
              className="text-xs bg-warm-gray text-gray-600 px-2 py-0.5 rounded-full"
            >
              {amenity}
            </span>
          ))}
          {hotel.amenities.length > 5 && (
            <span className="text-xs text-gray-400">+{hotel.amenities.length - 5} more</span>
          )}
        </div>
      )}
    </div>
  )
}
