import { Camera, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { platformLabels, type SocialPlatform } from '@/services/social.service'

const styles: Record<SocialPlatform, string> = {
  FACEBOOK: 'bg-[#1877f2] text-white',
  INSTAGRAM: 'bg-gradient-to-br from-[#f9a03f] via-[#e1306c] to-[#833ab4] text-white',
  WHATSAPP: 'bg-[#25d366] text-white',
}

/** Small brand-coloured badge for a social platform. */
export function PlatformIcon({ platform, size = 'sm', className }: { platform: SocialPlatform, size?: 'xs' | 'sm' | 'md', className?: string }) {
  const box = size === 'xs' ? 'size-4 rounded-[5px]' : size === 'sm' ? 'size-5 rounded-md' : 'size-9 rounded-xl'
  const icon = size === 'md' ? 'size-4.5' : size === 'sm' ? 'size-3' : 'size-2.5'
  return <span role="img" aria-label={platformLabels[platform]} title={platformLabels[platform]} className={cn('inline-flex shrink-0 items-center justify-center', box, styles[platform], className)}>
    {platform === 'FACEBOOK' ? <span className={cn('font-bold leading-none', size === 'md' ? 'text-base' : size === 'sm' ? 'text-[11px]' : 'text-[9px]')}>f</span>
      : platform === 'INSTAGRAM' ? <Camera className={icon} /> : <MessageCircle className={icon} />}
  </span>
}
