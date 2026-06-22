import React from 'react'
import useTripStore from '../store/tripStore'

// Transport tab — local transport options for the destination
export default function TransportTab() {
  const { tripData } = useTripStore()

  // TODO: Fetch airport transfer options with estimated prices (use Duffel transfers API)
  // TODO: Show inter-city rail / bus options if it's a multi-city trip
  // TODO: Add car rental suggestions via Duffel car rental endpoint
  // TODO: Fetch public transport tips from openai_service based on destination

  const destination = tripData?.destination
    ?? tripData?.cities?.map((c) => c.name).join(', ')
    ?? 'your destination'

  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-4">Local Transport</h3>

      {/* Airport Transfer placeholder */}
      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚖</span>
          <div>
            <p className="font-medium text-gray-800">Airport Transfer</p>
            <p className="text-xs text-gray-500">
              Transfer options to your hotel in {destination} will appear here.
            </p>
          </div>
        </div>
      </div>

      {/* Public Transport placeholder */}
      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚇</span>
          <div>
            <p className="font-medium text-gray-800">Public Transport</p>
            <p className="text-xs text-gray-500">
              AI-generated transport tips for {destination} will appear here.
            </p>
          </div>
        </div>
      </div>

      {/* Car Rental placeholder */}
      <div className="card">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚗</span>
          <div>
            <p className="font-medium text-gray-800">Car Rental</p>
            <p className="text-xs text-gray-500">
              Duffel car rental options will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
