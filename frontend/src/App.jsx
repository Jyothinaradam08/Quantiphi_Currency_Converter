import { lazy, Suspense, useCallback, useState } from 'react'
import { Header } from './components/layout/Header'
import { Alert } from './components/common/Alert'
import { Spinner } from './components/common/Spinner'
import { ConverterPanel } from './components/converter/ConverterPanel'
import { FavoritesPanel } from './components/favorites/FavoritesPanel'
import { HistoryPanel } from './components/history/HistoryPanel'
import { TravelBudgetPanel } from './components/travel/TravelBudgetPanel'
import { useCurrencies } from './hooks/useCurrencies'
import { useFavorites } from './hooks/useFavorites'
import { useHistory } from './hooks/useHistory'
import { useConverter } from './hooks/useConverter'

const TrendChart = lazy(() =>
  import('./components/trend/TrendChart').then((module) => ({ default: module.TrendChart })),
)

export default function App() {
  const [travelMode, setTravelMode] = useState(false)
  const [notice, setNotice] = useState(null)
  const [favoriteBusy, setFavoriteBusy] = useState(false)

  const { currencies, loading: currenciesLoading, error: currenciesError } = useCurrencies()
  const favorites = useFavorites()
  const history = useHistory(10)

  const { refresh: refreshHistory } = history
  const { refresh: refreshFavorites } = favorites
  const onConverted = useCallback(() => {
    refreshHistory()
    refreshFavorites()
  }, [refreshHistory, refreshFavorites])

  const converter = useConverter({ onConverted })
  const currentFavorite = favorites.findPair(converter.from, converter.to)

  const runSafely = async (action) => {
    setNotice(null)
    try {
      await action()
    } catch (err) {
      setNotice(err.message)
    }
  }

  const toggleFavorite = () =>
    runSafely(async () => {
      setFavoriteBusy(true)
      try {
        if (currentFavorite) await favorites.remove(currentFavorite.id)
        else await favorites.add({ from: converter.from, to: converter.to })
      } finally {
        setFavoriteBusy(false)
      }
    })

  const selectPair = ({ from, to, amount }) => {
    setTravelMode(false)
    converter.setPair(from, to)
    if (amount !== undefined) converter.setAmount(String(amount))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <Header travelMode={travelMode} onTravelModeChange={setTravelMode} />

      <main className="app-main">
        {currenciesLoading && (
          <div className="page-loading"><Spinner size={32} /> Loading currencies…</div>
        )}
        {currenciesError && <Alert>{currenciesError.message}</Alert>}

        {!currenciesLoading && !currenciesError && (
          <div className="layout">
            <div className="layout__main">
              <Alert>{notice}</Alert>
              {travelMode ? (
                <TravelBudgetPanel currencies={currencies} defaultCurrency={converter.from} />
              ) : (
                <>
                  <ConverterPanel
                    currencies={currencies}
                    converter={converter}
                    favorite={currentFavorite}
                    favoriteBusy={favoriteBusy}
                    onToggleFavorite={toggleFavorite}
                  />
                  <Suspense fallback={<div className="page-loading"><Spinner /> Loading chart…</div>}>
                    <TrendChart from={converter.from} to={converter.to} />
                  </Suspense>
                </>
              )}
            </div>

            <aside className="layout__side">
              <FavoritesPanel
                favorites={favorites}
                activePair={{ from: converter.from, to: converter.to }}
                onSelect={selectPair}
                onRemove={(id) => runSafely(() => favorites.remove(id))}
              />
              <HistoryPanel
                history={history}
                highlightId={converter.lastSavedId}
                onSelect={selectPair}
                onRemove={(id) => runSafely(() => history.remove(id))}
                onClear={() => runSafely(history.clear)}
              />
            </aside>
          </div>
        )}
      </main>

      <footer className="app-footer">
        Rates by <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">ExchangeRate-API</a>
        {' · '}History by <a href="https://frankfurter.dev" target="_blank" rel="noreferrer">Frankfurter (ECB)</a>
      </footer>
    </div>
  )
}
