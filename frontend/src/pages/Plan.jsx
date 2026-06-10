import React from 'react'
import ChatPanel from '../components/ChatPanel'
import Dashboard from '../components/Dashboard'
import LoadingState from '../components/LoadingState'
import ConfirmScreen from '../components/ConfirmScreen'
import useTripStore from '../store/tripStore'

// Main planning page — split layout: chat panel left, trip dashboard right
export default function Plan() {
  const { trip, isLoading, isConfirming } = useTripStore()

  // TODO: Add auth guard — redirect to / if user is not logged in (check Supabase session)
  // TODO: Load user's most recent draft trip from Supabase on first mount

  if (isLoading) return <LoadingState />
  if (isConfirming) return <ConfirmScreen />

  return (
    <div className="flex h-screen overflow-hidden bg-warm-white">
      {/* Left panel — chat interface (fixed width) */}
      <div className="w-[420px] min-w-[380px] flex flex-col border-r border-warm-gray shrink-0">
        <ChatPanel />
      </div>

      {/* Right panel — trip dashboard (fills remaining width) */}
      <div className="flex-1 overflow-y-auto">
        {trip ? (
          <Dashboard />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-4xl mb-4">✈️</p>
              <p className="text-lg font-medium text-gray-600">Your trip will appear here</p>
              <p className="text-sm mt-1">Start chatting to plan your adventure</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
