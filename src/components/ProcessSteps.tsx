import { useLanguage } from '../hooks/useLanguage'
import { process } from '../content/site'
import { processSummaries } from '../content/presentation'

export default function ProcessSteps({ detailed = false }: { detailed?: boolean }) {
  const { t } = useLanguage()
  return (
    <ol className={`delivery-steps${detailed ? ' delivery-steps--detailed' : ''}`}>
      {process.map((step, index) => (
        <li key={step.title}>
          <div className="delivery-steps__top"><span>0{index + 1}</span><small>{t(step.duration)}</small></div>
          <h3>{t(step.title)}</h3>
          <p>{t(detailed ? step.body : processSummaries[index])}</p>
        </li>
      ))}
    </ol>
  )
}
