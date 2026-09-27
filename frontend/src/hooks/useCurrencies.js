import { useEffect, useState } from 'react'
import { currencyApi } from '../api/currencyApi'

export function useCurrencies() {
  const [state, setState] = useState({ currencies: [], loading: true, error: null })

  useEffect(() => {
    let active = true
    currencyApi
      .getCurrencies()
      .then((data) => active && setState({ currencies: data.currencies, loading: false, error: null }))
      .catch((error) => active && setState({ currencies: [], loading: false, error }))
    return () => {
      active = false
    }
  }, [])

  return state
}
