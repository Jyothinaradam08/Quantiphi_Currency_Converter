import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../common/Card'
import { Alert } from '../common/Alert'
import { Spinner } from '../common/Spinner'
import { useTrend } from '../../hooks/useTrend'
import { formatRate, formatShortDate } from '../../utils/format'
import { TrendStats } from './TrendStats'

const RANGES = [7, 30, 90]
const DIRECTION_COLORS = { up: '#059669', down: '#dc2626', flat: '#4f46e5' }

function ChartTooltip({ active, payload, from, to }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__date">{formatShortDate(point.date)}</p>
      <p className="chart-tooltip__value">1 {from} = {formatRate(point.rate)} {to}</p>
    </div>
  )
}

export function TrendChart({ from, to }) {
  const [days, setDays] = useState(30)
  const { data, loading, error } = useTrend(from, to, days)
  const color = DIRECTION_COLORS[data?.stats?.direction || 'flat']
  const gradientId = `trend-${from}-${to}`

  return (
    <Card
      title={`${from} → ${to} trend`}
      subtitle={`Exchange rate over the last ${days} days`}
      icon="📈"
      className="trend"
      actions={
        <div className="segmented" role="group" aria-label="Trend range">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              className={range === days ? 'is-active' : ''}
              onClick={() => setDays(range)}
            >
              {range}D
            </button>
          ))}
        </div>
      }
    >
      {from === to && <Alert tone="info">Choose two different currencies to see a trend.</Alert>}
      <Alert>{error?.message}</Alert>

      {loading && !data && (
        <div className="chart-placeholder"><Spinner size={28} /></div>
      )}

      {data && !data.available && <Alert tone="info">{data.message}</Alert>}

      {data?.available && (
        <div className={`trend__body ${loading ? 'is-refreshing' : ''}`}>
          {data.message && <Alert tone="info">{data.message}</Alert>}
          <TrendStats stats={data.stats} to={to} />
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.points} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={formatRate}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  width={72}
                />
                <Tooltip content={<ChartTooltip from={from} to={to} />} />
                {data.stats && (
                  <ReferenceLine y={data.stats.average} stroke="#94a3b8" strokeDasharray="4 4" />
                )}
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke={color}
                  strokeWidth={2.5}
                  fill={`url(#${gradientId})`}
                  dot={data.points.length < 3}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="caption">
            Source: {data.source} · {data.points.length} data point{data.points.length === 1 ? '' : 's'}
            {data.stats && ' · dashed line = period average'}
          </p>
        </div>
      )}
    </Card>
  )
}
