import { todayLocal } from '../lib/utils'

// Calendar-nav strip: prev/next step by whatever the active view's
// granularity is (a day, a week, or a month — App owns that logic via
// `onStep`), a direct date jump, and a Today shortcut. The old grid/list
// toggle is gone — the calendar view itself (Day/Week/Month, topbar) IS the
// layout now, there's nothing left to switch between here.
function FilterBar({ date, onDateChange, onStep, resultCount }) {
  const isToday = date === todayLocal()

  return (
    <div className="controlbar">
      <div className="datenav">
        <button
          type="button"
          className="datenav-btn"
          onClick={() => onStep(-1)}
          aria-label="Previous"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="m14 6-6 6 6 6" />
          </svg>
        </button>

        <input
          type="date"
          className="datenav-input"
          aria-label="Selected date"
          value={date}
          onChange={e => onDateChange(e.target.value)}
        />

        <button
          type="button"
          className="datenav-btn"
          onClick={() => onStep(1)}
          aria-label="Next"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="m10 6 6 6-6 6" />
          </svg>
        </button>

        {!isToday && (
          <button type="button" className="datenav-today" onClick={() => onDateChange(todayLocal())}>
            Today
          </button>
        )}
      </div>

      <div className="fb-spacer" />

      <span className="fb-count">{resultCount} report{resultCount !== 1 ? 's' : ''}</span>
    </div>
  )
}

export default FilterBar
