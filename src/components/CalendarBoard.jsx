import ReportCard from './ReportCard'
import { bucketKey, extractTier, formatDate, getMonthMatrix, getWeekDates, todayLocal, weekdayShort } from '../lib/utils'

function groupByDate(reports) {
  const map = {}
  for (const r of reports) {
    const day = String(r.created_at ?? '').slice(0, 10)
    ;(map[day] ??= []).push(r)
  }
  for (const day in map) {
    map[day].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  }
  return map
}

// Compact colour-blocked event, used in the week columns — same idea as the
// reference screenshot's blocks, minus any time-of-day (reports don't carry one).
function EventBlock({ report, onClick, compact }) {
  const type = bucketKey(report)
  const tier = extractTier(report.run_id)
  return (
    <button
      type="button"
      className={`evblock cal-type-${type}${compact ? ' evblock-compact' : ''}`}
      onClick={onClick}
      title={report.run_id}
    >
      <span className="evblock-title">{report.run_id}</span>
      {!compact && <span className="evblock-meta">{tier} · {report.status}</span>}
    </button>
  )
}

// Day view: one lane with a blank rail where an hour axis would be — reports
// don't have a meaningful time-of-day, so the rail stays empty by design.
function DayLane({ date, items, onSelect }) {
  return (
    <div className="cal-single">
      <div className="cal-rail" />
      <div className="cal-lane">
        <div className="cal-lane-date">{formatDate(date)}</div>
        {items.length === 0 ? (
          <div className="report-grid-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" />
            </svg>
            <div className="empty-title">No reports for {formatDate(date)}</div>
            <div>Try a different date, or clear the sidebar filters.</div>
          </div>
        ) : (
          <div className="cal-daylist">
            {items.map((r, i) => (
              <ReportCard key={r.id} report={r} style={{ '--i': i }} onClick={() => onSelect(r.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Week view: 7 side-by-side day columns (Mon-Sun), Google-Calendar-style,
// each stacking that day's reports as compact blocks.
function WeekGrid({ dates, byDate, onSelect }) {
  const today = todayLocal()
  return (
    <div className="cal-week">
      <div className="cal-rail" />
      <div className="cal-week-grid">
        {dates.map(d => {
          const items = byDate[d] ?? []
          return (
            <div key={d} className={`cal-daycol${d === today ? ' is-today' : ''}`}>
              <div className="cal-daycol-head">
                <span className="cal-daycol-dow">{weekdayShort(d)}</span>
                <span className="cal-daycol-num">{Number(d.slice(-2))}</span>
              </div>
              <div className="cal-daycol-body">
                {items.length === 0
                  ? <div className="cal-daycol-empty">—</div>
                  : items.map(r => <EventBlock key={r.id} report={r} compact onClick={() => onSelect(r.id)} />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const MONTH_WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Month view: a horizontal week-row grid, like Google Calendar's month page —
// small chips per day, "+N more" once a cell is full. Clicking a date number
// drills into Day view for that date.
function MonthGrid({ date, byDate, onSelect, onDrill }) {
  const { weeks } = getMonthMatrix(date)
  const today = todayLocal()
  return (
    <div className="cal-month">
      <div className="cal-month-weekdays">
        {MONTH_WEEKDAY_LABELS.map(w => <span key={w}>{w}</span>)}
      </div>
      <div className="cal-month-grid">
        {weeks.flat().map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} className="cal-month-cell is-empty" />
          const items = byDate[cell] ?? []
          const shown = items.slice(0, 3)
          const extra = items.length - shown.length
          return (
            <div
              key={cell}
              className={`cal-month-cell${cell === today ? ' is-today' : ''}`}
              onClick={() => onDrill(cell)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onDrill(cell)}
            >
              <span className="cal-month-cell-num">{Number(cell.slice(-2))}</span>
              <div className="cal-month-cell-items">
                {shown.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    className={`cal-chip cal-type-${bucketKey(r)}`}
                    onClick={e => { e.stopPropagation(); onSelect(r.id) }}
                    title={r.run_id}
                  >
                    {r.run_id}
                  </button>
                ))}
                {extra > 0 && <div className="cal-chip-more">+{extra} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Google-Calendar-style board: Day = one blank-railed lane of full report
// cards, Week = 7 side-by-side day columns of compact blocks, Month = a
// week-row grid of date cells with small chips — GCal's own Day/Week/Month
// layouts, not a literal hour-by-hour grid (reports carry no time-of-day).
function CalendarBoard({ view, date, reports, onSelect, onDrillDay }) {
  const byDate = groupByDate(reports)

  if (view === 'week') return <WeekGrid dates={getWeekDates(date)} byDate={byDate} onSelect={onSelect} />
  if (view === 'month') return <MonthGrid date={date} byDate={byDate} onSelect={onSelect} onDrill={onDrillDay} />
  return <DayLane date={date} items={byDate[date] ?? []} onSelect={onSelect} />
}

export default CalendarBoard
