import React, { useState } from 'react'
import TripMap from './TripMap'
import useTripStore from '../store/tripStore'
import { useTrendingDestinations } from '../hooks/useTrendingDestinations'

const DISC_TABS = ['Trending', 'Food', 'Experiences']

const scoreLabel = (s) => s > 70 ? 'Fernweh' : s > 50 ? 'Wanderlust' : 'Interesting'

function getGradient(name) {
  if (!name) return 'from-plan-surface-2 to-plan-surface-1'
  const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const darkGradients = [
    'from-[#8E2DE2] to-[#4A00E0]',
    'from-[#FF512F] to-[#DD2476]',
    'from-[#1A2980] to-[#26D0CE]',
    'from-[#FF5F6D] to-[#FFC371]',
    'from-[#11998E] to-[#38EF7D]',
    'from-[#C6EA8D] to-[#FE90AF]',
    'from-[#EA8D8D] to-[#A890FE]'
  ]
  return darkGradients[sum % darkGradients.length]
}

const FOOD_DESTINATIONS = [
  { destination: 'Bangkok',     country: 'Thailand' },
  { destination: 'Tokyo',       country: 'Japan' },
  { destination: 'Paris',       country: 'France' },
  { destination: 'Lisbon',      country: 'Portugal' },
  { destination: 'Mexico City', country: 'Mexico' },
  { destination: 'Bologna',     country: 'Italy' },
  { destination: 'Singapore',   country: 'Singapore' },
  { destination: 'Istanbul',    country: 'Turkey' },
]

const EXPERIENCE_DESTINATIONS = [
  { destination: 'Queenstown',  country: 'New Zealand' },
  { destination: 'Bali',        country: 'Indonesia' },
  { destination: 'Marrakech',   country: 'Morocco' },
  { destination: 'Cape Town',   country: 'South Africa' },
  { destination: 'Reykjavik',   country: 'Iceland' },
  { destination: 'Cusco',       country: 'Peru' },
  { destination: 'Banff',       country: 'Canada' },
]

function filterTrendingByTab(tab, destinations) {
  if (tab === 'Trending') {
    return [...destinations].filter(d => d.score > 70).sort((a, b) => b.score - a.score)
  }
  const curated = tab === 'Food' ? FOOD_DESTINATIONS : EXPERIENCE_DESTINATIONS
  const names = new Set(curated.map(c => c.destination.toLowerCase()))
  const matched = destinations.filter(d => names.has(d.destination?.toLowerCase()))
  return matched.length > 0
    ? matched
    : curated.slice(0, 4).map(c => ({ ...c, score: 50 }))
}

