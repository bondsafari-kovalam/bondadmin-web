// Demo data only — the single source of company records until the backend is connected.
import type { Company, CompanyAdmin, CompanyOffering } from '@/types/company'

export const seedCompanies: Company[] = [
  { id: 'wca', name: 'Wild Coast Adventures', code: 'WCA', category: 'Adventure tourism', status: 'Active', color: '#d4a42e', description: 'Guided coastal treks, rappelling and overnight jungle camps.', contact: { email: 'hello@wildcoast.example.com', location: 'Kovalam' }, createdAt: new Date(2019, 2, 11) },
  { id: 'asc', name: 'Aqua Sports Centre', code: 'ASC', category: 'Water sports', status: 'Active', color: '#3e5b56', description: 'Scuba, snorkelling and motorised water sports.', contact: { email: 'bookings@aquasports.example.com', location: 'Kovalam' }, createdAt: new Date(2018, 10, 2) },
  { id: 'pnc', name: 'Paddle & Co.', code: 'P&C', category: 'Paddlesports', status: 'Active', color: '#1fb2a6', description: 'Sunset kayak tours and stand-up paddleboard lessons.', contact: { email: 'paddle@paddleco.example.com', location: 'Varkala' }, createdAt: new Date(2020, 0, 20) },
  { id: 'st', name: 'Summit Training', code: 'ST', category: 'Training courses', status: 'Active', color: '#1b8fb5', description: 'Certified sea-kayak and outdoor first-aid courses.', contact: { email: 'courses@summit.example.com', location: 'Thiruvananthapuram' }, createdAt: new Date(2021, 5, 7) },
  { id: 'bh', name: 'Blue Horizon', code: 'BH', category: 'Activities', status: 'Active', color: '#e07a5f', description: 'Island hopping and backwater cruises.', contact: { email: 'hi@bluehorizon.example.com', location: 'Kollam' }, createdAt: new Date(2021, 9, 15) },
  { id: 'ck', name: 'Coastal Kayak', code: 'CK', category: 'Paddlesports', status: 'Active', color: '#7fa38f', description: 'Mangrove and night-paddle kayak experiences.', contact: { location: 'Poovar' }, createdAt: new Date(2022, 3, 4) },
  { id: 'th', name: 'Trailhead', code: 'TH', category: 'Adventure tourism', status: 'Inactive', color: '#a3b1ad', description: 'Hill hikes and waterfall trails. Operations paused for trail maintenance.', contact: { email: 'team@trailhead.example.com', location: 'Ponmudi' }, createdAt: new Date(2022, 7, 22) },
]

/** Demo history stops on this date for inactive companies, so their "last activity" is realistic. */
export const inactiveSince: Record<string, Date> = { th: new Date(2026, 8, 14) }

export const offerings: CompanyOffering[] = [
  { companyId: 'wca', name: 'Coastal Trek', kind: 'Activity', pricePerGuest: 720 },
  { companyId: 'wca', name: 'Cliff Rappel', kind: 'Activity', pricePerGuest: 1080 },
  { companyId: 'wca', name: 'Jungle Camp Night', kind: 'Activity', pricePerGuest: 1440 },
  { companyId: 'asc', name: 'Open Water Dive', kind: 'Activity', pricePerGuest: 1920 },
  { companyId: 'asc', name: 'Snorkel Safari', kind: 'Activity', pricePerGuest: 900 },
  { companyId: 'asc', name: 'Jet Ski Ride', kind: 'Activity', pricePerGuest: 660 },
  { companyId: 'pnc', name: 'Sunset Kayak Tour', kind: 'Activity', pricePerGuest: 780 },
  { companyId: 'pnc', name: 'SUP Lesson', kind: 'Course', pricePerGuest: 540 },
  { companyId: 'st', name: 'Level 2 Sea Kayak', kind: 'Course', pricePerGuest: 2520 },
  { companyId: 'st', name: 'Outdoor First Aid', kind: 'Course', pricePerGuest: 1680 },
  { companyId: 'bh', name: 'Island Explorer', kind: 'Activity', pricePerGuest: 1260 },
  { companyId: 'bh', name: 'Backwater Cruise', kind: 'Activity', pricePerGuest: 960 },
  { companyId: 'ck', name: 'Mangrove Kayak', kind: 'Activity', pricePerGuest: 600 },
  { companyId: 'ck', name: 'Night Paddle', kind: 'Activity', pricePerGuest: 840 },
  { companyId: 'th', name: 'Hill Hike', kind: 'Activity', pricePerGuest: 480 },
  { companyId: 'th', name: 'Waterfall Trail', kind: 'Activity', pricePerGuest: 660 },
]

export const companyAdmins: CompanyAdmin[] = [
  { id: 'a1', companyId: 'wca', name: 'Joel Mathew', initials: 'JM', email: 'joel@wildcoast.example.com', title: 'Company Admin' },
  { id: 'a2', companyId: 'asc', name: 'Meera Iyer', initials: 'MI', email: 'meera@aquasports.example.com', title: 'Company Admin' },
  { id: 'a3', companyId: 'pnc', name: 'Sara Thomas', initials: 'ST', email: 'sara@paddleco.example.com', title: 'Company Admin' },
  { id: 'a4', companyId: 'st', name: 'Vivek Rao', initials: 'VR', email: 'vivek@summit.example.com', title: 'Company Admin' },
  { id: 'a5', companyId: 'bh', name: 'Fathima Ali', initials: 'FA', email: 'fathima@bluehorizon.example.com', title: 'Company Admin' },
  { id: 'a6', companyId: 'ck', name: 'Arun Pillai', initials: 'AP', email: 'arun@coastalkayak.example.com', title: 'Company Admin' },
  { id: 'a7', companyId: 'th', name: 'Neha Das', initials: 'ND', email: 'neha@trailhead.example.com', title: 'Company Admin' },
]
