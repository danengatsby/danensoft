/**
 * Machetă conceptuală de panou operațional, desenată în HTML și CSS.
 * Cifrele sunt ilustrative; nu provin dintr-un sistem real.
 */
const BARS = [38, 54, 46, 72, 63, 82, 66]
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export default function OpsWindow() {
  return (
    <div
      className="ops"
      role="img"
      aria-label="Machetă conceptuală a unui panou operațional, cu indicatori și un grafic săptămânal. Cifrele sunt ilustrative."
    >
      <div className="ops__rail" aria-hidden="true">
        <span>D</span>
        <i />
        <i />
        <i />
      </div>

      <div className="ops__main" aria-hidden="true">
        <div className="ops__head">
          <div>
            <small>PANOU</small>
            <strong>Centru operațional</strong>
          </div>
          <span>AZI · 08:42</span>
        </div>

        <div className="ops__stats">
          <div>
            <small>DE REVIZUIT</small>
            <strong>12</strong>
            <span>+3 noi</span>
          </div>
          <div>
            <small>ÎN FLUX</small>
            <strong>28</strong>
            <span>stabil</span>
          </div>
          <div>
            <small>BLOCATE</small>
            <strong>04</strong>
            <span>atenție</span>
          </div>
        </div>

        <div className="ops__chart">
          <div className="ops__chart-head">
            <span>VOLUM SĂPTĂMÂNAL</span>
            <span>7 ZILE</span>
          </div>
          <div className="ops__bars">
            {BARS.map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="ops__bar-labels">
            {DAYS.map((day, index) => (
              <span key={index}>{day}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
