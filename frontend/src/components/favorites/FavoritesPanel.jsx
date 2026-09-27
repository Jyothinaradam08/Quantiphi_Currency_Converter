import { Card } from '../common/Card'
import { Alert } from '../common/Alert'
import { Spinner } from '../common/Spinner'
import { formatRate } from '../../utils/format'

export function FavoritesPanel({ favorites, activePair, onSelect, onRemove }) {
  const { items, loading, error } = favorites

  return (
    <Card title="Favorites" subtitle="Quick access to your frequent pairs" icon="★" className="favorites">
      <Alert>{error?.message}</Alert>
      {loading && <Spinner />}
      {!loading && items.length === 0 && (
        <p className="empty-state">No favorites yet. Tap ☆ on the converter to pin a pair.</p>
      )}
      <ul className="pill-list">
        {items.map((fav) => {
          const active = activePair.from === fav.from && activePair.to === fav.to
          return (
            <li key={fav.id} className={`fav-item ${active ? 'is-active' : ''}`}>
              <button type="button" className="fav-item__main" onClick={() => onSelect(fav)}>
                <span className="fav-item__pair">
                  <span className="currency-code">{fav.from}</span>
                  <span className="arrow">→</span>
                  <span className="currency-code">{fav.to}</span>
                </span>
                <span className="fav-item__rate">{formatRate(fav.rate)}</span>
                {fav.usageCount > 0 && (
                  <span className="fav-item__usage" title="Times converted">{fav.usageCount}×</span>
                )}
              </button>
              <button
                type="button"
                className="icon-button icon-button--ghost"
                onClick={() => onRemove(fav.id)}
                aria-label={`Remove ${fav.from} to ${fav.to} from favorites`}
              >
                ✕
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
