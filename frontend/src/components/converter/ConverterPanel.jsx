import { Card } from '../common/Card'
import { Alert } from '../common/Alert'
import { AmountInput } from '../common/AmountInput'
import { CurrencySelect } from '../common/CurrencySelect'
import { ConversionResult } from './ConversionResult'

export function ConverterPanel({ currencies, converter, favorite, onToggleFavorite, favoriteBusy }) {
  const { from, to, amount, quote, error, loading, saving } = converter
  const isFavorite = Boolean(favorite)

  return (
    <Card
      title="Currency Converter"
      subtitle="Live rates via ExchangeRate API"
      icon="⇄"
      className="converter"
      actions={
        <button
          type="button"
          className={`icon-button star ${isFavorite ? 'is-active' : ''}`}
          onClick={onToggleFavorite}
          disabled={favoriteBusy || from === to}
          aria-pressed={isFavorite}
          title={isFavorite ? 'Remove pair from favorites' : 'Add pair to favorites'}
        >
          {isFavorite ? '★' : '☆'}
          <span className="icon-button__text">{isFavorite ? 'Favorited' : 'Favorite'}</span>
        </button>
      }
    >
      <div className="converter__pair">
        <CurrencySelect label="From" value={from} currencies={currencies} onChange={converter.setFrom} />
        <button
          type="button"
          className="swap-button"
          onClick={converter.swap}
          aria-label="Swap currencies"
          title="Swap currencies"
        >
          ⇄
        </button>
        <CurrencySelect label="To" value={to} currencies={currencies} onChange={converter.setTo} />
      </div>

      <AmountInput
        id="amount"
        label="Amount"
        value={amount}
        currency={from}
        onChange={converter.setAmount}
        onEnter={converter.convert}
      />

      <Alert>{error?.message}</Alert>

      <ConversionResult quote={error ? null : quote} loading={loading} />

      <button
        type="button"
        className="button button--primary button--block"
        onClick={converter.convert}
        disabled={saving || !amount}
      >
        {saving ? 'Converting…' : 'Convert & save to history'}
      </button>
    </Card>
  )
}
