// Phase 2 renderer: turns a stored RAW report_data payload into a full HTML document
// by (1) normalizing it to the shape the template expects, then (2) injecting it into the
// static template (public/report-template.html) at the REPORT_DATA_PLACEHOLDER, exactly
// the way the n8n inject node used to — but at view time, in the browser. This is what
// lets us store the compact RAW JSON per report instead of the rendered HTML.

import { normalizeReportData } from './normalizeReport'

let _templatePromise = null

// Fetch the template once and cache it (the browser also caches the static file).
function getTemplate() {
  if (!_templatePromise) {
    _templatePromise = fetch(`${import.meta.env.BASE_URL}report-template.html`)
      .then(res => {
        if (!res.ok) throw new Error(`template fetch failed: ${res.status}`)
        return res.text()
      })
      .catch(err => {
        // Don't cache a failed fetch — allow a retry on the next open.
        _templatePromise = null
        throw err
      })
  }
  return _templatePromise
}

// reportData may arrive as a parsed object (jsonb column) or a JSON string (text column).
// Parse to an object so we can normalize it; returns null if it isn't valid JSON.
function toObject(reportData) {
  if (reportData == null) return null
  if (typeof reportData === 'string') {
    try { return JSON.parse(reportData) } catch { return null }
  }
  return reportData
}

// Serialize to a string safe to embed inside a <script> block.
function toSafeJson(obj) {
  return JSON.stringify(obj)
    .replace(/<\/script>/gi, '<\\/script>')
    .replace(/<!--/g, '<\\!--')
}

function metaTitle(obj) {
  const title = obj?.meta?.title || obj?.meta?.report_title || 'Competitor Analysis'
  return String(title).replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function renderReport(reportData) {
  const parsed = toObject(reportData)
  if (!parsed) return ''
  const template = await getTemplate()
  // Normalize a COPY so we never mutate the cached hook state.
  const normalized = normalizeReportData(structuredClone(parsed))
  const safeJson = toSafeJson(normalized)
  const title = metaTitle(normalized)
  // Function replacers avoid `$`-pattern interpretation in the payload.
  return template
    .replace('__REPORT_DATA_JSON__', () => safeJson)
    .replace('__META_TITLE__', () => title)
}
