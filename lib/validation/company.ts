import { businessTypes, type Company, type CompanyInput } from '@/types/company'

export type CompanyErrors = Partial<Record<keyof CompanyInput, string>>

/** Client-side checks for the Add / Edit company form. The backend must validate again. */
export function validateCompany(input: CompanyInput, others: Company[]): CompanyErrors {
  const errors: CompanyErrors = {}
  const name = input.name.trim()
  const code = input.code.trim().toUpperCase()
  if (!name) errors.name = 'Enter the company name.'
  else if (name.length < 2 || name.length > 60) errors.name = 'Use 2–60 characters.'
  else if (others.some((c) => c.name.trim().toLowerCase() === name.toLowerCase())) errors.name = 'Another company already uses this name.'
  if (!code) errors.code = 'Enter a short company code.'
  else if (!/^[A-Z0-9&]{2,5}$/.test(code)) errors.code = 'Use 2–5 letters, digits or “&”.'
  else if (others.some((c) => c.code.toUpperCase() === code)) errors.code = `Code ${code} is already in use.`
  if (!businessTypes.includes(input.category)) errors.category = 'Choose a business type.'
  if (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = 'Enter a valid email address.'
  if (input.phone.trim() && !/^\+?[0-9 ()-]{7,20}$/.test(input.phone.trim())) errors.phone = 'Use digits, spaces, “+”, “-” or brackets (7–20 characters).'
  if (input.location.trim().length > 60) errors.location = 'Keep the location under 60 characters.'
  if (input.description.trim().length > 240) errors.description = 'Keep the description under 240 characters.'
  return errors
}
