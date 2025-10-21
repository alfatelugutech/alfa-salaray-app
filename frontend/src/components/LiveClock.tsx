import React, { useState, useEffect } from 'react'

const LiveClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="text-lg">🕐</span>
      <span className="font-mono font-medium">
        {currentTime.toLocaleTimeString()}
      </span>
      <span className="text-xs text-gray-500">
        {currentTime.toLocaleDateString()}
      </span>
    </div>
  )
}

export default LiveClock
