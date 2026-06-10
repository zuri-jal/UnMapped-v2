import React from 'react'
import useTripStore from '../store/tripStore'

// Budget tab — breakdown of estimated costs across all trip categories
export default function BudgetTab() {
  const { trip, selectedFlightId, selectedHotelId } = useTripStore()

  // TODO: Add a daily spending allowance field the user can set
  // TODO: Add a currency conversion toggle using a live rates API
  // TODO: Replace hardcoded first items with the user's selected flight/hotel by offer_id
  // TODO: Add a visual progress bar per category (cost as % of total budget)

  const nights = trip?.days?.length ?? 0

  const selectedFlight = trip?.flights?.find((f) => f.offer_id === selectedFlightId) ?? trip?.flights?.[0]
  const selectedHotel = trip?.hotels?.find((h) => h.offer_id === selectedHotelId) ?? trip?.hotels?.[0]

  const flightCost = selectedFlight?.price ?? 0
  const hotelCost = selectedHotel ? selectedHotel.price_per_night * nights : 0
  const activitiesCost =
    trip?.days?.reduce(
      (sum, day) => sum + day.activities.reduce((s, a) => s + (a.estimated_cost ?? 0), 0),
      0
    ) ?? 0

  const total = flightCost + hotelCost + activitiesCost
  const currency = trip?.currency ?? 'USD'

  const categories = [
    { label: 'Flights', amount: flightCost, icon: '✈️' },
    { label: `Accommodation (${nights} nights)`, amount: hotelCost, icon: '🏨' },
    { label: 'Activities', amount: activitiesCost, icon: '🎭' },
  ]

  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-4">Budget Breakdown</h3>

      <div className="space-y-3">
        {categories.map(({ label, amount, icon }) => (
          <div key={label} className="card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            <span className="text-sm font-semibold text-rose-gold">
              {currency} {amount.toLocaleString()}
            </span>
          </div>
        ))}

        {/* Total */}
        <div className="card flex items-center justify-between bg-rose-gold/5 border-rose-gold/20">
          <span className="font-semibold text-gray-900">Estimated Total</span>
          <span className="font-bold text-rose-gold text-xl">
            {currency} {total.toLocaleString()}
          </span>
        </div>

        {trip?.total_estimated_cost && (
          <p className="text-xs text-gray-400 text-center mt-2">
            AI estimate: {currency} {trip.total_estimated_cost.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}
