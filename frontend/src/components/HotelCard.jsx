import React from 'react'

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
