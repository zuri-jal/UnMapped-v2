import React from 'react'
import useTripStore from '../store/tripStore'

// Pure display card — hotels are one-per-city so there's nothing to select between.
// cityName is shown as the location fallback if hotel.location is absent.
export default function HotelCard({ hotel, cityName }) {
  const stars = hotel.stars ? '★'.repeat(Math.min(hotel.stars, 5)) : null

  return (
    <div className="card-dark mb-4 hover-lift transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-plan-text-primary leading-tight truncate">{hotel.name}</p>
          {stars && <p className="text-[10px] text-plan-primary tracking-widest mt-1">{stars}</p>}
          <p className="text-[10px] text-plan-text-secondary mt-1 truncate">{hotel.location ?? cityName}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-plan-primary">${Number(hotel.price_per_night_usd ?? 0).toLocaleString()}</p>
          <p className="text-[9px] text-plan-text-muted uppercase tracking-wider mt-0.5">/ night</p>
          {hotel.total_price_usd != null && (
            <p className="text-[9px] text-plan-text-secondary mt-1">${Number(hotel.total_price_usd).toLocaleString()} total</p>
          )}
        </div>
      </div>

      {hotel.distance_from_airport && (
        <p className="text-[10px] text-plan-text-secondary mt-3">
          <span className="text-plan-success mr-1">✈</span> {hotel.distance_from_airport}
        </p>
      )}

      {hotel.why_recommended && (
        <p className="text-[10px] text-plan-text-muted mt-2 leading-relaxed line-clamp-2 italic">
          "{hotel.why_recommended}"
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
      className={`card-dark cursor-pointer transition-all duration-200 mb-3 ${
        isSelected ? 'border-plan-primary ring-1 ring-plan-primary/50 bg-plan-surface-3 shadow-md' : 'hover:border-plan-primary/50 hover-lift'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-plan-text-primary leading-tight truncate">{hotel.name}</p>
          {hotel.rating != null && (
            <p className="text-[10px] text-plan-primary mt-1 font-semibold">
              ★ {hotel.rating}
              <span className="text-plan-text-muted font-normal ml-1">
                {hotel.user_ratings_total != null && `(${hotel.user_ratings_total})`}
              </span>
            </p>
          )}
          <p className="text-[10px] text-plan-text-secondary mt-1 truncate">{hotel.address}</p>
        </div>
        <div className="text-right shrink-0">
          {hotel.price_level && <p className="text-sm font-bold text-plan-primary">{hotel.price_level}</p>}
          {isSelected && <p className="text-[9px] text-plan-primary font-bold tracking-wide mt-1">SELECTED ✓</p>}
        </div>
      </div>

      {(hotel.place_id || hotel.website) && (
        <div className="flex items-center gap-4 mt-3">
          {hotel.place_id && (
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${hotel.place_id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[9px] font-semibold text-plan-primary hover:text-plan-primary-hover hover:underline"
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
              className="text-[9px] font-semibold text-plan-primary hover:text-plan-primary-hover hover:underline"
            >
              Hotel website
            </a>
          )}
        </div>
      )}

      <div className="mt-3 pt-2.5 border-t border-plan-border-subtle">
        <p className="text-[9px] text-plan-success font-bold uppercase tracking-wider flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          Source: Google Places
        </p>
      </div>
    </div>
  )
}
