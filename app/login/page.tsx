'use client'

import { Suspense, useEffect, useState, type FormEvent } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { FullPageSpinner } from '@/components/auth/auth-guard'
import { Field } from '@/components/shared/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login, restoreSession } from '@/store/slices/auth-slice'

/** Only allow same-site paths so `?next=` cannot redirect off the admin. */
function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

function LoginForm() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const next = safeNext(useSearchParams().get('next'))
  const { status, error } = useAppSelector((s) => s.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'idle') void dispatch(restoreSession())
    if (status === 'authenticated') router.replace(next)
  }, [status, dispatch, router, next])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await dispatch(login({ email: email.trim(), password }))
    setSubmitting(false)
  }

  if (status === 'idle' || status === 'checking' || status === 'authenticated') return <FullPageSpinner label="Checking your session…" />

  return <main className="flex min-h-screen items-center justify-center bg-mint px-4 py-10 text-ink">
    <div className="w-full max-w-sm">
      <div className="mb-6 flex justify-center rounded-3xl bg-forest py-6">
        <Image src="/brand/bond-logo.png" alt="Bond" width={640} height={368} priority className="h-16 w-auto" />
      </div>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1 text-xs text-slate-500">Bond Central Admin</p>
        </div>
        <Field id="login-email" label="Email" required>
          <Input id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-xl text-sm" required />
        </Field>
        <Field id="login-password" label="Password" required>
          <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 rounded-xl text-sm" required />
        </Field>
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error.message}</p>}
        <Button type="submit" disabled={submitting || !email.trim() || !password} className="h-10 rounded-full bg-forest text-xs hover:bg-forest-light">
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  </main>
}

export default function LoginPage() {
  return <Suspense fallback={<FullPageSpinner label="Loading…" />}><LoginForm /></Suspense>
}
