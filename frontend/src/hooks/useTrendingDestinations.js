import { useState, useEffect } from 'react'
import { getDiscovery } from '../services/api'

const FALLBACK = [
  { destination: 'Tbilisi',       country: 'Georgia',    score: 89 },
  { destination: 'Kotor',         country: 'Montenegro', score: 82 },
  { destination: 'Chefchaouen',   country: 'Morocco',    score: 79 },
  { destination: 'Plovdiv',       country: 'Bulgaria',   score: 71 },
  { destination: 'Luang Prabang', country: 'Laos',       score: 76 },
  { destination: 'Valparaíso',    country: 'Chile',      score: 68 },
]

export function useTrendingDestinations() {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDiscovery({}).then(({ data }) => {
      setDestinations(data?.trending?.length ? data.trending : FALLBACK)
      setLoading(false)
    })
  }, [])

  return { destinations, loading }
}
