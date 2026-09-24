import { ArrowUpRight, CheckIcon, CloudIcon, CodeIcon, LayersIcon, WorkflowIcon } from './Icons'

/** Ilustrație conceptuală, fără date sau stări provenite dintr-un sistem real. */
export default function SystemDiagram() {
  return (
    <div className="system-scene" role="img" aria-label="Ilustrație: o aplicație cloud conectează documentele, echipa și integrările într-un singur flux automatizat.">
      <div className="system-scene__art" aria-hidden="true">
        <div className="system-scene__heading"><span>DE LA COMPLEX LA CONECTAT</span><ArrowUpRight /></div>
        <div className="system-scene__orbit system-scene__orbit--outer" />
        <div className="system-scene__orbit system-scene__orbit--inner" />
        <svg className="system-scene__connections" viewBox="0 0 560 480" preserveAspectRatio="none">
          <path d="M115 135 H190 Q220 135 220 165 V220 H280 M445 140 H360 Q335 140 335 170 V220 H280 M125 340 H200 Q220 340 220 310 V250 H280 M445 340 H360 Q335 340 335 310 V250 H280" />
        </svg>
        <div className="system-hub">
          <span className="system-hub__icon"><CloudIcon /></span>
          <strong>Aplicația dvs.</strong>
          <span>UN SINGUR ECOSISTEM</span>
          <div><i /> Conectat. Simplificat.</div>
        </div>
        <div className="system-node system-node--documents"><span><LayersIcon /></span><div><strong>Documente</strong><small>Totul organizat</small></div><CheckIcon /></div>
        <div className="system-node system-node--integrations"><span><CodeIcon /></span><div><strong>Integrări API</strong><small>Sisteme conectate</small></div><CheckIcon /></div>
        <div className="system-node system-node--team"><span><WorkflowIcon /></span><div><strong>Echipa dvs.</strong><small>Același flux de lucru</small></div><CheckIcon /></div>
        <div className="system-node system-node--automation"><span><CheckIcon /></span><div><strong>Automatizări</strong><small>Mai puțini pași manuali</small></div></div>
        <div className="system-scene__footer"><span className="system-scene__code">&lt;/&gt;</span><span>Mai puțin haos.<br /><strong>Mai multă claritate.</strong></span><span className="system-scene__label">CLOUD · SAAS · API</span></div>
      </div>
      <p className="system-scene__caption">Sisteme care lucrează împreună. Oameni care merg mai departe.</p>
    </div>
  )
}
