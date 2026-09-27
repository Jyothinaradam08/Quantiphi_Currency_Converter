import { useCallback, useEffect, useState } from 'react'
import { currencyApi } from '../api/currencyApi'

export function useFavorites() {
  const [state, setState] = useState({ items: [], loading: true, error: null })

  const load = useCallback(
    () =>
      currencyApi
        .getFavorites()
        .then((data) => setState({ items: data.items, loading: false, error: null }))
        .catch((error) => setState((prev) => ({ ...prev, loading: false, error }))),
    [],
  )

  useEffect(() => {
    load()
  }, [load])

  const add = useCallback(
    async (pair) => {
      await currencyApi.addFavorite(pair)
      await load()
    },
    [load],
  )

  const remove = useCallback(async (id) => {
    await currencyApi.removeFavorite(id)
    setState((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }))
  }, [])

  const findPair = useCallback(
    (from, to) => state.items.find((item) => item.from === from && item.to === to) || null,
    [state.items],
  )

  return { ...state, refresh: load, add, remove, findPair }
}
