import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Detail query — fetches the heavy HTML for a SINGLE report, lazily, only when
// a card is opened. This is the other half of the over-fetch fix: the multi-MB
// payload is pulled once per click instead of for every row on every load.
export function useReportContent(id) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setContent(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    // Fetch ONLY the columns the viewer renders. `select('*')` also dragged down
    // PRE_computed_Data (another large precompute blob) on every click — pure
    // waste, since the viewer never reads it. We keep BOTH languages so tab
    // switching stays instant (no refetch).
    //
    // DEPLOY ORDER: requires report_data_eng/thai to exist — run
    // sql/phase2_report_data.sql before shipping this. After Phase C drops
    // html_content_*, remove those two names from the select below.
    supabase
      .from('reports')
      .select('id, report_data_eng, report_data_thai, html_content_eng, html_content_thai')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setContent(data)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [id])

  return { content, loading, error }
}
