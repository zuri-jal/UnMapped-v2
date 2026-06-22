import React, { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet'
import useTripStore from '../store/tripStore'

// Lightweight coordinate lookup — city name (lowercase) → [lat, lng]
const COORDS = {
  'london': [51.5074, -0.1278], 'paris': [48.8566, 2.3522],
  'new york': [40.7128, -74.006], 'los angeles': [34.0522, -118.2437],
  'tokyo': [35.6762, 139.6503], 'osaka': [34.6937, 135.5023],
  'seoul': [37.5665, 126.978], 'beijing': [39.9042, 116.4074],
  'shanghai': [31.2304, 121.4737], 'hong kong': [22.3193, 114.1694],
  'singapore': [1.3521, 103.8198], 'bangkok': [13.7563, 100.5018],
  'bali': [-8.3405, 115.092], 'ubud': [-8.5069, 115.2625],
  'seminyak': [-8.6904, 115.1615], 'kuta': [-8.7182, 115.1709],
  'kuala lumpur': [3.139, 101.6869], 'jakarta': [-6.2088, 106.8456],
  'manila': [14.5995, 120.9842], 'ho chi minh city': [10.8231, 106.6297],
  'hanoi': [21.0278, 105.8342], 'phuket': [7.8804, 98.3923],
  'da nang': [16.0544, 108.2022], 'hoi an': [15.8801, 108.338],
  'hue': [16.4637, 107.5909], 'nha trang': [12.2388, 109.1967],
  'siem reap': [13.3633, 103.856], 'phnom penh': [11.5625, 104.916],
  'yangon': [16.8661, 96.1951], 'luang prabang': [19.8845, 102.1348],
  'vientiane': [17.9757, 102.6331],
  'yogyakarta': [-7.7972, 110.3688], 'surabaya': [-7.2575, 112.7521],
  'bandung': [-6.9175, 107.6191], 'lombok': [-8.6506, 116.3249],
  'delhi': [28.6139, 77.209], 'mumbai': [19.076, 72.8777],
  'dubai': [25.2048, 55.2708], 'istanbul': [41.0082, 28.9784],
  'rome': [41.9028, 12.4964], 'milan': [45.4654, 9.1859],
  'barcelona': [41.3851, 2.1734], 'madrid': [40.4168, -3.7038],
  'lisbon': [38.7169, -9.1399], 'amsterdam': [52.3676, 4.9041],
  'berlin': [52.52, 13.405], 'munich': [48.1351, 11.582],
  'vienna': [48.2082, 16.3738], 'prague': [50.0755, 14.4378],
  'budapest': [47.4979, 19.0402], 'athens': [37.9838, 23.7275],
  'sydney': [-33.8688, 151.2093], 'melbourne': [-37.8136, 144.9631],
  'auckland': [-36.8509, 174.7645], 'toronto': [43.6532, -79.3832],
  'vancouver': [49.2827, -123.1207], 'montreal': [45.5017, -73.5673],
  'cancun': [21.1619, -86.8515], 'mexico city': [19.4326, -99.1332],
  'miami': [25.7617, -80.1918], 'new orleans': [29.9511, -90.0715],
  'san francisco': [37.7749, -122.4194], 'chicago': [41.8781, -87.6298],
  'rio de janeiro': [-22.9068, -43.1729], 'buenos aires': [-34.6037, -58.3816],
  'lima': [-12.0464, -77.0428], 'bogota': [4.711, -74.0721],
  'cape town': [-33.9249, 18.4241], 'nairobi': [-1.2921, 36.8219],
  'marrakech': [31.6295, -7.9811], 'cairo': [30.0444, 31.2357],
  'tbilisi': [41.6938, 44.8015], 'reykjavik': [64.1355, -21.8954],
  'edinburgh': [55.9533, -3.1883], 'dublin': [53.3498, -6.2603],
  'kyoto': [35.0116, 135.7681], 'hiroshima': [34.3853, 132.4553],
  'taipei': [25.033, 121.5654], 'colombo': [6.9271, 79.8612],
  'kathmandu': [27.7172, 85.324], 'doha': [25.2854, 51.531],
}

function resolveCoords(location) {
  if (!location) return null
  const key = location.toLowerCase().trim()
  if (COORDS[key]) return COORDS[key]
  // Partial match — check if any key is contained in the location string
  for (const [k, v] of Object.entries(COORDS)) {
    if (key.includes(k) || k.includes(key.split(',')[0].trim())) return v
  }
  return null
}

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const ATTRIBUTION = '&copy; <a href="https://carto.com">CARTO</a>'

export default function TripMap({ darkMode = true }) {
  const { tripData } = useTripStore()

  const points = useMemo(() => {
    const seen = new Set()
    const dedupe = (arr) =>
      arr.filter((p) => {
        if (!p.coords) return false
        const key = p.coords.join(',')
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

    // Prefer new cities[] shape — one pin per city in route order
    if (tripData?.cities?.length) {
      return dedupe(
        tripData.cities.map((city) => ({
          location: city.name,
          coords: resolveCoords(city.name),
        }))
      )
    }

    // Fallback: old flat days[].location shape
    if (tripData?.days?.length) {
      return dedupe(
        tripData.days.map((d) => ({
          location: d.location,
          coords: resolveCoords(d.location),
        }))
      )
    }

    return []
  }, [tripData])

  const center = points[0]?.coords ?? [20, 0]
  const zoom   = points.length > 1 ? 5 : points.length === 1 ? 10 : 2

  return (
    <MapContainer
      key={center.join(',')}
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      scrollWheelZoom={false}
      attributionControl={false}
    >
      <TileLayer url={darkMode ? DARK_TILES : LIGHT_TILES} attribution={ATTRIBUTION} />

      {/* Route line */}
      {points.length > 1 && (
        <Polyline
          positions={points.map((p) => p.coords)}
          pathOptions={{ color: '#B07050', weight: 2, dashArray: '8 6', opacity: 0.8 }}
        />
      )}

      {/* City markers */}
      {points.map((p, i) => (
        <CircleMarker
          key={i}
          center={p.coords}
          radius={6}
          pathOptions={{
            color: '#B07050',
            fillColor: '#B07050',
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} opacity={1}>
            <span className="text-xs font-medium">{p.location}</span>
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Empty state marker */}
      {points.length === 0 && (
        <CircleMarker
          center={[20, 0]}
          radius={4}
          pathOptions={{ color: '#1E1B25', fillColor: '#1E1B25', fillOpacity: 0.5 }}
        />
      )}
    </MapContainer>
  )
}
