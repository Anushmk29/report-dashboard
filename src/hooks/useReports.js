import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// List query — metadata ONLY. The big html_content_*/report_data_* columns are
// never fetched here; we read has_eng/has_thai flags from the lightweight
// `reports_meta` view instead. This keeps a dashboard load cheap (no multi-MB
// egress, no de-TOASTing large columns on every mount).
//
// We also bound the query SERVER-SIDE by the selected date window and a hard
// safety LIMIT, so the work the DB does does NOT grow with total history — only
// with the size of the window you're looking at. Tier/report-type filtering
// stays client-side (cheap, operates on this already-small result).
const MAX_ROWS = 1000

export function useReports(dateFrom, dateTo) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      let query = supabase
        .from('reports_meta')
        .select('id, run_id, status, report_type, created_at, has_eng, has_thai')
        .order('created_at', { ascending: false })
        .limit(MAX_ROWS)

      // created_at is a timestamp; the filter inputs are YYYY-MM-DD. Bound to the
      // [dateFrom 00:00, dateTo+1day) half-open range so the whole `dateTo` day is
      // included. Coarse prefilter; App still applies the exact client-side filter.
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo)   query = query.lt('created_at', nextDay(dateTo))

      const { data, error } = await query
      if (cancelled) return
      if (error) setError(error.message)
      else { setReports(data ?? []); setError(null) }
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [dateFrom, dateTo])

  return { reports, loading, error }
}

// 'YYYY-MM-DD' -> 'YYYY-MM-DD' of the following day (UTC-safe, no tz drift).
function nextDay(ymd) {
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}
