import { useState, useMemo } from 'react'
import { useReports } from './hooks/useReports'
import { useReportContent } from './hooks/useReportContent'
import Sidebar from './components/Sidebar'
import FilterBar from './components/FilterBar'
import StatCards from './components/StatCards'
import CalendarBoard from './components/CalendarBoard'
import ReportViewer from './components/ReportViewer'
import {
  extractTier, bucketKey, todayLocal, shiftDate, shiftMonth,
  getWeekDates, getMonthRange, formatRangeLabel,
} from './lib/utils'
import './index.css'

const TYPES = [
  { key: '',        label: 'All Types', colorClass: 'col-all' },
  { key: 'daily',   label: 'Daily',     colorClass: 'col-daily' },
  { key: 'weekly',  label: 'Weekly',    colorClass: 'col-weekly' },
  { key: 'monthly', label: 'Monthly',   colorClass: 'col-monthly' },
  { key: 'main',    label: 'Main',      colorClass: 'col-main' },
]

const TIERS = [
  { key: 'all',     label: 'All Tiers', colorClass: 'col-all' },
  { key: 'Tier 1',  label: 'Tier 1',    colorClass: 'col-tier1' },
  { key: 'Tier 2',  label: 'Tier 2',    colorClass: 'col-tier2' },
  { key: 'Tier 3',  label: 'Tier 3',    colorClass: 'col-tier3' },
]

const VIEWS = [
  { key: 'day',   label: 'Day' },
  { key: 'week',  label: 'Week' },
  { key: 'month', label: 'Month' },
]

function App() {
  // `date` is the anchor; `view` says how much of the calendar around it to
  // show. Report TYPE and TIER are sidebar filters layered on top — Google
  // Calendar's Day/Week/Month owns the topbar toggle now, so those two moved
  // off of it.
  const [date, setDate] = useState(todayLocal())
  const [view, setView] = useState('day')
  const [tier, setTier] = useState('')
  const [reportType, setReportType] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const range = useMemo(() => {
    if (view === 'week') { const wd = getWeekDates(date); return { from: wd[0], to: wd[6] } }
    if (view === 'month') { const { start, end } = getMonthRange(date); return { from: start, to: end } }
    return { from: date, to: date }
  }, [view, date])

  const { reports, loading, error } = useReports(range.from, range.to)

  const filtered = useMemo(() => reports.filter(r => {
    if (tier && extractTier(r.run_id) !== tier) return false
    if (reportType && bucketKey(r) !== reportType) return false
    return true
  }), [reports, tier, reportType])

  // Sidebar counts respect the OTHER axis's filter, so each list answers "how
  // many for what I'm already looking at" rather than "how many ever exist".
  const tierCounts = useMemo(() => {
    const c = { all: 0, 'Tier 1': 0, 'Tier 2': 0, 'Tier 3': 0 }
    for (const r of reports) {
      if (reportType && bucketKey(r) !== reportType) continue
      c.all += 1
      const t = extractTier(r.run_id)
      if (t in c) c[t] += 1
    }
    return c
  }, [reports, reportType])

  const typeCounts = useMemo(() => {
    const c = { '': 0, daily: 0, weekly: 0, monthly: 0, main: 0 }
    for (const r of reports) {
      if (tier && extractTier(r.run_id) !== tier) continue
      c[''] += 1
      c[bucketKey(r)] += 1
    }
    return c
  }, [reports, tier])

  function stepDate(dir) {
    setDate(d => {
      if (view === 'week') return shiftDate(d, dir * 7)
      if (view === 'month') return shiftMonth(d, dir)
      return shiftDate(d, dir)
    })
  }

  function jumpToDate(d) {
    setDate(d)
    setView('day')
  }

  const selected = reports.find(r => r.id === selectedId) ?? null
  const { content, loading: contentLoading } = useReportContent(selectedId)

  return (
    <div className="app-shell">
      <Sidebar
        tiers={TIERS}
        activeTier={tier || 'all'}
        tierCounts={tierCounts}
        onTierSelect={key => setTier(key === 'all' ? '' : key)}
        types={TYPES}
        activeType={reportType}
        typeCounts={typeCounts}
        onTypeSelect={setReportType}
        date={date}
        onDateChange={jumpToDate}
      />

      <div className="main-col">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">{formatRangeLabel(date, view)}</h1>
            <span className="topbar-sub">{filtered.length} report{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="typetoggle">
            {VIEWS.map(v => (
              <button
                key={v.key}
                type="button"
                className={view === v.key ? 'active' : ''}
                aria-pressed={view === v.key}
                onClick={() => setView(v.key)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </header>

        <div className="board-wrap">
          {error && <div className="error-msg">Error: {error}</div>}

          <StatCards reports={filtered} />

          <FilterBar
            date={date}
            onDateChange={setDate}
            onStep={stepDate}
            resultCount={filtered.length}
          />

          {loading ? (
            <div className="cal-single cal-skeleton">
              <div className="cal-rail" />
              <div className="cal-lane">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="card card-skeleton">
                    <div className="sk sk-line" style={{ width: '70%' }} />
                    <div className="sk sk-line" style={{ width: '40%' }} />
                    <div className="sk sk-line" style={{ width: '55%' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <CalendarBoard
              view={view}
              date={date}
              reports={filtered}
              onSelect={setSelectedId}
              onDrillDay={jumpToDate}
            />
          )}
        </div>
      </div>

      {selectedId && selected && (
        <ReportViewer
          report={selected}
          content={content}
          contentLoading={contentLoading}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

export default App
