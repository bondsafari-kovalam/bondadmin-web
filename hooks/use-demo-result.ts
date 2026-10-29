'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** Lets reviewers force each UI state while there is no real API. */
export type DemoState = 'normal' | 'loading' | 'empty' | 'error'

export type DemoResult<T> =
  | { status: 'loading' }
  | { status: 'error', retry: () => void }
  | { status: 'ready', data: T }

const SIMULATED_LATENCY_MS = 350

/**
 * Runs `load` after a short simulated delay, honouring the demo state switcher.
 * `key` lists the inputs; the load re-runs whenever it changes. Swap `load` for a
 * real fetch later — callers only depend on the returned result.
 */
export function useDemoResult<T>(load: (empty: boolean) => T, key: unknown[], demoState: DemoState): DemoResult<T> {
  const [result, setResult] = useState<DemoResult<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const loadRef = useRef(load)
  loadRef.current = load
  const keyString = JSON.stringify(key)

  useEffect(() => {
    setResult({ status: 'loading' })
    if (demoState === 'loading') return
    const timer = setTimeout(() => {
      if (demoState === 'error') setResult({ status: 'error', retry })
      else setResult({ status: 'ready', data: loadRef.current(demoState === 'empty') })
    }, SIMULATED_LATENCY_MS)
    return () => clearTimeout(timer)
  }, [keyString, demoState, attempt, retry])

  return result
}
