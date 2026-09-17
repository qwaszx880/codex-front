import { useEffect, useRef } from 'react'

/** Re-run a request without overlapping calls. Pauses in background tabs. */
export function usePolling(callback: () => Promise<unknown>, enabled = true, delay = 4000) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    const poll = async () => {
      if (document.visibilityState === 'visible') await callbackRef.current()
      if (!stopped) timer = setTimeout(poll, delay)
    }
    timer = setTimeout(poll, delay)
    return () => { stopped = true; clearTimeout(timer) }
  }, [enabled, delay])
}
