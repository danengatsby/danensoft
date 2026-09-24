import { services } from './site'

export const serviceGroups = [
  {
    title: 'Dezvoltare de produse',
    description: 'Aplicații web, portaluri și produse SaaS construite în jurul proceselor afacerii.',
    serviceIds: ['aplicatii-web'],
    label: 'De la idee la aplicație',
  },
  {
    title: 'Integrări și automatizare',
    description: 'Sisteme conectate, mai puține operațiuni manuale și AI aplicat unde aduce valoare.',
    serviceIds: ['integrari', 'ai'],
    label: 'Procese care lucrează împreună',
  },
  {
    title: 'Cloud și mentenanță',
    description: 'Lansare, monitorizare și îmbunătățiri continue pentru aplicații noi sau existente.',
    serviceIds: ['cloud', 'mentenanta'],
    label: 'Continuitate după lansare',
  },
].map((group) => ({
  ...group,
  services: group.serviceIds.map((id) => services.find((service) => service.id === id)!),
}))

export const processSummaries = [
  'Clarificăm obiectivul, utilizatorii și sistemele implicate.',
  'Stabilim livrabilele, etapele, bugetul și criteriile de acceptare.',
  'Vedeți progresul în versiuni funcționale și oferiți feedback.',
  'Lansăm aplicația și predăm codul, accesul și documentația.',
]

export const commitments = [
  { title: 'Un contact direct', body: 'Discuțiile tehnice și deciziile rămân la aceeași persoană.' },
  { title: 'Livrabile clare', body: 'Scopul, etapele și costurile sunt stabilite înainte de dezvoltare.' },
  { title: 'Codul vă aparține', body: 'Primiți codul sursă, documentația și accesul la proiect.' },
]
