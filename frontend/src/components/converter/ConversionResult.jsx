import { Spinner } from '../common/Spinner'
import { formatDateTime, formatRate } from '../../utils/format'

export function ConversionResult({ quote, loading }) {
  if (!quote) {
    return (
      <div className="result result--empty">
        {loading ? <Spinner /> : <span>Enter an amount to see the live conversion</span>}
      </div>
    )
  }

  return (
    <div className={`result ${loading ? 'is-refreshing' : ''}`} aria-live="polite">
      <p className="result__from">{quote.formatted.amount} {quote.from} =</p>
      <p className="result__value">
        {quote.formatted.convertedAmount} <span className="result__currency">{quote.to}</span>
      </p>
      <div className="result__rates">
        <span>1 {quote.from} = {formatRate(quote.rate)} {quote.to}</span>
        <span className="dot" aria-hidden="true">•</span>
        <span>1 {quote.to} = {formatRate(quote.inverseRate)} {quote.from}</span>
      </div>
      <p className="result__meta">
        Rates updated {formatDateTime(quote.rateUpdatedAt)}
        {quote.stale && <span className="badge badge--warning">Cached (provider offline)</span>}
        {loading && <Spinner size={12} />}
      </p>
    </div>
  )
}