function DiscoveryCard({ item }) {
  return (
    <div className={`relative shrink-0 w-36 h-48 rounded-2xl overflow-hidden hover-lift transition-all bg-gradient-to-br ${getGradient(item.name ?? item.destination)}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-sm font-semibold text-white truncate drop-shadow-md">{item.name ?? item.destination}</p>
        <p className="text-[10px] text-white/80 mt-0.5 truncate drop-shadow-md">{item.country ?? item.source ?? ''}</p>
        {item.score != null && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 backdrop-blur-sm bg-white/20 rounded-full w-fit">
            <span className="text-[10px] font-bold text-white">{item.score}</span>
            <span className="text-[10px] text-white/90">· {scoreLabel(item.score)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const TYPE_META = {
  restaurant: { emoji: '🍽️', label: 'restaurant' },
  food:       { emoji: '🍜', label: 'food' },
  activity:   { emoji: '🎯', label: 'activity' },
  viewpoint:  { emoji: '🔭', label: 'viewpoint' },
}

function HiddenGemCard({ gem }) {
  const meta = TYPE_META[gem.type] ?? { emoji: '✨', label: gem.type ?? 'gem' }
  return (
    <div className={`relative shrink-0 w-44 h-48 rounded-2xl overflow-hidden hover-lift transition-all bg-gradient-to-br ${getGradient(gem.name)}`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-1">
         <span className="text-xs">{meta.emoji}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white uppercase tracking-wider mb-1.5 inline-block drop-shadow-sm">
          {meta.label}
        </span>
        <p className="text-xs font-semibold text-white drop-shadow-md line-clamp-1">{gem.name}</p>
        {gem.description && (
          <p className="text-[10px] text-white/80 mt-1 line-clamp-2 leading-tight drop-shadow-sm">
            {gem.description}
          </p>
        )}
        {gem.source_quote && (
          <p className="text-[9px] text-white/70 mt-1.5 italic line-clamp-2 leading-tight drop-shadow-sm">
            &ldquo;{gem.source_quote}&rdquo;
          </p>
        )}
      </div>
    </div>
  )
}

export default function CenterPanel() {
  const { tripData, darkMode, toggleDarkMode } = useTripStore()
  const [discTab, setDiscTab] = useState('Trending')
  const { destinations: trendingDestinations, loading: trendingLoading } = useTrendingDestinations()

  const hiddenGems = tripData?.hidden_gems ?? []
  const hasGems = hiddenGems.length > 0

  const filteredGems = hasGems
    ? hiddenGems.filter((gem) => {
        if (discTab === 'Trending') return true
        if (discTab === 'Food') return gem.type === 'food' || gem.type === 'restaurant'
        if (discTab === 'Experiences') return gem.type === 'activity' || gem.type === 'viewpoint'
        return true
      })
    : filterTrendingByTab(discTab, trendingDestinations)

  const displayItems = filteredGems.length > 0 ? filteredGems : (hasGems ? hiddenGems : trendingDestinations)

  const destination = tripData?.cities?.[0]?.name
    ?? tripData?.days?.[0]?.location
    ?? (typeof tripData?.destination === 'string' ? tripData.destination : '')

  const summaryFirst = tripData?.summary ? tripData.summary.split('.')[0].trim() : null
  const tripLabel = summaryFirst
    ? (summaryFirst.length > 40 ? summaryFirst.slice(0, 40) + '…' : summaryFirst)
    : null

  return (
    <div className="flex flex-col h-full bg-plan-bg-base relative">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-plan-border-subtle shrink-0 backdrop-blur-md bg-plan-surface-1/60 absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-2">
          {tripLabel ? (
            <>
              <span
                className="text-sm font-semibold text-plan-text-primary truncate max-w-[200px]"
                title={tripData.summary}
              >
                {tripLabel}
              </span>
              {(() => {
                const days = tripData?.cities?.reduce((s, c) => s + (c.day_count ?? 0), 0)
                  || tripData?.days?.length
                return days ? (
                  <span className="text-[10px] px-2 py-0.5 bg-plan-surface-2 border border-plan-primary text-plan-primary font-semibold rounded-full shadow-sm">
                    {days} days
                  </span>
                ) : null
              })()}
            </>
          ) : destination ? (
            <span className="text-sm font-semibold text-plan-text-primary truncate max-w-[200px]">
              {destination}
            </span>
          ) : (
            <span className="text-sm text-plan-text-secondary">Your trip</span>
          )}
        </div>

        {/* Dark/light toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-1.5 text-[10px] text-[#8A7A72] hover:text-[#F0ECE8] transition-colors px-2 py-1 rounded-lg border border-[#1E1B25] hover:border-rose-gold/30"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          <span>{darkMode ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Map — flex-1 so it fills remaining space above discovery */}
      <div className="flex-1 min-h-0 relative pt-12">
        <div className="vignette-overlay z-10 pointer-events-none"></div>
        {/* Height passed inline because Leaflet needs an explicit pixel height */}
        <div style={{ height: '100%' }}>
          <TripMap darkMode={darkMode} />
        </div>
      </div>

      {/* Discovery section */}
      <div className="shrink-0 border-t border-plan-border-subtle bg-plan-surface-1/50 backdrop-blur-sm z-20 relative" style={{ maxHeight: '250px' }}>
        <div className="flex items-center gap-1 px-4 pt-3 pb-1">
          <span className="text-xs font-medium text-plan-text-primary mr-2">Discover hidden gems</span>
          {DISC_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setDiscTab(t)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                discTab === t
                  ? 'bg-plan-primary border-plan-primary text-plan-bg-base font-semibold shadow-sm'
                  : 'bg-plan-surface-2 border-plan-border-subtle text-plan-text-secondary hover:border-plan-primary-hover hover:text-plan-text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex gap-3 overflow-x-auto plan-scroll px-4 pb-4 pt-2">
          {!hasGems && trendingLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 w-36 h-48 bg-plan-surface-2 border border-plan-border-subtle rounded-2xl p-3 animate-pulse"
                >
                  <div className="w-6 h-6 rounded bg-plan-border-subtle mb-2" />
                  <div className="h-2.5 w-24 rounded bg-plan-border-subtle mb-1.5" />
                  <div className="h-2 w-16 rounded bg-plan-border-subtle mb-2" />
                  <div className="h-3 w-12 rounded-full bg-plan-border-subtle mt-auto" />
                </div>
              ))
            : displayItems.map((item, i) =>
                hasGems
                  ? <HiddenGemCard key={i} gem={item} />
                  : <DiscoveryCard key={i} item={item} />
              )
          }
        </div>
      </div>

    </div>
  )
}
