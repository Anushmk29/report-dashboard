import { useCountUp } from '../hooks/useCountUp'

// Compact KPI row for the active type + selected day. Deliberately just three
// numbers (no charts) — the day-first flow means "more detail" comes from
// changing the date, not from denser widgets here.
function StatCards({ reports }) {
  const total = reports.length
  const completed = reports.filter(r => r.status === 'done').length
  const pending = total - completed

  const totalDisplay = useCountUp(total)
  const completedDisplay = useCountUp(completed)
  const pendingDisplay = useCountUp(pending)

  return (
    <section className="stat-row">
      <div className="stat-tile">
        <span className="stat-tile-accent" style={{ background: 'var(--accent)' }} />
        <div className="stat-tile-v">{totalDisplay}</div>
        <div className="stat-tile-k">Reports in view</div>
      </div>

      <div className="stat-tile">
        <span className="stat-tile-accent" style={{ background: 'var(--done)' }} />
        <div className="stat-tile-v" style={{ color: 'var(--done)' }}>{completedDisplay}</div>
        <div className="stat-tile-k">Completed</div>
      </div>

      <div className="stat-tile">
        <span className="stat-tile-accent" style={{ background: 'var(--generating)' }} />
        <div className="stat-tile-v" style={{ color: pending > 0 ? 'var(--generating)' : undefined }}>{pendingDisplay}</div>
        <div className="stat-tile-k">Pending</div>
      </div>
    </section>
  )
}

export default StatCards
