'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Field, textareaClass } from '@/components/shared/form-field'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { CompanyLogoField, type LogoChange } from '@/components/companies/company-logo-field'
import { useCompanies } from '@/hooks/use-companies'
import { cn } from '@/lib/utils'
import { validateCompany, type CompanyErrors as Errors } from '@/lib/validation/company'
import { toCompany, toCompanyPayload, type CompanyDto } from '@/services/companies.service'
import { useAppDispatch } from '@/store/hooks'
import { createCompany, deleteCompany, removeCompanyLogo, updateCompany, uploadCompanyLogo } from '@/store/slices/companies-slice'
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
  /** Whether status and code may be changed (platform permission `companies.manage`). */
  canManageStatus: boolean
  /** Shows the Delete button when editing (platform permission `companies.manage`). */
  canDelete?: boolean
  /** `warning` is set when the company saved but its logo change did not. */
  onSaved: (company: Company, mode: 'added' | 'updated', warning?: string) => void
  onDeleted?: (company: Company) => void
}

export function CompanyFormDialog({ open, onOpenChange, company, canManageStatus, canDelete = false, onSaved, onDeleted }: CompanyFormDialogProps) {
  const { companies } = useCompanies()
  const dispatch = useAppDispatch()
  const [input, setInput] = useState<CompanyInput>(emptyInput)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [logo, setLogo] = useState<LogoChange>({ kind: 'keep' })
  const [logoError, setLogoError] = useState<string | undefined>()
  const [logoBusy, setLogoBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const editing = company !== null
  const lockIdentity = editing && !canManageStatus

  // Load the selected company's current data each time the form opens.
  useEffect(() => {
    if (!open) return
    setInput(company ? toInput(company) : emptyInput)
    setErrors({})
    setFormError(null)
    setLogo({ kind: 'keep' })
    setLogoError(undefined)
  }, [open, company])

  const set = <K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }))
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const focusField = (key: keyof CompanyInput) => formRef.current?.querySelector<HTMLElement>(`#company-${key}`)?.focus()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting || logoBusy) return
    const found = validateCompany(input, companies.filter((c) => c.id !== company?.id))
    setErrors(found)
    setFormError(null)
    const first = fieldOrder.find((key) => found[key])
    if (first) return focusField(first)

    setSubmitting(true)
    // Code and status are sent on create, and on edit only when this user may change them.
    const payload = toCompanyPayload(input, !company || canManageStatus)
    const action = company
      ? await dispatch(updateCompany({ id: company.id, payload }))
      : await dispatch(createCompany(payload))
    setSubmitting(false)

    if (createCompany.fulfilled.match(action) || updateCompany.fulfilled.match(action)) {
      setSubmitting(true)
      const { saved, warning } = await applyLogo(action.payload)
      setSubmitting(false)
      onSaved(toCompany(saved), company ? 'updated' : 'added', warning)
      onOpenChange(false)
      return
    }
    const error = action.payload
    const serverErrors = (error?.fieldErrors ?? {}) as Errors
    setErrors(serverErrors)
    setFormError(error?.message ?? 'Could not save the company. Please try again.')
    const firstServer = fieldOrder.find((key) => serverErrors[key])
    if (firstServer) focusField(firstServer)
  }

  // The logo needs the company id, so it is sent after the company is saved.
  const applyLogo = async (saved: CompanyDto): Promise<{ saved: CompanyDto, warning?: string }> => {
    if (logo.kind === 'keep' || (logo.kind === 'remove' && !saved.logoUrl)) return { saved }
    const result = logo.kind === 'upload'
      ? await dispatch(uploadCompanyLogo({ id: saved.id, file: logo.file }))
      : await dispatch(removeCompanyLogo(saved.id))
    if (uploadCompanyLogo.fulfilled.match(result) || removeCompanyLogo.fulfilled.match(result)) return { saved: result.payload }
    return { saved, warning: `The logo wasn’t ${logo.kind === 'upload' ? 'uploaded' : 'removed'}: ${result.payload?.message ?? 'please try again.'}` }
  }

  const remove = async () => {
    if (!company) return
    setSubmitting(true)
    const action = await dispatch(deleteCompany(company.id))
    setSubmitting(false)
    if (deleteCompany.fulfilled.match(action)) {
      onOpenChange(false)
      onDeleted?.(company)
    } else {
      setFormError(action.payload?.message ?? 'Could not delete the company. Please try again.')
    }
  }

  const describedBy = (key: keyof CompanyInput, hasHint = false) => (errors[key] ? `company-${key}-error` : hasHint ? `company-${key}-hint` : undefined)
  const textInput = (key: 'name' | 'code' | 'email' | 'phone' | 'location', props: { type?: string, placeholder?: string, disabled?: boolean, hint?: boolean, className?: string, autoComplete?: string } = {}) =>
    <Input id={`company-${key}`} value={input[key]} onChange={(e) => set(key, key === 'code' ? e.target.value.toUpperCase() : e.target.value)} aria-invalid={!!errors[key]} aria-describedby={describedBy(key, props.hint)}
      type={props.type} placeholder={props.placeholder} disabled={props.disabled} autoComplete={props.autoComplete ?? 'off'} className={cn('h-10 rounded-xl text-sm', props.className)} />

  return <>
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg gap-0 overflow-hidden bg-white p-0">
      <form ref={formRef} onSubmit={submit} noValidate className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="shrink-0 border-b border-slate-100 py-5 pr-14 pl-6">
          <DialogTitle className="text-lg font-semibold text-ink">{editing ? `Edit ${company.name}` : 'Add company'}</DialogTitle>
          <DialogDescription className="mt-1 text-xs text-slate-500">{editing ? 'Changes are saved to the server for everyone.' : 'The company is saved to the server and visible to every admin with access.'}</DialogDescription>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <CompanyLogoField currentUrl={company?.logoUrl} change={logo} onChange={setLogo} error={logoError} onError={setLogoError}
            code={input.code.trim().toUpperCase()} color={company?.color ?? '#3e5b56'} disabled={submitting} onBusyChange={setLogoBusy} />
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
          {(formError || Object.values(errors).some(Boolean)) && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{formError ?? 'Please fix the highlighted fields.'}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 px-6 py-4">
          {editing && canDelete && <Button type="button" variant="outline" disabled={submitting} className="h-10 rounded-full border-red-200 px-4 text-xs text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setConfirmDelete(true)}><Trash2 data-icon="inline-start" />Delete</Button>}
          <Button type="button" variant="outline" disabled={submitting} className="ml-auto h-10 rounded-full px-5 text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={submitting || logoBusy} className="h-10 rounded-full bg-forest px-5 text-xs hover:bg-forest-light">{submitting ? 'Saving…' : editing ? 'Save changes' : 'Add company'}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
  {company && <ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} destructive confirmLabel="Delete company" onConfirm={() => void remove()}
      title={`Delete ${company.name}?`} description="This permanently removes the company and all of its team memberships. This can’t be undone." />}
  </>
}
