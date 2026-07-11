import { useState, useEffect } from 'react'
import { getMonthMatrix, shiftMonth, todayLocal } from '../lib/utils'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Visual month-jump for the sidebar — the client's "just change the date
// filter" flow made concrete as a calendar picker instead of only a
// prev/next stepper. Purely a shortcut for onDateChange; the datenav in the
// controlbar remains the source of truth for the selected date.
function MiniCalendar({ date, onDateChange }) {
  const [viewMonth, setViewMonth] = useState(() => `${date.slice(0, 7)}-01`)

  // Stay in sync if the date changes from elsewhere (datenav arrows, Today).
  useEffect(() => {
    const dm = `${date.slice(0, 7)}-01`
    setViewMonth(prev => (prev === dm ? prev : dm))
  }, [date])

  const { label, weeks } = getMonthMatrix(viewMonth)
  const today = todayLocal()

  return (
    <div className="minical">
      <div className="minical-header">
        <button
          type="button"
          className="minical-nav"
          onClick={() => setViewMonth(shiftMonth(viewMonth, -1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="minical-label">{label}</span>
        <button
          type="button"
          className="minical-nav"
          onClick={() => setViewMonth(shiftMonth(viewMonth, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="minical-weekdays">
        {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
      </div>

      <div className="minical-grid">
        {weeks.flat().map((cell, i) =>
          cell ? (
            <button
              key={cell}
              type="button"
              className={`minical-day${cell === date ? ' is-selected' : ''}${cell === today ? ' is-today' : ''}`}
              onClick={() => onDateChange(cell)}
            >
              {Number(cell.slice(-2))}
            </button>
          ) : (
            <span key={`empty-${i}`} className="minical-day is-empty" />
          ),
        )}
      </div>
    </div>
  )
}

export default MiniCalendar
