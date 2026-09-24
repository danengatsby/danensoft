/**
 * Reprezentare ilustrativă a unor funcții din Contabo, desenată în HTML și CSS.
 */
const BARS = [38, 54, 46, 72, 63, 82, 66]
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export default function OpsWindow() {
  return (
    <div
      className="ops"
      role="img"
      aria-label="Reprezentare ilustrativă a panoului Contabo, cu documente, e-Factura și raportare."
    >
      <div className="ops__rail" aria-hidden="true">
        <span>C</span>
        <i />
        <i />
        <i />
      </div>

      <div className="ops__main" aria-hidden="true">
        <div className="ops__head">
          <div>
            <small>CONTABO</small>
            <strong>Situația firmei</strong>
          </div>
          <span>AZI · 08:42</span>
        </div>

        <div className="ops__stats">
          <div>
            <small>DOCUMENTE</small>
            <strong>PDF</strong>
            <span>citire asistată</span>
          </div>
          <div>
            <small>E-FACTURA</small>
            <strong>XML</strong>
            <span>emitere</span>
          </div>
          <div>
            <small>RAPOARTE</small>
            <strong>TVA</strong>
            <span>balanță</span>
          </div>
        </div>

        <div className="ops__chart">
          <div className="ops__chart-head">
            <span>VENITURI / CHELTUIELI</span>
            <span>PREVIZIUNE</span>
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
