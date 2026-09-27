import { Toggle } from '../common/Toggle'

export function Header({ travelMode, onTravelModeChange }) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <div className="brand">
          <span className="brand__logo" aria-hidden="true">¤</span>
          <div>
            <h1 className="brand__name">FX Pulse</h1>
            <p className="brand__tagline">Real-time currency conversion &amp; 30-day trends</p>
          </div>
        </div>
        <Toggle
          id="travel-mode"
          label={travelMode ? '✈ Travel Budgeting on' : '✈ Travel Budgeting'}
          checked={travelMode}
          onChange={onTravelModeChange}
        />
      </div>
    </header>
  )
}
