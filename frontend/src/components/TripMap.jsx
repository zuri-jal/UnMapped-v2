import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import useTripStore from '../store/tripStore'

// Fix Leaflet's default icon path broken by Vite's asset bundling
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Leaflet map showing destination and hotel pin locations
export default function TripMap() {
  const { trip } = useTripStore()
  const [center, setCenter] = useState([20, 0])
  const [zoom, setZoom] = useState(2)

  useEffect(() => {
    if (!trip?.destination) return
    // TODO: Geocode trip.destination to lat/lng via a free geocoding API (e.g. Nominatim)
    // TODO: setCenter([lat, lng]) and setZoom(10) once geocoded
    // TODO: Add custom rose-gold-coloured map pin icon using L.divIcon
  }, [trip?.destination])

  return (
    <MapContainer
      key={center.join(',')}
      center={center}
      zoom={zoom}
      className="h-full w-full"
      zoomControl={false}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* TODO: Render a Marker for the main destination */}
      {/* TODO: Render Markers for each hotel that has coordinates */}
      {/* TODO: Render a Polyline connecting airport → hotels if coords are available */}

      {trip?.hotels?.map((hotel) =>
        hotel.coordinates?.lat && hotel.coordinates?.lng ? (
          <Marker
            key={hotel.offer_id}
            position={[hotel.coordinates.lat, hotel.coordinates.lng]}
          >
            <Popup>
              <strong>{hotel.name}</strong>
              <br />
              {hotel.currency} {hotel.price_per_night} / night
            </Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  )
}
