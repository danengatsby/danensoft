import { ArrowUpRight, CheckIcon, CodeIcon, LayersIcon } from './Icons'

/** Compoziție editorială ilustrativă, fără date de client sau indicatori reali. */
export default function StudioVisual() {
  return (
    <div className="studio-visual" role="img" aria-label="Ilustrație: o idee devine o aplicație web, cu interfață, integrări și un flux de lucru clar.">
      <div aria-hidden="true">
        <div className="studio-visual__top"><span>DE LA IDEE LA IMPACT</span><ArrowUpRight /></div>
        <div className="studio-visual__circle" />
        <svg className="studio-visual__orbit" viewBox="0 0 540 520" fill="none"><ellipse cx="270" cy="260" rx="254" ry="145" transform="rotate(-38 270 260)" /><ellipse cx="270" cy="260" rx="225" ry="225" /></svg>
        <div className="studio-visual__spark">✳</div>
        <div className="studio-window">
          <div className="studio-window__bar"><span><i /><i /><i /></span><span>ideea-ta.app</span><ArrowUpRight /></div>
          <div className="studio-window__body">
            <div className="studio-window__heading"><span>SPAȚIUL TĂU DE LUCRU</span><span className="studio-window__avatar">DE</span></div>
            <strong>Totul prinde contur<span>.</span></strong>
            <p>Mai puțini pași. Mai multe posibilități.</p>
            <div className="studio-window__cards">
              <div><LayersIcon /><span>O singură platformă</span><b>Totul conectat</b></div>
              <div><CodeIcon /><span>Construit pentru tine</span><b>100% pe măsură</b></div>
            </div>
            <div className="studio-window__flow"><span>Idee</span><i /><span>Design</span><i /><span>Cod</span><i /><b>Lansare <CheckIcon /></b></div>
            <div className="studio-window__chart"><span>DE LA COMPLEX LA SIMPLU</span><svg viewBox="0 0 340 64" preserveAspectRatio="none"><path className="chart-fill" d="M0 60 C35 60 30 44 65 44 S100 50 130 32 S165 42 200 22 S250 29 285 12 S320 15 340 3 V64 H0Z" /><path d="M0 60 C35 60 30 44 65 44 S100 50 130 32 S165 42 200 22 S250 29 285 12 S320 15 340 3" /></svg></div>
          </div>
        </div>
        <div className="studio-visual__tag"><span><CheckIcon /></span><div>Gândit cu grijă.<br /><strong>Construit să conteze.</strong></div></div>
        <div className="studio-visual__code">&lt;idee&gt;<br /><span>&nbsp; realitate.</span><br />&lt;/idee&gt;</div>
        <div className="studio-visual__bottom"><span>DESIGN + DEZVOLTARE + IMPLICARE</span><span>01 — ∞</span></div>
      </div>
    </div>
  )
}
