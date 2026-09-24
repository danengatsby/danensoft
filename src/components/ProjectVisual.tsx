/** Machete decorative pentru cardurile de proiect, desenate în CSS. */
export default function ProjectVisual({ motif }: { motif: string }) {
  if (motif === 'phone') {
    return (
      <div className="mock-phone" aria-hidden="true">
        <div className="mock-phone__speaker" />
        <div className="mock-phone__map">
          <i />
          <i />
          <i />
        </div>
        <div className="mock-phone__rows">
          <b />
          <b />
          <b />
        </div>
      </div>
    )
  }

  if (motif === 'flow') {
    return (
      <div className="mock-flow" aria-hidden="true">
        <span>DOC</span>
        <span>AI</span>
        <span>OK</span>
        <i />
        <i />
      </div>
    )
  }

  return (
    <div className="mock-dash" aria-hidden="true">
      <div className="mock-dash__side">
        <i />
        <i />
        <i />
      </div>
      <div className="mock-dash__main">
        <span />
        <div className="mock-dash__row">
          <i />
          <i />
          <i />
        </div>
        <b />
        <b />
        <b />
      </div>
    </div>
  )
}
