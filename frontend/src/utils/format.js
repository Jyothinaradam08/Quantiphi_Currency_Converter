// Display-only helpers. Monetary values arrive pre-computed and pre-formatted from the API.

const rateFormatter = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 })
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })
const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export const formatRate = (rate) => (rate === null || rate === undefined ? '—' : rateFormatter.format(rate))

export const formatDateTime = (iso) => (iso ? dateTimeFormatter.format(new Date(iso)) : '—')

export const formatShortDate = (isoDate) => shortDateFormatter.format(new Date(`${isoDate}T00:00:00Z`))

export function formatRelative(iso) {
  if (!iso) return ''
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const units = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return relativeFormatter.format(Math.round(diffSeconds / seconds), unit)
    }
  }
  return 'just now'
}
