import React from 'react'
import useTripStore from '../store/tripStore'

// Pure display card — hotels are one-per-city so there's nothing to select between.
// cityName is shown as the location fallback if hotel.location is absent.
export default function HotelCard({ hotel, cityName }) {
  const stars = hotel.stars ? '★'.repeat(Math.min(hotel.stars, 5)) : null

  return (
    <div className="card-dark mb-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#F0ECE8] leading-tight truncate">{hotel.name}</p>
          {stars && <p className="text-[10px] text-rose-gold tracking-widest mt-0.5">{stars}</p>}
          <p className="text-[10px] text-[#8A7A72] mt-0.5 truncate">{hotel.location ?? cityName}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-rose-gold">${Number(hotel.price_per_night_usd ?? 0).toLocaleString()}</p>
          <p className="text-[9px] text-[#8A7A72]">/night</p>
          {hotel.total_price_usd != null && (
            <p className="text-[9px] text-[#8A7A72]">${Number(hotel.total_price_usd).toLocaleString()} total</p>
          )}
        </div>
      </div>

      {hotel.distance_from_airport && (
        <p className="text-[10px] text-[#8A7A72] mt-2">
          <span className="text-[#5DCAA5]">✈</span> {hotel.distance_from_airport}
        </p>
      )}

      {hotel.why_recommended && (
        <p className="text-[10px] text-[#8A7A72] mt-1 leading-relaxed line-clamp-2">
          {hotel.why_recommended}
        </p>
      )}
    </div>
  )
}

// Selectable card for Google Places "Verified Hotels Nearby" results.
// cityKey identifies which city's places_hotels list this selection belongs to.
export function PlacesHotelCard({ hotel, cityKey, index }) {
  const { selectPlacesHotel, selectedPlacesHotelIds } = useTripStore()
  const id = hotel.name || `places-hotel-${index}`
  const isSelected = selectedPlacesHotelIds?.[cityKey] === id

  return (
    <div
      onClick={() => selectPlacesHotel(cityKey, id)}
      role="button"
      aria-pressed={isSelected}
      className={`card-dark cursor-pointer transition-all mb-2 ${
        isSelected ? 'border-rose-gold ring-1 ring-rose-gold/50' : 'hover:border-rose-gold/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#F0ECE8] leading-tight truncate">{hotel.name}</p>
          {hotel.rating != null && (
            <p className="text-[10px] text-rose-gold mt-0.5">
              ★ {hotel.rating}
              {hotel.user_ratings_total != null && ` (${hotel.user_ratings_total})`}
            </p>
          )}
          <p className="text-[10px] text-[#8A7A72] mt-0.5 truncate">{hotel.address}</p>
        </div>
        <div className="text-right shrink-0">
          {hotel.price_level && <p className="text-sm font-bold text-rose-gold">{hotel.price_level}</p>}
          {isSelected && <p className="text-[9px] text-rose-gold font-medium">Selected ✓</p>}
        </div>
      </div>

      {(hotel.place_id || hotel.website) && (
        <div className="flex items-center gap-3 mt-2">
          {hotel.place_id && (
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${hotel.place_id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[9px] text-rose-gold hover:underline"
            >
              View on Google Maps
            </a>
          )}
          {hotel.website && (
            <a
              href={hotel.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[9px] text-rose-gold hover:underline"
            >
              Hotel website
            </a>
          )}
        </div>
      )}

      <p className="text-[9px] text-[#5DCAA5] mt-2">Source: Google Places</p>
    </div>
  )
}
