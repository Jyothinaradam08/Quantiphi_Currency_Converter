export function Toggle({ checked, onChange, label, id }) {
  return (
    <label className="toggle" htmlFor={id}>
      <span className="toggle__label">{label}</span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="toggle__input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
    </label>
  )
}
