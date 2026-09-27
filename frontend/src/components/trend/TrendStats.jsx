import { formatRate, formatShortDate } from '../../utils/format'

const ARROWS = { up: '▲', down: '▼', flat: '■' }

export function TrendStats({ stats, to }) {
  if (!stats) return null

  const items = [
    { label: 'Open', value: formatRate(stats.open.rate), hint: formatShortDate(stats.open.date) },
    { label: 'Close', value: formatRate(stats.close.rate), hint: formatShortDate(stats.close.date) },
    { label: 'High', value: formatRate(stats.high.rate), hint: formatShortDate(stats.high.date) },
    { label: 'Low', value: formatRate(stats.low.rate), hint: formatShortDate(stats.low.date) },
    { label: 'Average', value: formatRate(stats.average), hint: to },
    { label: 'Volatility', value: `${stats.volatilityPercent}%`, hint: 'daily σ' },
  ]

  return (
    <div className="trend-stats">
      <div className={`trend-change trend-change--${stats.direction}`}>
        <span>{ARROWS[stats.direction]} {stats.changePercent > 0 ? '+' : ''}{stats.changePercent}%</span>
        <small>{stats.change > 0 ? '+' : ''}{formatRate(stats.change)} {to}</small>
      </div>
      <dl className="trend-stats__grid">
        {items.map((item) => (
          <div key={item.label} className="stat">
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
            <span className="stat__hint">{item.hint}</span>
          </div>
        ))}
      </dl>
    </div>
  )
}
