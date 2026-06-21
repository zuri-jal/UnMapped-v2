import React, { useState } from 'react'
import TripMap from './TripMap'
import useTripStore from '../store/tripStore'
import { useTrendingDestinations } from '../hooks/useTrendingDestinations'

const DISC_TABS = ['Trending', 'Food', 'Experiences']

const scoreLabel = (s) => s > 70 ? 'Fernweh' : s > 50 ? 'Wanderlust' : 'Interesting'

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
    <div className="shrink-0 w-40 bg-[#0F0D12] border border-[#1E1B25] rounded-xl p-3 hover:border-rose-gold/30 transition-colors">
      <div className="text-xl mb-2">{item.emoji ?? '🌍'}</div>
      <p className="text-xs font-semibold text-[#F0ECE8] truncate">{item.name ?? item.destination}</p>
      <p className="text-[10px] text-[#8A7A72] mt-0.5 truncate">{item.country ?? item.source ?? ''}</p>
      {item.score != null && (
        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-rose-gold/10 rounded-full">
          <span className="text-[10px] font-semibold text-rose-gold">{item.score}</span>
          <span className="text-[10px] text-[#8A7A72]">· {scoreLabel(item.score)}</span>
        </div>
      )}
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
    <div className="shrink-0 w-40 bg-[#0F0D12] border border-[#1E1B25] rounded-xl p-3 hover:border-rose-gold/30 transition-colors">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-base">{meta.emoji}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1E1B25] text-[#8A7A72] uppercase tracking-wide">
          {meta.label}
        </span>
      </div>
      <p className="text-xs font-semibold text-[#F0ECE8] truncate">{gem.name}</p>
      {gem.description && (
        <p className="text-[10px] text-[#8A7A72] mt-1 line-clamp-2 leading-tight">
          {gem.description}
        </p>
      )}
      {gem.source_quote && (
        <p className="text-[9px] text-[#8A7A72]/70 mt-1.5 italic line-clamp-2 leading-tight">
          &ldquo;{gem.source_quote}&rdquo;
        </p>
      )}
      {gem.source && (
        <p className="text-[8px] text-[#8A7A72]/50 mt-0.5">— via {gem.source}</p>
      )}
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

  const destination = tripData?.days?.[0]?.location
    ?? (typeof tripData?.destination === 'string' ? tripData.destination : '')

  const summaryFirst = tripData?.summary ? tripData.summary.split('.')[0].trim() : null
  const tripLabel = summaryFirst
    ? (summaryFirst.length > 40 ? summaryFirst.slice(0, 40) + '…' : summaryFirst)
    : null

  return (
    <div className="flex flex-col h-full bg-[#0A0A0F]">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1B25] shrink-0">
        <div className="flex items-center gap-2">
          {tripLabel ? (
            <>
              <span
                className="text-sm font-semibold text-[#F0ECE8] truncate max-w-[200px]"
                title={tripData.summary}
              >
                {tripLabel}
              </span>
              {tripData?.days?.length && (
                <span className="text-[10px] px-2 py-0.5 bg-[#0F0D12] border border-[#1E1B25] rounded-full text-[#8A7A72]">
                  {tripData.days.length} days
                </span>
              )}
            </>
          ) : destination ? (
            <span className="text-sm font-semibold text-[#F0ECE8] truncate max-w-[200px]">
              {destination}
            </span>
          ) : (
            <span className="text-sm text-[#8A7A72]">Your trip</span>
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
      <div className="flex-1 min-h-0 relative">
        {/* Height passed inline because Leaflet needs an explicit pixel height */}
        <div style={{ height: '100%' }}>
          <TripMap darkMode={darkMode} />
        </div>
      </div>

      {/* Discovery section */}
      <div className="shrink-0 border-t border-[#1E1B25] bg-[#0A0A0F]" style={{ maxHeight: '220px' }}>
        <div className="flex items-center gap-1 px-4 pt-3 pb-1">
          <span className="text-xs font-medium text-[#F0ECE8] mr-2">Discover hidden gems</span>
          {DISC_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setDiscTab(t)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${
                discTab === t
                  ? 'bg-rose-gold border-rose-gold text-white'
                  : 'border-[#1E1B25] text-[#8A7A72] hover:border-rose-gold/40'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-2 scrollbar-hide">
          {!hasGems && trendingLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 w-40 bg-[#0F0D12] border border-[#1E1B25] rounded-xl p-3 animate-pulse"
                >
                  <div className="w-6 h-6 rounded bg-[#1E1B25] mb-2" />
                  <div className="h-2.5 w-24 rounded bg-[#1E1B25] mb-1.5" />
                  <div className="h-2 w-16 rounded bg-[#1E1B25] mb-2" />
                  <div className="h-3 w-12 rounded-full bg-[#1E1B25]" />
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
