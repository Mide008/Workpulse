// Single source of truth for landing-page copy that is also emitted as structured data.
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://workpulse-web-ten.vercel.app'

export const FAQS: { q: string; a: string }[] = [
  { q: 'What is WorkPulse?',
    a: 'WorkPulse is a team operating system. It puts tasks and projects, daily work logs, in-app approvals, KPI scoring, CRM and performance reviews into one workspace so teams stop juggling spreadsheets, chat threads and email chains.' },
  { q: 'Which industries and teams is WorkPulse for?',
    a: 'Any team that delivers work: technology, construction and site operations, sales and marketing, finance, healthcare administration, education, logistics, consulting, retail and non-profits. Roles range from staff and site managers to team leads and executives.' },
  { q: 'Is WorkPulse free?',
    a: 'Yes. The Starter plan is free for your first 5 members and needs no credit card. Paid plans for larger teams are listed on the pricing page.' },
  { q: 'How do approvals work?',
    a: 'Anyone can submit a request for leave, an expense, a purchase, a document sign-off or any custom decision. Managers see a live inbox, approve or decline inside WorkPulse, and the requester is notified straight away. Every decision is recorded in the audit trail, so nobody has to chase approvals over WhatsApp or email.' },
  { q: 'Can managers see what each person did every day?',
    a: 'Yes. Staff, engineers, site managers, marketers and sales teams submit a short daily work log covering what they did, what is next and any blockers, plus lead counts if relevant. Managers read a live team feed by date.' },
  { q: 'How are KPI scores calculated?',
    a: 'Scores are calculated from the work recorded in the app, such as task completion and on-time delivery, so reviews are based on evidence rather than memory.' },
  { q: 'Does it work on phones?',
    a: 'Yes. WorkPulse is fully responsive and installs to your home screen like an app, so site teams and field staff can log work and approve requests from anywhere.' },
  { q: 'How is my data protected?',
    a: 'Each workspace is isolated, access is controlled by roles, and sensitive actions are written to an audit trail that owners and executives can review and export.' },
]

export const SECTORS = [
  'Technology', 'Construction & site operations', 'Sales & marketing', 'Finance & banking', 'Healthcare administration',
  'Education & training', 'Logistics & supply chain', 'Consulting & agencies', 'Retail & e-commerce',
  'Real estate', 'Legal & professional services', 'Non-profit & NGO', 'Manufacturing', 'Hospitality',
]
