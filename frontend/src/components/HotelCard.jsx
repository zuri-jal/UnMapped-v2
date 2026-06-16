import React from 'react'
import useTripStore from '../store/tripStore'

export default function HotelCard({ hotel, index }) {
  const { selectHotel, selectedHotelId } = useTripStore()
  // Prefer name; fall back to stable index string so selection still works
  const id = hotel.name || `hotel-${index}`
  const isSelected = selectedHotelId === id

  const stars = hotel.stars ? '★'.repeat(Math.min(hotel.stars, 5)) : null

  return (
    <div
      onClick={() => selectHotel(id)}
      role="button"
      aria-pressed={isSelected}
      className={`card-dark cursor-pointer transition-all mb-2 ${
        isSelected ? 'border-rose-gold ring-1 ring-rose-gold/50' : 'hover:border-rose-gold/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#F0ECE8] leading-tight truncate">{hotel.name}</p>
          {stars && <p className="text-[10px] text-rose-gold tracking-widest mt-0.5">{stars}</p>}
          <p className="text-[10px] text-[#8A7A72] mt-0.5 truncate">{hotel.location}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-rose-gold">${Number(hotel.price_per_night_usd ?? 0).toLocaleString()}</p>
          <p className="text-[9px] text-[#8A7A72]">/night</p>
          {hotel.total_price_usd != null && (
            <p className="text-[9px] text-[#8A7A72]">${Number(hotel.total_price_usd).toLocaleString()} total</p>
          )}
          {isSelected && <p className="text-[9px] text-rose-gold font-medium mt-0.5">Selected ✓</p>}
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
