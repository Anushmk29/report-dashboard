import { useEffect, useRef, useState } from 'react'

// Animates a displayed integer toward `value` over `duration` ms whenever
// `value` changes. Purely cosmetic (stat tiles) — falls back to the exact
// value instantly if the user prefers reduced motion.
export function useCountUp(value, duration = 500) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)

  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setDisplay(value)
      fromRef.current = value
      return
    }

    const from = fromRef.current
    const delta = value - from
    if (delta === 0) return

    let raf
    const start = performance.now()

    function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out-cubic
      setDisplay(Math.round(from + delta * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = value
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return display
}
