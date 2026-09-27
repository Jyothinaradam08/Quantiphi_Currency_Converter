import { useState } from 'react'
import { Card } from '../common/Card'
import { Alert } from '../common/Alert'
import { AmountInput } from '../common/AmountInput'
import { CurrencySelect } from '../common/CurrencySelect'
import { ComparisonTable } from './ComparisonTable'
import { currencyApi } from '../../api/currencyApi'

export function TravelBudgetPanel({ currencies, defaultCurrency = 'INR' }) {
  const [baseCurrency, setBaseCurrency] = useState(defaultCurrency)
  const [amount, setAmount] = useState('50000')
  const [tripDays, setTripDays] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const calculate = async (e) => {
    e?.preventDefault()
    setLoading(true)
    try {
      setResult(await currencyApi.calculateTravelBudget({ baseCurrency, amount, tripDays }))
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title="Travel Budgeting"
      subtitle="See your budget in 5 major global currencies at once"
      icon="✈"
      className="travel"
    >
      <form className="travel__form" onSubmit={calculate}>
        <CurrencySelect
          label="Base currency"
          value={baseCurrency}
          currencies={currencies}
          onChange={setBaseCurrency}
        />
        <AmountInput
          id="travel-amount"
          label="Total budget"
          value={amount}
          currency={baseCurrency}
          onChange={setAmount}
        />
        <div className="amount-input">
          <label className="field-label" htmlFor="trip-days">Trip length (optional)</label>
          <div className="amount-input__control">
            <input
              id="trip-days"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 7"
              value={tripDays}
              onChange={(e) => setTripDays(e.target.value.replace(/[^0-9]/g, ''))}
            />
            <span className="amount-input__suffix">days</span>
          </div>
        </div>
        <button type="submit" className="button button--primary travel__submit" disabled={loading || !amount}>
          {loading ? 'Calculating…' : 'Compare currencies'}
        </button>
      </form>

      <Alert>{error?.message}</Alert>
      {result && <ComparisonTable result={result} />}
    </Card>
  )
}
