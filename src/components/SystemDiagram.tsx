/**
 * Diagramă ilustrativă a unui flux conectat, desenată în HTML și CSS.
 * Nu reprezintă un produs livrat și nu conține date reale.
 */
export default function SystemDiagram() {
  return (
    <div
      className="diagram"
      role="img"
      aria-label="Diagramă ilustrativă: cererile și datele din sistemele existente intră într-un motor de reguli, care produce o decizie clară."
    >
      <div className="diagram__head">
        <span className="diagram__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>flux-operational</span>
        <span className="diagram__live">
          <b />
          activ
        </span>
      </div>

      <div className="diagram__canvas" aria-hidden="true">
        <span className="diagram__label" style={{ left: '7%' }}>
          INTRĂRI
        </span>
        <span className="diagram__label" style={{ left: '44%' }}>
          LOGICĂ
        </span>
        <span className="diagram__label" style={{ right: '7%' }}>
          REZULTAT
        </span>

        <div className="diagram__node" style={{ left: '5%', top: '22%' }}>
          <span>01</span>
          <strong>Cereri</strong>
          <small>web · mobil</small>
        </div>
        <div className="diagram__node" style={{ left: '5%', top: '60%' }}>
          <span>02</span>
          <strong>Date</strong>
          <small>ERP · CRM</small>
        </div>
        <div
          className="diagram__node"
          style={{ left: '38%', top: '40%', minWidth: '9.5rem' }}
        >
          <span>03</span>
          <strong>Motor de reguli</strong>
          <small>validări · automatizări</small>
        </div>
        <div className="diagram__node" style={{ right: '4%', top: '41%' }}>
          <span>04</span>
          <strong>Decizie</strong>
          <small>semnal · acțiune</small>
        </div>

        <svg
          className="diagram__lines"
          viewBox="0 0 700 430"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M150 125 C215 125 220 205 285 205" />
          <path d="M150 300 C215 300 220 225 285 225" />
          <path d="M440 215 C505 215 510 215 570 215" />
        </svg>

        <div className="diagram__foot">
          <span>STARE: SINCRONIZAT</span>
          <span>CONTROL UMAN: ACTIV</span>
        </div>
      </div>
    </div>
  )
}
