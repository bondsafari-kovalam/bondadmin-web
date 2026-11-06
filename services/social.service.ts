import { apiClient } from '@/lib/api/client'
import type { ApiEnvelope, ApiPage } from '@/lib/api/types'

// ---- API shapes (backend `SocialChannel` / `SocialConversation` / `SocialMessage`) ----

export type SocialPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP'

export interface SocialChannelDto {
  id: string
  companyId: string
  platform: SocialPlatform
  /** Page id, Instagram account id or WhatsApp phone number id. */
  externalId: string
  displayName: string
  createdAt: string
  updatedAt: string
}

export interface SocialConversationDto {
  id: string
  companyId: string
  channel: { id: string, platform: SocialPlatform, displayName: string }
  participantId: string
  participantName: string | null
  lastMessageAt: string
  lastMessageText: string
  unreadCount: number
  /** Meta allows free-form replies until 24 hours after the customer's last message. */
  replyWindowEndsAt: string | null
  canReply: boolean
}

export type SocialMessageStatus = 'RECEIVED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

export interface SocialMessageDto {
  id: string
  conversationId: string
  direction: 'INBOUND' | 'OUTBOUND'
  text: string
  /** image, video, audio, sticker, … for non-text messages. */
  attachmentType: string | null
  status: SocialMessageStatus
  error: string | null
  /** Admin who replied from Bond Central; null for customer messages and replies sent from the Meta apps. */
  sentBy: { id: string, name: string } | null
  sentAt: string
}

export interface ConversationFilters {
  platform?: SocialPlatform
  search?: string
  unread?: boolean
}

export const platformLabels: Record<SocialPlatform, string> = { FACEBOOK: 'Facebook', INSTAGRAM: 'Instagram', WHATSAPP: 'WhatsApp' }

const base = (companyId: string) => `/companies/${encodeURIComponent(companyId)}/social`

export const socialService = {
  async listChannels(companyId: string) {
    const res = await apiClient.get<ApiEnvelope<SocialChannelDto[]>>(`${base(companyId)}/channels`)
    return res.data.data
  },

  async connectChannel(companyId: string, payload: { platform: SocialPlatform, externalId: string, accessToken: string }) {
    const res = await apiClient.post<ApiEnvelope<SocialChannelDto>>(`${base(companyId)}/channels`, payload)
    return res.data.data
  },

  async replaceToken(companyId: string, channelId: string, accessToken: string) {
    const res = await apiClient.patch<ApiEnvelope<SocialChannelDto>>(`${base(companyId)}/channels/${channelId}`, { accessToken })
    return res.data.data
  },

  async disconnectChannel(companyId: string, channelId: string) {
    await apiClient.delete(`${base(companyId)}/channels/${channelId}`)
  },

  async listConversations(companyId: string, filters: ConversationFilters) {
    const params = {
      pageSize: 100,
      ...(filters.platform ? { platform: filters.platform } : {}),
      ...(filters.search?.trim() ? { search: filters.search.trim() } : {}),
      ...(filters.unread ? { unread: 'true' } : {}),
    }
    const res = await apiClient.get<ApiPage<SocialConversationDto>>(`${base(companyId)}/conversations`, { params })
    return res.data.data
  },

  /** The latest messages, oldest first (ready to render top to bottom). */
  async listMessages(companyId: string, conversationId: string) {
    const res = await apiClient.get<ApiPage<SocialMessageDto>>(`${base(companyId)}/conversations/${conversationId}/messages`, { params: { pageSize: 100 } })
    return [...res.data.data].reverse()
  },

  async markRead(companyId: string, conversationId: string) {
    const res = await apiClient.post<ApiEnvelope<SocialConversationDto>>(`${base(companyId)}/conversations/${conversationId}/read`)
    return res.data.data
  },

  async reply(companyId: string, conversationId: string, text: string) {
    const res = await apiClient.post<ApiEnvelope<SocialMessageDto>>(`${base(companyId)}/conversations/${conversationId}/messages`, { text })
    return res.data.data
  },
}
