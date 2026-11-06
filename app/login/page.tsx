'use client'

import { Suspense, useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, CircleAlert, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { FullPageSpinner } from '@/components/auth/auth-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login, restoreSession } from '@/store/slices/auth-slice'

/** text-base below md stops iOS zooming on focus. The autofill rules keep the browser's pale fill off the dark card. */
const fieldClass = 'h-12 rounded-2xl border-white/15 bg-white/[0.07] pl-11 text-base text-white caret-gold placeholder:text-white/35 hover:border-white/30 focus-visible:border-gold focus-visible:bg-white/10 aria-invalid:border-red-300/70 aria-invalid:ring-red-300/20 md:text-sm autofill:[-webkit-text-fill-color:white] autofill:[transition:background-color_99999s]'
const iconClass = 'pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/50'
const labelClass = 'text-xs font-medium text-white/80'
const fieldErrorClass = 'text-xs text-red-200'

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
  const [attempted, setAttempted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const emailError = attempted && !email.trim() ? 'Enter your email.' : undefined
  const passwordError = attempted && !password ? 'Enter your password.' : undefined

  useEffect(() => {
    if (status === 'idle') void dispatch(restoreSession())
    if (status === 'authenticated') router.replace(next)
  }, [status, dispatch, router, next])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setAttempted(true)
    const missing = !email.trim() ? 'login-email' : !password ? 'login-password' : null
    if (missing) return document.getElementById(missing)?.focus()
    setSubmitting(true)
    await dispatch(login({ email: email.trim(), password }))
    setSubmitting(false)
  }

  const trackCapsLock = (e: KeyboardEvent) => setCapsLock(e.getModifierState('CapsLock'))

  if (status === 'idle' || status === 'checking' || status === 'authenticated') return <FullPageSpinner label="Checking your session…" />

  return <main className="relative isolate flex min-h-dvh flex-col bg-forest-dark text-white">
    {/* Full-bleed, so the card floats over the photo instead of cutting it. The paddler stays left of the card. */}
    <div className="absolute inset-x-0 top-0 -z-20 h-[58%] lg:h-full">
      <Image src="/brand/login-background.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[62%_center] lg:object-right" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-forest-dark to-transparent lg:hidden" />
    </div>
    <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b from-forest-dark/75 to-transparent" />
    <div aria-hidden="true" className="absolute inset-0 -z-10 hidden bg-gradient-to-l from-forest-dark/70 via-forest-dark/15 to-transparent to-60% lg:block" />

    <header className="flex items-center gap-3 p-5 sm:p-8 lg:p-10">
      <Image src="/brand/bond-logo.png" alt="Bond" width={640} height={368} priority className="h-14 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] lg:h-16" />
      <span className="text-[10px] leading-tight font-semibold uppercase tracking-[0.2em] text-white/80 [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">Central<br />Admin</span>
    </header>

    <div className="flex flex-1 items-end justify-center px-4 pb-4 sm:pb-8 lg:items-center lg:justify-end lg:pr-[6vw] lg:pb-24">
      <form onSubmit={submit} noValidate aria-busy={submitting} className="relative flex w-full max-w-[26rem] flex-col gap-5 overflow-hidden rounded-[2rem] bg-forest-dark/75 p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/15 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-3 duration-700 motion-reduce:animate-none sm:p-9">
        <span aria-hidden="true" className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div>
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-white/70">All your companies, in one place.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className={labelClass}>Email</label>
          <div className="relative">
            <Mail aria-hidden="true" className={iconClass} />
            <Input id="login-email" type="email" autoComplete="username" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!emailError} aria-describedby={emailError ? 'login-email-error' : undefined} className={fieldClass} required />
          </div>
          {emailError && <p id="login-email-error" className={fieldErrorClass}>{emailError}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-password" className={labelClass}>Password</label>
          <div className="relative">
            <LockKeyhole aria-hidden="true" className={iconClass} />
            <Input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={trackCapsLock} onKeyUp={trackCapsLock} onBlur={() => setCapsLock(false)}
              aria-invalid={!!passwordError} aria-describedby={passwordError ? 'login-password-error' : undefined} className={`${fieldClass} pr-12`} required />
            <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-pressed={showPassword} aria-label="Show password"
              className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-white/60 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold">
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {passwordError && <p id="login-password-error" className={fieldErrorClass}>{passwordError}</p>}
          {capsLock && <p role="status" className="text-xs text-gold">Caps Lock is on.</p>}
        </div>

        {error && <p role="alert" className="flex items-start gap-2 rounded-2xl bg-red-500/15 px-3.5 py-2.5 text-xs leading-relaxed text-red-100 ring-1 ring-red-300/30"><CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />{error.message}</p>}

        <Button type="submit" disabled={submitting} className="group h-12 rounded-2xl bg-gradient-to-b from-[#e8c15a] to-gold text-sm font-bold text-forest-dark shadow-[0_12px_28px_-12px_rgba(212,164,46,0.9)] transition-[filter,transform] hover:brightness-105 active:scale-[0.99] disabled:opacity-90">
          {submitting
            ? <><LoaderCircle data-icon="inline-start" className="animate-spin" />Signing in…</>
            : <>Sign in<ArrowRight data-icon="inline-end" className="transition-transform group-hover:translate-x-0.5" /></>}
        </Button>

        <p className="text-center text-xs text-white/55">Trouble signing in? Contact your Bond administrator.</p>
      </form>
    </div>
  </main>
}

export default function LoginPage() {
  return <Suspense fallback={<FullPageSpinner label="Loading…" />}><LoginForm /></Suspense>
}
