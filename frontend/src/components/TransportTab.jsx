import React from 'react'
import useTripStore from '../store/tripStore'

export default function TransportTab() {
  const {
    tripData,
    selectedGroundTransportIds,
    selectedFlightIds,
    selectGroundTransport,
  } = useTripStore()

  const groundLegs = tripData?.ground_transport ?? []

  if (!tripData) {
    return (
      <div className="text-center text-[#8A7A72] py-10">
        <div className="text-3xl mb-2">🚆</div>
        <p className="text-xs font-medium text-[#F0ECE8]">No trip planned yet</p>
        <p className="text-[10px] mt-1">Plan a trip to see ground transport options.</p>
      </div>
    )
  }

  if (groundLegs.length === 0) {
    return (
      <div className="text-center text-[#8A7A72] py-10">
        <div className="text-3xl mb-2">✈️</div>
        <p className="text-xs font-medium text-[#F0ECE8]">No ground transport alternatives</p>
        <p className="text-[10px] mt-1 max-w-[220px] mx-auto leading-relaxed">
          Train and bus options appear here for domestic legs within the same country (up to ~800 km).
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groundLegs.map((leg) => {
        const legKey      = `${leg.leg_from} → ${leg.leg_to}`
        const selectedId  = selectedGroundTransportIds?.[legKey]
        const flightChosen = !!selectedFlightIds?.[legKey]

        return (
          <div key={legKey}>
            {/* Leg header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-semibold text-[#8A7A72] uppercase tracking-wider whitespace-nowrap">
                🛤 {legKey}
              </span>
              <div className="h-px flex-1 bg-[#1E1B25]" />
            </div>

            <p className="text-[10px] text-[#8A7A72] mb-3">
              {leg.distance_km} km · driving ~{leg.driving_duration_hours}h
              {flightChosen && (
                <span className="ml-2 text-[#5DCAA5]">· flight selected — select below to switch</span>
              )}
            </p>

            {leg.options.map((opt) => {
              const isSelected = selectedId === opt.id
              const icon       = opt.mode === 'train' ? '🚆' : '🚌'

              return (
                <div
                  key={opt.id}
                  onClick={() => selectGroundTransport(legKey, opt.id)}
                  role="button"
                  aria-pressed={isSelected}
                  className={`card-dark cursor-pointer transition-all mb-2 ${
                    isSelected
                      ? 'border-rose-gold ring-1 ring-rose-gold/50'
                      : 'hover:border-rose-gold/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#F0ECE8] truncate">
                        {icon} {opt.operator}
                      </p>
                      <p className="text-[10px] text-[#8A7A72] mt-0.5">
                        {opt.mode === 'train' ? 'Train' : 'Bus'} · {opt.duration}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-rose-gold">
                        ${Number(opt.price_usd ?? 0).toLocaleString()}
                      </p>
                      {isSelected && (
                        <p className="text-[9px] text-rose-gold font-medium">Selected ✓</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 text-[10px] text-[#8A7A72]">
                    <div>
                      <p className="text-xs font-medium text-[#F0ECE8]">{opt.departure_time}</p>
                      <p className="text-[9px]">Departure</p>
                    </div>
                    <div className="flex-1 mx-2 text-center">
                      <div className="flex items-center">
                        <div className="flex-1 h-px bg-[#1E1B25]" />
                        <span className="mx-1 text-[#8A7A72]">{icon}</span>
                        <div className="flex-1 h-px bg-[#1E1B25]" />
                      </div>
                      <p className="text-[9px] mt-0.5 text-[#8A7A72]">{opt.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-[#F0ECE8]">{opt.arrival_time}</p>
                      <p className="text-[9px]">Arrival</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
