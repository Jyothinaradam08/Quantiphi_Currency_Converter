import { useEffect, useId, useMemo, useRef, useState } from 'react'

/** Searchable currency dropdown (combobox pattern) with keyboard navigation. */
export function CurrencySelect({ label, value, currencies, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const listId = useId()

  const selected = currencies.find((c) => c.code === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return currencies
    return currencies.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    )
  }, [currencies, query])

  useEffect(() => {
    if (!open) return undefined
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    inputRef.current?.focus()
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const openList = () => {
    setQuery('')
    setActiveIndex(Math.max(0, currencies.findIndex((c) => c.code === value)))
    setOpen(true)
  }

  const choose = (code) => {
    onChange(code)
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[activeIndex]) choose(filtered[activeIndex].code)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="currency-select" ref={rootRef}>
      <span className="field-label">{label}</span>
      <button
        type="button"
        className="currency-select__trigger"
        onClick={() => (open ? setOpen(false) : openList())}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="currency-code">{value}</span>
        <span className="currency-select__name">{selected?.name || 'Select currency'}</span>
        <span className="currency-select__chevron" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="currency-select__popover">
          <input
            ref={inputRef}
            className="currency-select__search"
            placeholder="Search code or name…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-controls={listId}
            aria-expanded="true"
            aria-autocomplete="list"
          />
          <ul className="currency-select__list" role="listbox" id={listId} ref={listRef}>
            {filtered.length === 0 && <li className="currency-select__empty">No matches</li>}
            {filtered.map((c, index) => (
              <li
                key={c.code}
                role="option"
                aria-selected={c.code === value}
                className={[
                  'currency-select__option',
                  index === activeIndex && 'is-active',
                  c.code === value && 'is-selected',
                ].filter(Boolean).join(' ')}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(c.code)
                }}
              >
                <span className="currency-code">{c.code}</span>
                <span>{c.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
