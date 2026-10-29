import { X } from 'lucide-react'
import type { Company } from '@/types/company'

/** Shown when the Overview is narrowed to one company, with a way back to all of them. */
export function CompanyScopeBanner({ company, onClear }: { company: Company, onClear: () => void }) {
  return <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-gold/30 bg-gold-soft/70 px-4 py-2.5 text-xs text-ink">
    <span className="size-2.5 rounded-full" style={{ backgroundColor: company.color }} />Showing <span className="font-semibold">{company.name}</span> only.
    <button type="button" onClick={onClear} className="ml-auto flex items-center gap-1 rounded-full px-2 py-1 font-medium hover:bg-gold-soft"><X className="size-3" />Show all companies</button>
  </div>
}
