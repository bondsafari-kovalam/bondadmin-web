'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel: string
  onConfirm: () => void
  destructive?: boolean
}

/** Asks before an action that can't be undone (e.g. delete). */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm, destructive = false }: ConfirmDialogProps) {
  return <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogTitle className="text-ink">{title}</AlertDialogTitle>
      <AlertDialogDescription className="text-slate-500">{description}</AlertDialogDescription>
      <div className="mt-2 flex justify-end gap-2">
        <AlertDialogClose render={<Button variant="outline" className="h-10 rounded-full px-5 text-xs" />}>Cancel</AlertDialogClose>
        <Button onClick={() => { onConfirm(); onOpenChange(false) }}
          className={destructive ? 'h-10 rounded-full bg-red-600 px-5 text-xs text-white hover:bg-red-700' : 'h-10 rounded-full bg-forest px-5 text-xs hover:bg-forest-light'}>{confirmLabel}</Button>
      </div>
    </AlertDialogContent>
  </AlertDialog>
}
