'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { KeyRound, Lock, Plus, Unplug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { PlatformIcon } from '@/components/inbox/platform-icon'
import { cardClass } from '@/components/shared/card-styles'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { NoticeBanner } from '@/components/shared/feedback'
import { FormSelect } from '@/components/shared/form-controls'
import { Field } from '@/components/shared/form-field'
import { LoadingState } from '@/components/shared/section-card'
import { useSocialChannels } from '@/hooks/use-social-inbox'
import { toApiError } from '@/lib/api/errors'
import { platformLabels, socialService, type SocialChannelDto, type SocialPlatform } from '@/services/social.service'
import type { Company } from '@/types/company'

/** Where to find the id and token in Meta's tools, per platform. */
const help: Record<SocialPlatform, { idLabel: string, idHint: string, tokenHint: string }> = {
  FACEBOOK: {
    idLabel: 'Facebook Page ID',
    idHint: 'Facebook Page › About › Page transparency, or Meta Business Suite › Settings.',
    tokenHint: 'A Page access token with pages_messaging permission (a system-user token from Business Settings does not expire).',
  },
  INSTAGRAM: {
    idLabel: 'Instagram account ID',
    idHint: 'The Instagram professional account ID linked to the company’s Facebook Page (Meta Business Suite › Settings › Instagram accounts).',
    tokenHint: 'The access token of the linked Facebook Page, with instagram_manage_messages permission.',
  },
  WHATSAPP: {
    idLabel: 'Phone number ID',
    idHint: 'Meta app dashboard › WhatsApp › API setup. This is the phone number ID, not the phone number itself.',
    tokenHint: 'A system-user access token with whatsapp_business_messaging permission.',
  },
}

/** Connected Facebook Page, Instagram account and WhatsApp numbers of a company. */
export function SocialChannelsCard({ company, canManage }: { company: Company, canManage: boolean }) {
  const channels = useSocialChannels(company.id)
  const [dialog, setDialog] = useState<{ mode: 'connect' } | { mode: 'token', channel: SocialChannelDto } | null>(null)
  const [disconnecting, setDisconnecting] = useState<SocialChannelDto | null>(null)
  const [notice, setNotice] = useState<{ message: string, tone: 'success' | 'error' } | null>(null)

  const disconnect = async (channel: SocialChannelDto) => {
    try {
      await socialService.disconnectChannel(company.id, channel.id)
      channels.setData((list) => list?.filter((c) => c.id !== channel.id) ?? list)
      setNotice({ message: `${channel.displayName} disconnected.`, tone: 'success' })
    } catch (err) {
      setNotice({ message: toApiError(err).message, tone: 'error' })
    }
  }

  const onSaved = (saved: SocialChannelDto, mode: 'connect' | 'token') => {
    channels.setData((list) => (mode === 'connect' ? [...(list ?? []), saved] : list?.map((c) => (c.id === saved.id ? saved : c)) ?? list))
    setNotice({ message: mode === 'connect' ? `${saved.displayName} connected. New messages will appear in the Inbox.` : `Token for ${saved.displayName} updated.`, tone: 'success' })
  }

  return <Card className={cardClass}><CardContent className="flex flex-col gap-4 px-6 py-1">
    <div className="flex items-start justify-between gap-3">
      <div><h2 className="text-[15px] font-semibold text-ink">Social accounts</h2><p className="mt-1 text-xs text-slate-400">Customer messages from these accounts appear in the Inbox tab.</p></div>
      {canManage ? <Button onClick={() => setDialog({ mode: 'connect' })} className="h-9 rounded-full bg-forest px-4 text-xs hover:bg-forest-light"><Plus data-icon="inline-start" />Connect account</Button>
        : <span className="flex items-center gap-1.5 text-xs text-slate-400"><Lock className="size-3.5" />Read-only for your role</span>}
    </div>

    {notice && <NoticeBanner message={notice.message} tone={notice.tone} onDismiss={() => setNotice(null)} />}

    {channels.loading ? <LoadingState minHeight={80} />
      : channels.error ? <p role="alert" className="text-xs text-red-600">{channels.error.message}</p>
      : channels.data?.length === 0 ? <p className="rounded-2xl bg-slate-50/70 px-4 py-5 text-center text-xs text-slate-500">No accounts connected yet.</p>
      : <ul className="divide-y divide-slate-50">
          {channels.data?.map((channel) => <li key={channel.id} className="flex flex-wrap items-center gap-3 py-3">
            <PlatformIcon platform={channel.platform} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700">{channel.displayName}</p>
              <p className="text-[11px] text-slate-400">{platformLabels[channel.platform]} · ID {channel.externalId}</p>
            </div>
            {canManage && <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={() => setDialog({ mode: 'token', channel })}><KeyRound data-icon="inline-start" />Replace token</Button>
              <Button variant="outline" size="sm" className="h-8 rounded-full border-red-200 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDisconnecting(channel)}><Unplug data-icon="inline-start" />Disconnect</Button>
            </div>}
          </li>)}
        </ul>}

    <ChannelDialog company={company} state={dialog} onClose={() => setDialog(null)} onSaved={onSaved} />
    <ConfirmDialog open={disconnecting !== null} onOpenChange={(open) => !open && setDisconnecting(null)} destructive confirmLabel="Disconnect"
      title={`Disconnect ${disconnecting?.displayName ?? ''}?`}
      description="New messages from this account will stop arriving, and its conversation history in Bond Central will be deleted. Messages stay in the Meta apps."
      onConfirm={() => { if (disconnecting) void disconnect(disconnecting) }} />
  </CardContent></Card>
}

