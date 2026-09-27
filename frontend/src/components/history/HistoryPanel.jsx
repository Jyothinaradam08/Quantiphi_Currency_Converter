import { Card } from '../common/Card'
import { Alert } from '../common/Alert'
import { Spinner } from '../common/Spinner'
import { formatDateTime, formatRelative } from '../../utils/format'

export function HistoryPanel({ history, highlightId, onSelect, onRemove, onClear }) {
  const { items, loading, error } = history

  return (
    <Card
      title="Recent conversions"
      subtitle="Stored locally in SQLite"
      icon="🕘"
      className="history"
      actions={
        items.length > 0 && (
          <button type="button" className="button button--ghost button--sm" onClick={onClear}>
            Clear all
          </button>
        )
      }
    >
      <Alert>{error?.message}</Alert>
      {loading && <Spinner />}
      {!loading && items.length === 0 && (
        <p className="empty-state">Your saved conversions will appear here.</p>
      )}
      <ul className="history-list">
        {items.map((item) => (
          <li key={item.id} className={`history-item ${item.id === highlightId ? 'is-new' : ''}`}>
            <button type="button" className="history-item__main" onClick={() => onSelect(item)}>
              <span className="history-item__amounts">
                <strong>{item.formatted.amount}</strong> {item.from}
                <span className="arrow">→</span>
                <strong>{item.formatted.convertedAmount}</strong> {item.to}
              </span>
              <time className="history-item__time" dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>
                {formatRelative(item.createdAt)}
              </time>
            </button>
            <button
              type="button"
              className="icon-button icon-button--ghost"
              onClick={() => onRemove(item.id)}
              aria-label="Delete conversion"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
