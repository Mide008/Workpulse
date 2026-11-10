// Competitor list prices (USD, per user per month, annual billing) checked November 2026
// from vendors' published pricing pages and industry price trackers. Vendors change prices: verify before deciding.
export interface Competitor { name: string; price: number; free: string; minSeats: string; note: string; highlight?: boolean }

export const COMPETITORS: Competitor[] = [
  { name: 'WorkPulse Pro', price: 8, free: '5 members free', minSeats: 'None', note: 'Approvals, work log, CRM, KPIs, HR and audit trail included', highlight: true },
  { name: 'Trello Premium', price: 10, free: '10 collaborators', minSeats: 'None', note: 'Boards, views and automations' },
  { name: 'Asana Starter', price: 10.99, free: 'Personal plan (small teams)', minSeats: '2 seats', note: 'Approvals are on the Advanced tier' },
  { name: 'ClickUp Business', price: 12, free: 'Unlimited users, limited features', minSeats: 'None', note: 'AI add-on is $5 extra per member' },
  { name: 'monday.com Pro', price: 19, free: '2 seats', minSeats: '3 seats', note: 'CRM is a separate product ($12–$28 per seat). Published figures vary by source' },
  { name: 'Asana Advanced', price: 24.99, free: 'Personal plan (small teams)', minSeats: '2 seats', note: 'Where Asana places approvals and workload tools' },
]
export const PRICE_CHECKED = 'November 2026'