interface ChannelDialogProps {
  company: Company
  state: { mode: 'connect' } | { mode: 'token', channel: SocialChannelDto } | null
  onClose: () => void
  onSaved: (channel: SocialChannelDto, mode: 'connect' | 'token') => void
}

function ChannelDialog({ company, state, onClose, onSaved }: ChannelDialogProps) {
  const [platform, setPlatform] = useState<SocialPlatform>('WHATSAPP')
  const [externalId, setExternalId] = useState('')
  const [token, setToken] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const open = state !== null
  const replacing = state?.mode === 'token' ? state.channel : null
  const info = help[replacing?.platform ?? platform]

  useEffect(() => {
    if (!open) return
    setPlatform('WHATSAPP'); setExternalId(''); setToken(''); setErrors({}); setFormError(null)
  }, [open])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!replacing && !/^\d{5,30}$/.test(externalId.trim())) next.externalId = 'Enter the numeric ID from Meta.'
    if (token.trim().length < 20) next.accessToken = 'Paste the full access token.'
    setErrors(next)
    setFormError(null)
    if (Object.keys(next).length) return
    setSubmitting(true)
    try {
      const saved = replacing
        ? await socialService.replaceToken(company.id, replacing.id, token.trim())
        : await socialService.connectChannel(company.id, { platform, externalId: externalId.trim(), accessToken: token.trim() })
      onSaved(saved, replacing ? 'token' : 'connect')
      onClose()
    } catch (err) {
      const apiError = toApiError(err)
      if (apiError.fieldErrors) setErrors(apiError.fieldErrors)
      setFormError(apiError.fieldErrors ? null : apiError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
    <DialogContent className="max-w-lg gap-0 overflow-hidden bg-white p-0">
      <form onSubmit={(e) => void submit(e)} noValidate className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="shrink-0 border-b border-slate-100 py-5 pr-14 pl-6">
          <DialogTitle className="text-lg font-semibold text-ink">{replacing ? `Replace token for ${replacing.displayName}` : 'Connect a social account'}</DialogTitle>
          <DialogDescription className="mt-1 text-xs text-slate-500">The details are checked with Meta before saving. The token is stored encrypted and never shown again.</DialogDescription>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          {!replacing && <>
            <Field id="channel-platform" label="Platform" required>
              <FormSelect id="channel-platform" items={platformLabels} value={platform} onChange={setPlatform} />
            </Field>
            <Field id="channel-id" label={info.idLabel} required error={errors.externalId} hint={info.idHint}>
              <Input id="channel-id" value={externalId} onChange={(e) => setExternalId(e.target.value)} inputMode="numeric" placeholder="e.g. 104729381234567"
                aria-invalid={!!errors.externalId} aria-describedby={errors.externalId ? 'channel-id-error' : 'channel-id-hint'} className="h-10 rounded-xl" />
            </Field>
          </>}
          <Field id="channel-token" label="Access token" required error={errors.accessToken} hint={info.tokenHint}>
            <Input id="channel-token" type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" spellCheck={false} placeholder="EAAG…"
              aria-invalid={!!errors.accessToken} aria-describedby={errors.accessToken ? 'channel-token-error' : 'channel-token-hint'} className="h-10 rounded-xl font-mono" />
          </Field>
          {formError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="outline" disabled={submitting} className="ml-auto h-10 rounded-full px-5 text-xs" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting} className="h-10 rounded-full bg-forest px-5 text-xs hover:bg-forest-light">{submitting ? 'Checking with Meta…' : replacing ? 'Save token' : 'Connect'}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
}
