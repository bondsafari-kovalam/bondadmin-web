'use client'

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { toApiError, type ApiError } from '@/lib/api/errors'
import { socialService, type ConversationFilters, type SocialChannelDto, type SocialConversationDto, type SocialMessageDto } from '@/services/social.service'

/** New messages arrive through Meta webhooks; the inbox polls for them while the tab is visible. */
const CONVERSATIONS_POLL_MS = 10_000
const MESSAGES_POLL_MS = 5_000

interface Polled<T> {
  data: T | null
  error: ApiError | null
  loading: boolean
  reload: () => void
  /** Local update after a write (reply sent, conversation read), until the next poll. */
  setData: Dispatch<SetStateAction<T | null>>
}

/**
 * Loads `load()` whenever `key` changes, then again every `intervalMs` while the page is
 * visible. Responses to superseded requests are dropped. `intervalMs = 0` disables polling.
 */
function usePolled<T>(load: (() => Promise<T>) | null, key: string, intervalMs: number): Polled<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(load !== null)
  const loadRef = useRef(load)
  loadRef.current = load
  const requestRef = useRef(0)

  const run = useCallback(async (initial: boolean) => {
    const fn = loadRef.current
    if (!fn) return
    const request = ++requestRef.current
    if (initial) setLoading(true)
    try {
      const result = await fn()
      if (request !== requestRef.current) return
      setData(result)
      setError(null)
    } catch (err) {
      if (request !== requestRef.current) return
      // A failed background poll keeps the data on screen; only the first load shows the error.
      if (initial) setError(toApiError(err))
    } finally {
      if (request === requestRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    setData(null)
    setError(null)
    if (!loadRef.current) { setLoading(false); return }
    void run(true)
    if (!intervalMs) return
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void run(false) }, intervalMs)
    const onVisible = () => { if (document.visibilityState === 'visible') void run(false) }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); requestRef.current++ }
  }, [key, intervalMs, run])

  const reload = useCallback(() => void run(true), [run])
  return { data, error, loading, reload, setData }
}

export function useSocialChannels(companyId: string) {
  return usePolled<SocialChannelDto[]>(() => socialService.listChannels(companyId), companyId, 0)
}

export function useConversations(companyId: string, filters: ConversationFilters) {
  return usePolled<SocialConversationDto[]>(() => socialService.listConversations(companyId, filters), JSON.stringify([companyId, filters]), CONVERSATIONS_POLL_MS)
}

export function useConversationMessages(companyId: string, conversationId: string | null) {
  return usePolled<SocialMessageDto[]>(conversationId ? () => socialService.listMessages(companyId, conversationId) : null, `${companyId}/${conversationId}`, conversationId ? MESSAGES_POLL_MS : 0)
}
