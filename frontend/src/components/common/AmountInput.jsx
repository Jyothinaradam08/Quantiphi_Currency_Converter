export function AmountInput({ id, label, value, onChange, onEnter, currency, placeholder = '0.00' }) {
  return (
    <div className="amount-input">
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="amount-input__control">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          // Restrict keystrokes to a plain decimal; the server performs the real validation.
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        />
        {currency && <span className="amount-input__suffix">{currency}</span>}
      </div>
    </div>
  )
}
