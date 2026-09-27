import { formatDateTime, formatRate } from '../../utils/format'

export function ComparisonTable({ result }) {
  const showDaily = Boolean(result.tripDays)

  return (
    <div className="comparison">
      <div className="comparison__summary">
        <div>
          <span className="field-label">Budget</span>
          <p className="comparison__amount">{result.formatted.amount} <small>{result.baseCurrency}</small></p>
          <p className="caption">{result.baseCurrencyName}</p>
        </div>
        {showDaily && (
          <div>
            <span className="field-label">Per day ({result.tripDays} days)</span>
            <p className="comparison__amount">{result.formatted.dailyAmount}</p>
          </div>
        )}
      </div>

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Currency</th>
              <th scope="col" className="num">Exchange rate</th>
              <th scope="col" className="num">Equivalent budget</th>
              {showDaily && <th scope="col" className="num">Per day</th>}
            </tr>
          </thead>
          <tbody>
            {result.conversions.map((row) => (
              <tr key={row.currency}>
                <th scope="row">
                  <span className="currency-code">{row.currency}</span>
                  <span className="table__name">{row.name}</span>
                </th>
                <td className="num">
                  <span>1 {result.baseCurrency} = {formatRate(row.rate)}</span>
                  <span className="table__sub">1 {row.currency} = {formatRate(row.inverseRate)} {result.baseCurrency}</span>
                </td>
                <td className="num table__strong">{row.formatted.convertedAmount}</td>
                {showDaily && <td className="num">{row.formatted.dailyAmount}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="caption">
        Calculated server-side using rates updated {formatDateTime(result.rateUpdatedAt)}
        {result.stale && ' (cached — provider offline)'}
      </p>
    </div>
  )
}
