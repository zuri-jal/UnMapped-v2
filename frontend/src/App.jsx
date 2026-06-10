import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Plan from './pages/Plan'
import Profile from './pages/Profile'

// Root application component — handles top-level routing
export default function App() {
  return (
    <div className="min-h-screen bg-warm-white font-sans">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  )
}
