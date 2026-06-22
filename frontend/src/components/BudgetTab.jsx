import React from 'react'
import useTripStore from '../store/tripStore'

export default function BudgetTab() {
  const { tripData, selectedFlightIds } = useTripStore()

  if (!tripData) {
    return (
      <div className="text-center text-[#8A7A72] py-10 px-3">
        <div className="text-3xl mb-2">💰</div>
        <p className="text-xs">Budget breakdown will appear here after planning your trip.</p>
      </div>
    )
  }

  const bb     = tripData.budget_breakdown ?? {}
  const cities = tripData.cities ?? []

  const nights = cities.reduce((s, c) => s + (c.day_count ?? 0), 0) || tripData.days?.length || 7

  // Flight cost: sum prices of all selected legs (fall back to budget_breakdown estimate)
  const rawFlightCost = Object.values(selectedFlightIds ?? {}).reduce((sum, fId) => {
    const f = (tripData.flights ?? []).find(
      (fl) => (fl.flight_number || fl.offer_id || '') === fId
    )
    return sum + Number(f?.price_usd ?? 0)
  }, 0)
  const flightCost = rawFlightCost || Number(bb.flights ?? 0)

  // Hotel cost: sum across all cities (one hotel per city × day_count)
  const rawHotelCost = cities.reduce((sum, city) => {
    return sum + Number(city.hotel?.price_per_night_usd ?? 0) * (city.day_count ?? 0)
  }, 0)
  const hotelCost = rawHotelCost || Number(bb.accommodation ?? 0)

  const foodCost       = Number(bb.food ?? 0)
  const transportCost  = Number(bb.transport ?? 0)
  const activitiesCost = Number(bb.activities ?? 0)
  const total          = flightCost + hotelCost + foodCost + transportCost + activitiesCost
  const budget         = Number(bb.total ?? total)
  const pct            = budget > 0 ? Math.min((total / budget) * 100, 100) : 0

  const rows = [
    { label: 'Flights',            amount: flightCost,    icon: '✈️' },
    { label: `Hotels (${nights}n)`, amount: hotelCost,    icon: '🏨' },
    { label: 'Food',               amount: foodCost,       icon: '🍜' },
    { label: 'Transport',          amount: transportCost,  icon: '🚌' },
    { label: 'Activities',         amount: activitiesCost, icon: '🎭' },
  ]

  return (
    <div className="px-1">
      {/* Total + progress bar */}
      <div className="card-dark mb-3 text-center py-3">
        <p className="text-[10px] text-[#8A7A72] mb-0.5">Estimated total</p>
        <p className="text-xl font-bold text-rose-gold">${total.toLocaleString()}</p>
        <div className="mt-2 h-1.5 bg-[#1E1B25] rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-gold rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[9px] text-[#8A7A72] mt-1">{Math.round(pct)}% of budget used</p>
      </div>

      {/* Row breakdown */}
      <div className="space-y-1.5">
        {rows.map(({ label, amount, icon }) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#1E1B25]">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{icon}</span>
              <span className="text-[10px] text-[#8A7A72]">{label}</span>
            </div>
            <span className="text-[11px] font-semibold text-rose-gold">${amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
