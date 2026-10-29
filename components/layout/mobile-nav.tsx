'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Logo, NavGroups, Profile, TeamStrip, WorkspaceNote } from '@/components/layout/sidebar-parts'
import type { DemoUser } from '@/types/dashboard'

export function MobileNav({ user, scopeLabel }: { user: DemoUser, scopeLabel: string }) {
  const [open, setOpen] = useState(false)
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger aria-label="Open navigation" className="flex size-9 items-center justify-center rounded-xl bg-forest text-white shadow-sm lg:hidden"><Menu className="size-4" /></SheetTrigger>
    <SheetContent side="left" className="w-[280px] gap-0 border-0 bg-forest p-0 text-white">
      <SheetTitle className="sr-only">Navigation</SheetTitle>
      <div className="shrink-0 px-6 pt-5 pb-4"><Logo /></div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <Profile user={user} />
        <nav aria-label="Main" className="mt-5"><NavGroups role={user.role} collapsed={false} tab={false} onNavigate={() => setOpen(false)} /></nav>
      </div>
      <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 px-4 pt-3 pb-4"><TeamStrip user={user} /><WorkspaceNote scopeLabel={scopeLabel} /></div>
    </SheetContent>
  </Sheet>
}
