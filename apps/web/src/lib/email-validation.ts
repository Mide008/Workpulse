// apps/web/src/lib/email-validation.ts

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

// Known disposable/fake email domains to block
const BLOCKED_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'throwam.com', 'sharklasers.com',
  'guerrillamailblock.com', 'grr.la', 'guerrillamail.info', 'guerrillamail.biz',
  'guerrillamail.de', 'guerrillamail.net', 'guerrillamail.org', 'spam4.me',
  'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc',
  'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf',
  'tempr.email', 'discard.email', 'discardmail.com', 'discardmail.de',
  'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org', 'trashmail.at',
  'trashmail.io', 'trashmail.me', 'trashmail.xyz', 'trashmail.com',
  'fakeinbox.com', 'mailnull.com', 'maildrop.cc', 'tempmail.com',
  'temp-mail.org', 'throwaway.email', 'spamhereplease.com', 'mailsac.com',
  'binkmail.com', 'safetymail.info', 'spam.la', 'spaml.de', 'spaml.com',
  'fakemail.net', 'dispostable.com', 'mailexpire.com',
])

export interface EmailValidationResult {
  valid: boolean
  error?: string
}

/**
 * Client‑side format validation (synchronous)
 */
export function validateEmailFormat(email: string): EmailValidationResult {
  const trimmed = email.trim().toLowerCase()

  if (!trimmed) return { valid: false, error: 'Email address is required' }
  if (!EMAIL_REGEX.test(trimmed)) return { valid: false, error: 'Enter a valid email address' }

  const parts = trimmed.split('@')
  if (parts.length !== 2) return { valid: false, error: 'Enter a valid email address' }

  const domain = parts[1]
  if (BLOCKED_DOMAINS.has(domain)) {
    return { valid: false, error: 'Disposable email addresses are not allowed. Use a real work email.' }
  }

  // Must have at least one dot in domain
  if (!domain.includes('.')) return { valid: false, error: 'Enter a valid email address' }

  // TLD must be at least 2 characters
  const tld = domain.split('.').at(-1) ?? ''
  if (tld.length < 2) return { valid: false, error: 'Enter a valid email address' }

  return { valid: true }
}

/**
 * Server‑side DNS/MX validation (asynchronous)
 * Checks domain existence and ability to receive email.
 * - Queries MX records; if none, queries A records (fallback).
 * - If domain does not exist (NXDOMAIN), blocks.
 * - Otherwise fails open (valid) to avoid false positives.
 */
export async function validateEmailDomain(email: string): Promise<EmailValidationResult> {
  const formatCheck = validateEmailFormat(email)
  if (!formatCheck.valid) return formatCheck

  const domain = email.trim().toLowerCase().split('@')[1]

  try {
    // 1. Query MX records
    const mxRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(4000),
    })
    if (!mxRes.ok) return { valid: true } // Fail open if DNS fails

    const mxData = await mxRes.json()

    // Domain does not exist → block
    if (mxData.Status === 3) {
      return { valid: false, error: `The domain "${domain}" does not exist. Check the email address.` }
    }

    const hasMX = mxData.Answer?.some((record: any) => record.type === 15)
    if (hasMX) return { valid: true }

    // 2. No MX → query A records (some domains accept email without MX)
    const aRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(4000),
    })
    if (!aRes.ok) return { valid: true } // Fail open

    const aData = await aRes.json()
    const hasA = aData.Answer?.some((record: any) => record.type === 1)
    if (hasA) return { valid: true }

    // No MX and no A – the domain likely cannot receive email,
    // but we fail open to avoid blocking legitimate setups.
    return { valid: true }
  } catch {
    // Network error or timeout — fail open
    return { valid: true }
  }
}