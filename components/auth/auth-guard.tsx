'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectAuthStatus } from '@/store/selectors'
import { restoreSession } from '@/store/slices/auth-slice'

export function FullPageSpinner({ label }: { label: string }) {
  return <div role="status" className="flex min-h-screen items-center justify-center bg-mint text-sm text-slate-500">
    <span className="mr-3 size-5 animate-spin rounded-full border-2 border-forest/20 border-t-forest" aria-hidden />{label}
  </div>
}

/** Renders children only for a signed-in user; otherwise sends them to /login. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const status = useAppSelector(selectAuthStatus)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'idle') void dispatch(restoreSession())
    if (status === 'unauthenticated') router.replace(`/login?next=${encodeURIComponent(pathname)}`)
  }, [status, dispatch, router, pathname])

  if (status !== 'authenticated') return <FullPageSpinner label={status === 'unauthenticated' ? 'Redirecting to sign in…' : 'Checking your session…'} />
  return <>{children}</>
}
