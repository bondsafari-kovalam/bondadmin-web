'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, CheckCheck, CircleAlert, Clock, Inbox, Paperclip, Plug, RotateCw, SendHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PlatformIcon } from '@/components/inbox/platform-icon'
import { cardClass } from '@/components/shared/card-styles'
import { SearchInput, SegmentedControl } from '@/components/shared/form-controls'
import { textareaClass } from '@/components/shared/form-field'
import { LoadingState } from '@/components/shared/section-card'
import { useConversationMessages, useConversations, useSocialChannels } from '@/hooks/use-social-inbox'
import { toApiError } from '@/lib/api/errors'
import { dateTime, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { platformLabels, socialService, type SocialConversationDto, type SocialMessageDto, type SocialPlatform } from '@/services/social.service'
import type { Company } from '@/types/company'

type PlatformFilter = 'all' | SocialPlatform

const platformOptions: { value: PlatformFilter, label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK', label: 'Facebook' },
]

const nameOf = (c: SocialConversationDto) => c.participantName ?? (c.channel.platform === 'WHATSAPP' ? `+${c.participantId}` : 'Customer')
const initialsOf = (name: string) => name.replace(/[^\p{L}\p{N} ]/gu, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'

interface InboxViewProps {
  company: Company
  canReply: boolean
  /** Link to the page where accounts are connected, shown when none are; omit if the user can't connect. */
  settingsHref?: string
}

/** Facebook, Instagram and WhatsApp conversations of one company, with replies. */
export function InboxView({ company, canReply, settingsHref }: InboxViewProps) {
  const channels = useSocialChannels(company.id)
  const [platform, setPlatform] = useState<PlatformFilter>('all')
  const [search, setSearch] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const filters = useMemo(() => ({ platform: platform === 'all' ? undefined : platform, search, unread: unreadOnly }), [platform, search, unreadOnly])
  const conversations = useConversations(company.id, filters)
  const selected = conversations.data?.find((c) => c.id === selectedId) ?? null

  // Opening a conversation marks it read, here and on the server.
  const setConversations = conversations.setData
  useEffect(() => {
    if (!selected || selected.unreadCount === 0) return
    setConversations((list) => list?.map((c) => (c.id === selected.id ? { ...c, unreadCount: 0 } : c)) ?? list)
    socialService.markRead(company.id, selected.id).catch(() => {})
  }, [selected, company.id, setConversations])

  if (channels.loading) return <Card className={cn(cardClass, 'p-6')}><LoadingState minHeight={420} /></Card>
  if (channels.data?.length === 0) return <NoChannels settingsHref={settingsHref} />

  const updateConversation = (id: string, patch: Partial<SocialConversationDto>) =>
    setConversations((list) => list?.map((c) => (c.id === id ? { ...c, ...patch } : c)) ?? list)

  return <Card className={cn(cardClass, 'grid h-[calc(100dvh-220px)] min-h-130 grid-cols-1 gap-0 overflow-hidden p-0 md:grid-cols-[340px_1fr]')}>
    <section aria-label="Conversations" className={cn('flex min-h-0 flex-col border-slate-100 md:border-r', selected && 'hidden md:flex')}>
      <div className="flex flex-col gap-2.5 border-b border-slate-100 p-3">
        <SearchInput value={search} onChange={setSearch} size="sm" label="Search conversations" placeholder="Search name, number or message" />
        <div className="flex items-center justify-between gap-2">
          <div className="overflow-x-auto [scrollbar-width:none]"><SegmentedControl label="Platform" options={platformOptions} value={platform} onChange={setPlatform} tone="white" /></div>
          <button type="button" aria-pressed={unreadOnly} onClick={() => setUnreadOnly((v) => !v)}
            className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium', unreadOnly ? 'bg-forest text-white' : 'bg-slate-100 text-slate-500 hover:text-ink')}>Unread</button>
        </div>
      </div>
      <ConversationList
        conversations={conversations.data}
        loading={conversations.loading}
        failed={conversations.error !== null}
        onRetry={conversations.reload}
        filtered={platform !== 'all' || search.trim() !== '' || unreadOnly}
        selectedId={selectedId}
        onSelect={setSelectedId} />
    </section>

    <section aria-label="Messages" className={cn('min-h-0 flex-col bg-slate-50/50', selected ? 'flex' : 'hidden md:flex')}>
      {selected
        ? <Thread key={selected.id} company={company} conversation={selected} canReply={canReply} onBack={() => setSelectedId(null)}
            onSent={(message) => updateConversation(selected.id, { lastMessageAt: message.sentAt, lastMessageText: message.text })} />
        : <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm"><Inbox className="size-5" /></span>
            <p className="text-sm font-medium text-slate-600">Select a conversation</p>
            <p className="max-w-xs text-xs text-slate-400">Connected: {channels.data?.map((c) => `${platformLabels[c.platform]} (${c.displayName})`).join(', ')}</p>
          </div>}
    </section>
  </Card>
}

function NoChannels({ settingsHref }: { settingsHref?: string }) {
  return <Card className={cn(cardClass, 'flex flex-col items-center gap-2 px-6 py-14 text-center')}>
    <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Plug className="size-5" /></span>
    <h2 className="text-lg font-semibold text-ink">No accounts connected</h2>
    <p className="max-w-md text-sm text-slate-500">Connect this company’s Facebook Page, Instagram account or WhatsApp number to see and reply to customer messages here.</p>
    {settingsHref
      ? <Button className="mt-2 h-10 rounded-full bg-forest px-5 text-xs hover:bg-forest-light" nativeButton={false} render={<Link href={settingsHref} />}>Connect accounts</Button>
      : <p className="mt-1 text-xs text-slate-400">Ask a company admin to connect them.</p>}
  </Card>
}

interface ConversationListProps {
  conversations: SocialConversationDto[] | null
  loading: boolean
  failed: boolean
  onRetry: () => void
  filtered: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}

function ConversationList({ conversations, loading, failed, onRetry, filtered, selectedId, onSelect }: ConversationListProps) {
  const now = new Date()
  if (loading && !conversations) return <div className="p-4"><LoadingState minHeight={240} /></div>
  if (failed && !conversations) return <div role="alert" className="flex flex-col items-center gap-2 p-8 text-center">
    <p className="text-xs text-slate-600">Couldn’t load conversations.</p>
    <Button variant="outline" size="sm" className="h-8 rounded-full px-3.5 text-xs" onClick={onRetry}><RotateCw data-icon="inline-start" />Try again</Button>
  </div>
  if (!conversations?.length) return <p className="p-8 text-center text-xs text-slate-400">{filtered ? 'No conversations match these filters.' : 'No messages yet. New messages appear here automatically.'}</p>

  return <ul className="min-h-0 flex-1 overflow-y-auto">
    {conversations.map((c) => {
      const name = nameOf(c)
      const active = c.id === selectedId
      return <li key={c.id}>
        <button type="button" onClick={() => onSelect(c.id)} aria-current={active || undefined}
          className={cn('flex w-full items-start gap-3 border-b border-slate-50 px-3 py-3 text-left transition-colors', active ? 'bg-gold-soft/60' : 'hover:bg-slate-50')}>
          <div className="relative">
            <Avatar className="size-10"><AvatarFallback className="bg-forest/10 text-xs font-semibold text-forest">{initialsOf(name)}</AvatarFallback></Avatar>
            <PlatformIcon platform={c.channel.platform} size="xs" className="absolute -right-0.5 -bottom-0.5 ring-2 ring-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className={cn('truncate text-sm', c.unreadCount ? 'font-semibold text-ink' : 'font-medium text-slate-700')}>{name}</span>
              <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(new Date(c.lastMessageAt), now)}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <span className={cn('truncate text-xs', c.unreadCount ? 'text-slate-700' : 'text-slate-400')}>{c.lastMessageText || '—'}</span>
              {c.unreadCount > 0 && <span className="shrink-0 rounded-full bg-sea px-1.5 text-[10px] font-semibold text-white">{c.unreadCount}</span>}
            </div>
            <span className="mt-0.5 block truncate text-[10px] text-slate-400">{c.channel.displayName}</span>
          </div>
        </button>
      </li>
    })}
  </ul>
}

interface ThreadProps {
  company: Company
  conversation: SocialConversationDto
  canReply: boolean
  onBack: () => void
  onSent: (message: SocialMessageDto) => void
}

function Thread({ company, conversation, canReply, onBack, onSent }: ThreadProps) {
  const messages = useConversationMessages(company.id, conversation.id)
  const endRef = useRef<HTMLDivElement>(null)
  const name = nameOf(conversation)
  const count = messages.data?.length ?? 0

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [count])

  return <>
    <header className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
      <button type="button" onClick={onBack} aria-label="Back to conversations" className="-ml-1 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"><ArrowLeft className="size-4" /></button>
      <PlatformIcon platform={conversation.channel.platform} size="md" />
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-ink">{name}</h2>
        <p className="truncate text-[11px] text-slate-400">
          {conversation.channel.platform === 'WHATSAPP' ? `+${conversation.participantId} · ` : ''}via {conversation.channel.displayName}
        </p>
      </div>
    </header>

    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      {messages.loading && !messages.data ? <LoadingState minHeight={200} />
        : messages.error && !messages.data ? <p role="alert" className="text-center text-xs text-slate-500">Couldn’t load messages. <button type="button" className="font-medium text-forest underline" onClick={messages.reload}>Try again</button></p>
        : <ol className="flex flex-col gap-2.5">{messages.data?.map((m) => <MessageBubble key={m.id} message={m} />)}</ol>}
      <div ref={endRef} />
    </div>

    {canReply
      ? <ReplyBox company={company} conversation={conversation}
          onSent={(message) => { messages.setData((list) => (list?.some((m) => m.id === message.id) ? list : [...(list ?? []), message])); onSent(message) }} />
      : <p className="border-t border-slate-100 bg-white px-4 py-3 text-center text-xs text-slate-400">Your role can read these messages but not reply.</p>}
  </>
}

