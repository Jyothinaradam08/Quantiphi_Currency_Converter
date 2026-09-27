import { useCallback, useEffect, useState } from 'react'
import { currencyApi } from '../api/currencyApi'
import { useDebouncedValue } from './useDebouncedValue'

const EMPTY_RESULT = { key: null, quote: null, error: null }
const keyOf = (from, to, amount) => (amount ? `${from}|${to}|${amount}` : null)

/**
 * Converter UI state. Live quotes are fetched (debounced) as the user types;
 * `convert` records the conversion in server-side history.
 */
export function useConverter({ initialFrom = 'USD', initialTo = 'INR', initialAmount = '100', onConverted } = {}) {
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [amount, setAmount] = useState(initialAmount)
  const [result, setResult] = useState(EMPTY_RESULT)
  const [saving, setSaving] = useState(false)
  const [lastSavedId, setLastSavedId] = useState(null)

  const debouncedAmount = useDebouncedValue(amount).trim()
  const requestKey = keyOf(from, to, debouncedAmount)

  useEffect(() => {
    if (!requestKey) return undefined
    const controller = new AbortController()
    currencyApi
      .getQuote({ from, to, amount: debouncedAmount }, controller.signal)
      .then((quote) => setResult({ key: requestKey, quote, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ key: requestKey, quote: null, error })
      })
    return () => controller.abort()
  }, [requestKey, from, to, debouncedAmount])

  const convert = useCallback(async () => {
    const key = keyOf(from, to, amount.trim())
    setSaving(true)
    try {
      const saved = await currencyApi.convert({ from, to, amount })
      setResult({ key, quote: saved, error: null })
      setLastSavedId(saved.id)
      onConverted?.(saved)
      return saved
    } catch (error) {
      setResult({ key, quote: null, error })
      return null
    } finally {
      setSaving(false)
    }
  }, [from, to, amount, onConverted])

  const swap = useCallback(() => {
    setFrom(to)
    setTo(from)
  }, [from, to])

  const setPair = useCallback((nextFrom, nextTo) => {
    setFrom(nextFrom)
    setTo(nextTo)
  }, [])

  const isCurrent = requestKey !== null && result.key === requestKey

  return {
    from,
    to,
    amount,
    // While a new quote loads, keep showing the previous one (dimmed) to avoid layout jumps.
    quote: requestKey ? result.quote : null,
    error: isCurrent ? result.error : null,
    loading: (requestKey !== null && !isCurrent) || amount.trim() !== debouncedAmount,
    saving,
    lastSavedId,
    setFrom,
    setTo,
    setAmount,
    setPair,
    swap,
    convert,
  }
}
