import React, { useState } from 'react'
import useTripStore from '../store/tripStore'
import { planTrip, updateTrip } from '../services/api'

// Text input form at the bottom of the chat panel
export default function InputForm() {
  const [message, setMessage] = useState('')
  const { trip, setLoading, setTrip, addMessage } = useTripStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    const userMessage = message.trim()
    setMessage('')

    // Immediately add the user message to the chat
    addMessage('user', userMessage)
    setLoading(true)

    try {
      // TODO: Get current user_id from Supabase session
      const userId = 'placeholder-user-id'

      if (trip) {
        // Existing trip — send as an update
        const updated = await updateTrip({
          trip_id: trip.trip_id,
          user_id: userId,
          message: userMessage,
        })
        // TODO: Merge updated fields into existing trip via setTrip
        addMessage('assistant', updated.message ?? 'Trip updated!')
      } else {
        // New trip — kick off the planning pipeline
        const newTrip = await planTrip({ user_id: userId, message: userMessage })
        setTrip(newTrip)
        addMessage('assistant', newTrip.message ?? `Here's your trip to ${newTrip.destination}!`)
      }
    } catch (err) {
      // TODO: Distinguish between network errors and API validation errors
      addMessage('assistant', 'Sorry, something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-warm-gray">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={trip ? 'Ask me to change anything…' : 'Where do you want to go?'}
        className="input-field"
        autoFocus
      />
      <button
        type="submit"
        className="btn-primary whitespace-nowrap"
        disabled={!message.trim()}
      >
        Send
      </button>
    </form>
  )
}
