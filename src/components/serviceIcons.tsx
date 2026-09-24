import type { ReactElement, SVGProps } from 'react'
import { CodeIcon, LayersIcon, SparkIcon, WorkflowIcon } from './Icons'

type Icon = (props: SVGProps<SVGSVGElement>) => ReactElement

/** Pictograma fiecărui serviciu, ținută separat de conținut. */
export const serviceIcons: Record<string, Icon> = {
  'aplicatii-web': CodeIcon,
  integrari: WorkflowIcon,
  ai: SparkIcon,
  mentenanta: LayersIcon,
}
