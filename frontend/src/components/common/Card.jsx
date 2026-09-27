export function Card({ title, subtitle, icon, actions, className = '', children }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="card__header">
          <div className="card__heading">
            {icon && <span className="card__icon" aria-hidden="true">{icon}</span>}
            <div>
              {title && <h2 className="card__title">{title}</h2>}
              {subtitle && <p className="card__subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
