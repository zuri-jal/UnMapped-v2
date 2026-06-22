import React, { useEffect } from 'react'
import ChatPanel   from '../components/ChatPanel'
import CenterPanel from '../components/CenterPanel'
import RightPanel  from '../components/RightPanel'
import useTripStore from '../store/tripStore'
import { planTrip } from '../services/api'

function nextDeparture() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

function parseQuery(q) {
  const lq = q.toLowerCase()

  const daysMatch    = lq.match(/(\d+)\s*days?/)
  const duration_days = daysMatch ? parseInt(daysMatch[1], 10) : 7

  const budgetDollar = lq.match(/\$\s*(\d[\d,]*)/)
  const budgetWord   = lq.match(/budget\s+(?:of\s+)?(\d[\d,]*)/)
  const budgetMatch  = budgetDollar ?? budgetWord
  const budget_usd   = budgetMatch ? parseFloat(budgetMatch[1].replace(/,/g, '')) : 2000

  const travelersMatch = lq.match(/(\d+)\s*(?:people|persons?|travelers?)/)
  const travelers = travelersMatch ? parseInt(travelersMatch[1], 10) : 1

  const styleKeywords = ['adventure', 'luxury', 'budget', 'cultural', 'beach']
  const travel_style  = styleKeywords.find((s) => lq.includes(s)) ?? 'adventure'

  const fromMatch = q.match(/\bfrom\s+([A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+)?)/i)
  const origin    = fromMatch ? fromMatch[1].trim() : null

  const destMatch   = q.match(/\b(?:in|to|visit|explore)\s+(.+?)(?=\s+from\b|\s+for\b|\s+under\b|\s+with\b|\s+budget\b|\s*$)/i)
  const destination = destMatch ? destMatch[1].trim() : null

  return {
    user_message: q,
    destination,
    origin,
    duration_days,
    budget_usd,
    travelers,
    travel_style,
    departure_date: nextDeparture(),
  }
}

export default function Plan() {
  const { pendingQuery, setPendingQuery, setTripData, addMessage, setLoading } = useTripStore()

  useEffect(() => {
    if (!pendingQuery) return
    const query = pendingQuery
    setPendingQuery(null)
    addMessage('user', query)
    setLoading(true)

    planTrip(parseQuery(query)).then(({ data, error }) => {
      if (error) {
        addMessage('assistant', `Sorry, something went wrong: ${error}`)
      } else if (data) {
        setTripData(data)
        addMessage('assistant', data.summary ?? "Here's your trip! Explore the map and panels.")
      }
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0F]">
      <div className="w-60 shrink-0 border-r border-[#1E1B25] flex flex-col overflow-hidden">
        <ChatPanel />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <CenterPanel />
      </div>
      <div className="w-[220px] shrink-0 border-l border-[#1E1B25] flex flex-col overflow-hidden">
        <RightPanel />
      </div>
    </div>
  )
}