function MessageBubble({ message }: { message: SocialMessageDto }) {
  const outbound = message.direction === 'OUTBOUND'
  const failed = message.status === 'FAILED'
  return <li className={cn('flex max-w-[80%] flex-col gap-1', outbound ? 'items-end self-end' : 'items-start self-start')}>
    <div className={cn('rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap wrap-break-word', outbound ? 'rounded-br-md bg-forest text-white' : 'rounded-bl-md bg-white text-slate-700 shadow-sm ring-1 ring-slate-100', failed && 'bg-red-50 text-red-800 ring-1 ring-red-200')}>
      {message.attachmentType && <span className={cn('flex items-center gap-1.5 text-xs', outbound && !failed ? 'text-white/80' : 'text-slate-500', message.text && 'mb-1')}>
        <Paperclip className="size-3.5" />{message.attachmentType[0]?.toUpperCase()}{message.attachmentType.slice(1).replace(/_/g, ' ')} · view it in the app
      </span>}
      {message.text}
    </div>
    <span className="flex items-center gap-1 px-1 text-[10px] text-slate-400">
      {outbound && message.sentBy && <>{message.sentBy.name} · </>}
      {dateTime(new Date(message.sentAt), new Date())}
      {outbound && <StatusTick status={message.status} />}
    </span>
    {failed && message.error && <span className="px-1 text-[10px] text-red-600">{message.error}</span>}
  </li>
}

