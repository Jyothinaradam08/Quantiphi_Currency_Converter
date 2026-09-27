import { useCallback, useEffect, useState } from 'react'
import { currencyApi } from '../api/currencyApi'

export function useHistory(limit = 10) {
  const [state, setState] = useState({ items: [], loading: true, error: null })

  const load = useCallback(
    () =>
      currencyApi
        .getHistory(limit)
        .then((data) => setState({ items: data.items, loading: false, error: null }))
        .catch((error) => setState((prev) => ({ ...prev, loading: false, error }))),
    [limit],
  )

  useEffect(() => {
    load()
  }, [load])

  const remove = useCallback(async (id) => {
    await currencyApi.deleteHistoryItem(id)
    setState((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }))
  }, [])

  const clear = useCallback(async () => {
    await currencyApi.clearHistory()
    setState((prev) => ({ ...prev, items: [] }))
  }, [])

  return { ...state, refresh: load, remove, clear }
}
