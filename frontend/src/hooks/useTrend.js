import { useEffect, useState } from 'react'
import { currencyApi } from '../api/currencyApi'

export function useTrend(from, to, days = 30) {
  const [result, setResult] = useState({ key: null, data: null, error: null })
  const requestKey = from && to && from !== to ? `${from}|${to}|${days}` : null

  useEffect(() => {
    if (!requestKey) return undefined
    const controller = new AbortController()
    currencyApi
      .getTrend({ from, to, days }, controller.signal)
      .then((data) => setResult({ key: requestKey, data, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ key: requestKey, data: null, error })
      })
    return () => controller.abort()
  }, [requestKey, from, to, days])

  const isCurrent = requestKey !== null && result.key === requestKey
  return {
    data: requestKey ? result.data : null,
    error: isCurrent ? result.error : null,
    loading: requestKey !== null && !isCurrent,
  }
}
