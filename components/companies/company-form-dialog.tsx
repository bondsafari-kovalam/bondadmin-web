'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Field, textareaClass } from '@/components/shared/form-field'
import { useCompanies } from '@/components/providers/companies-provider'
import { cn } from '@/lib/utils'
import { validateCompany, type CompanyErrors as Errors } from '@/lib/validation/company'
import { businessTypes, type BusinessType, type Company, type CompanyInput, type CompanyStatus } from '@/types/company'

const emptyInput: CompanyInput = { name: '', code: '', category: '' as BusinessType, status: 'Active', description: '', email: '', phone: '', location: '' }

function toInput(company: Company): CompanyInput {
  return { name: company.name, code: company.code, category: company.category, status: company.status, description: company.description ?? '', email: company.contact.email ?? '', phone: company.contact.phone ?? '', location: company.contact.location ?? '' }
}

const fieldOrder: (keyof CompanyInput)[] = ['name', 'code', 'category', 'status', 'email', 'phone', 'location', 'description']

interface CompanyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Company being edited; null to add a new one. */
  company: Company | null
  /** Whether status and code may be changed (owner only in the demo roles). */
  canManageStatus: boolean
  onSaved: (company: Company, mode: 'added' | 'updated') => void
}

export function CompanyFormDialog({ open, onOpenChange, company, canManageStatus, onSaved }: CompanyFormDialogProps) {
  const { companies, addCompany, updateCompany } = useCompanies()
  const [input, setInput] = useState<CompanyInput>(emptyInput)
  const [errors, setErrors] = useState<Errors>({})
  const formRef = useRef<HTMLFormElement>(null)
  const editing = company !== null
  const lockIdentity = editing && !canManageStatus

  // Load the selected company's current data each time the form opens.
  useEffect(() => {
    if (!open) return
    setInput(company ? toInput(company) : emptyInput)
    setErrors({})
  }, [open, company])

  const set = <K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }))
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found = validateCompany(input, companies.filter((c) => c.id !== company?.id))
    setErrors(found)
    const first = fieldOrder.find((key) => found[key])
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#company-${first}`)?.focus()
      return
    }
    if (company) {
      updateCompany(company.id, input)
      onSaved({ ...company, name: input.name.trim() }, 'updated')
    } else {
      onSaved(addCompany(input), 'added')
    }
    onOpenChange(false)
  }

  const describedBy = (key: keyof CompanyInput, hasHint = false) => (errors[key] ? `company-${key}-error` : hasHint ? `company-${key}-hint` : undefined)
  const textInput = (key: 'name' | 'code' | 'email' | 'phone' | 'location', props: { type?: string, placeholder?: string, disabled?: boolean, hint?: boolean, className?: string, autoComplete?: string } = {}) =>
    <Input id={`company-${key}`} value={input[key]} onChange={(e) => set(key, key === 'code' ? e.target.value.toUpperCase() : e.target.value)} aria-invalid={!!errors[key]} aria-describedby={describedBy(key, props.hint)}
      type={props.type} placeholder={props.placeholder} disabled={props.disabled} autoComplete={props.autoComplete ?? 'off'} className={cn('h-10 rounded-xl text-sm', props.className)} />

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg gap-0 overflow-hidden bg-white p-0">
      <form ref={formRef} onSubmit={submit} noValidate className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="shrink-0 border-b border-slate-100 py-5 pr-14 pl-6">
          <DialogTitle className="text-lg font-semibold text-ink">{editing ? `Edit ${company.name}` : 'Add company'}</DialogTitle>
          <DialogDescription className="mt-1 text-xs text-slate-500">Demo only — changes are kept in this browser session and are not saved to a server.</DialogDescription>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <Field id="company-name" label="Company name" required error={errors.name}>{textInput('name', { placeholder: 'e.g. Reef Divers' })}</Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="company-code" label="Code" required error={errors.code} hint={lockIdentity ? 'Only the owner can change this.' : '2–5 characters, unique.'}>{textInput('code', { placeholder: 'RD', disabled: lockIdentity, hint: true, className: 'uppercase' })}</Field>
            <Field id="company-status" label="Status" required hint={canManageStatus ? undefined : 'Only the owner can change this.'}>
              <Select items={{ Active: 'Active', Inactive: 'Inactive' }} value={input.status} onValueChange={(v) => v && set('status', v as CompanyStatus)} disabled={!canManageStatus}>
                <SelectTrigger id="company-status" aria-describedby={canManageStatus ? undefined : 'company-status-hint'} className="h-10 w-full rounded-xl text-sm data-[size=default]:h-10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </Field>
          </div>
          <Field id="company-category" label="Business type" required error={errors.category}>
            <Select items={Object.fromEntries(businessTypes.map((t) => [t, t]))} value={input.category || null} onValueChange={(v) => v && set('category', v as BusinessType)}>
              <SelectTrigger id="company-category" aria-invalid={!!errors.category} aria-describedby={describedBy('category')} className="h-10 w-full rounded-xl text-sm data-[size=default]:h-10"><SelectValue placeholder="Choose a business type" /></SelectTrigger>
              <SelectContent>{businessTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field id="company-email" label="Contact email" error={errors.email}>{textInput('email', { type: 'email', placeholder: 'hello@company.com', autoComplete: 'email' })}</Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="company-phone" label="Phone" error={errors.phone}>{textInput('phone', { type: 'tel', placeholder: '+91 …', autoComplete: 'tel' })}</Field>
            <Field id="company-location" label="Location" error={errors.location}>{textInput('location', { placeholder: 'e.g. Kovalam' })}</Field>
          </div>
          <Field id="company-description" label="Description" error={errors.description} hint={`${input.description.trim().length}/240`}>
            <textarea id="company-description" value={input.description} onChange={(e) => set('description', e.target.value)} rows={3} aria-invalid={!!errors.description} aria-describedby={describedBy('description', true)}
              className={textareaClass} placeholder="What the company offers" />
          </Field>
          {Object.values(errors).some(Boolean) && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">Please fix the highlighted fields.</p>}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button type="button" variant="outline" className="h-10 rounded-full px-5 text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" className="h-10 rounded-full bg-forest px-5 text-xs hover:bg-forest-light">{editing ? 'Save changes' : 'Add company'}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
}