function StatusTick({ status }: { status: SocialMessageDto['status'] }) {
  if (status === 'FAILED') return <CircleAlert aria-label="Not delivered" className="size-3 text-red-500" />
  if (status === 'READ') return <CheckCheck aria-label="Read" className="size-3 text-sea" />
  if (status === 'DELIVERED') return <CheckCheck aria-label="Delivered" className="size-3" />
  return <Check aria-label="Sent" className="size-3" />
}

function ReplyBox({ company, conversation, onSent }: { company: Company, conversation: SocialConversationDto, onSent: (message: SocialMessageDto) => void }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!conversation.canReply) return <div className="flex items-start gap-2 border-t border-slate-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
    <Clock className="mt-0.5 size-3.5 shrink-0" />
    <span>The 24-hour reply window has closed. Meta only allows replies within 24 hours of the customer’s last message, so you can reply again after they send a new one.</span>
  </div>

  const send = async () => {
    const value = text.trim()
    if (!value || sending) return
    setSending(true)
    setError(null)
    try {
      onSent(await socialService.reply(company.id, conversation.id, value))
      setText('')
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setSending(false)
    }
  }

  // Enter sends; Shift+Enter adds a line break.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send() }
  }

  const windowEnd = conversation.replyWindowEndsAt ? new Date(conversation.replyWindowEndsAt) : null
  const hoursLeft = windowEnd ? (windowEnd.getTime() - Date.now()) / 3_600_000 : null

  return <div className="border-t border-slate-100 bg-white px-3 py-3">
    {error && <p role="alert" className="mb-2 flex items-center gap-1.5 text-xs text-red-600"><CircleAlert className="size-3.5 shrink-0" />{error}</p>}
    <div className="flex items-end gap-2">
      <label htmlFor="reply" className="sr-only">Reply to {nameOf(conversation)}</label>
      <textarea id="reply" rows={1} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown} placeholder="Type a reply…"
        className={cn(textareaClass, 'max-h-36 min-h-10 resize-none field-sizing-content')} />
      <Button onClick={() => void send()} disabled={!text.trim() || sending} aria-label="Send reply" className="size-10 shrink-0 rounded-full bg-forest p-0 hover:bg-forest-light">
        <SendHorizontal className="size-4" />
      </Button>
    </div>
    {hoursLeft !== null && hoursLeft < 3 && <p className="mt-1.5 text-[10px] text-amber-700">Reply window closes in {hoursLeft < 1 ? `${Math.max(1, Math.round(hoursLeft * 60))} min` : `${Math.round(hoursLeft)} h`}.</p>}
  </div>
}
