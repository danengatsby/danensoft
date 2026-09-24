/** Conținutul comercial al site-ului, într-un singur loc. */

export type NavItem = { label: string; to: string }

export const company = {
  name: 'Moldovan Lux',
  legalName: 'MOLDOVAN LUX S.R.L.',
  initials: 'ML',
  tagline: 'Aplicații cloud și produse SaaS',
  email: 'moldovanlux@gmail.com',
  phone: null as string | null,
  location: 'Iași, România · colaborare remote',
  legal: 'MOLDOVAN LUX S.R.L. · CUI 30342978 · J22/1026/21.06.2012',
  siteUrl: 'https://danenachesoft.space',
  foundedNote:
    'Studio software independent, cu contact direct între client și persoana care coordonează proiectul.',
} as const

export const social: { label: string; href: string }[] = []

export const team = [
  {
    name: 'Enache Dan',
    role: 'Administrator',
    bio: 'Administratorul Moldovan Lux și contactul direct pentru evaluarea, organizarea și livrarea proiectelor software.',
  },
] as const

export const audiences = ['IMM-uri', 'Startup-uri SaaS', 'Echipe enterprise'] as const

export const nav: NavItem[] = [
  { label: 'Acasă', to: '/' },
  { label: 'Servicii', to: '/servicii' },
  { label: 'Proiecte', to: '/proiecte' },
  { label: 'Despre', to: '/despre' },
  { label: 'Contact', to: '/contact' },
]

/** Pagini secundare, prezente doar în subsol. */
export const legalNav: NavItem[] = [
  { label: 'Confidențialitate', to: '/confidentialitate' },
]

/**
 * Pagini servite de serviciul Node, nu de rutarea din browser.
 * Trebuie deschise cu <a href>, nu cu <Link>, altfel routerul le prinde și dă 404.
 */
export const serverNav: NavItem[] = [
  { label: 'Cont client', to: '/cont' },
]

/** Toate rutele valide ale site-ului — folosită și de testul de linkuri moarte. */
export const allRoutes: NavItem[] = [...nav, ...legalNav, ...serverNav]

export type Service = {
  id: string
  title: string
  summary: string
  detail: string
  deliverables: string[]
  stack: string[]
}

export const services: Service[] = [
  {
    id: 'aplicatii-web',
    title: 'Aplicații cloud pe măsură',
    summary:
      'Platforme interne, portaluri pentru clienți și aplicații care înlocuiesc fișierele Excel și procesele manuale.',
    detail:
      'Pornim de la fluxul real de lucru, nu de la un template. Modelăm datele, definim rolurile și permisiunile, apoi construim interfața peste un API documentat. Livrăm în incremente funcționale, ca să folosiți aplicația înainte să fie „gata” complet.',
    deliverables: [
      'Model de date și API documentat',
      'Interfață responsivă, testată pe desktop și mobil',
      'Roluri, permisiuni și jurnal de audit',
      'Pipeline de build și deploy automat',
    ],
    stack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
  },
  {
    id: 'integrari',
    title: 'Integrări și automatizări',
    summary:
      'Conectăm sistemele care nu vorbesc între ele: ERP, CRM, facturare, e-Factura, curieri, plăți.',
    detail:
      'Majoritatea pierderilor de timp apar la granița dintre sisteme. Construim integrări cu reîncercări, jurnalizare și alertare, astfel încât o eroare de rețea să nu devină o comandă pierdută. Fiecare integrare vine cu un mod de testare separat de producție.',
    deliverables: [
      'Sincronizări programate sau pe eveniment (webhooks)',
      'Reîncercări, cozi și tratarea erorilor',
      'Jurnal de rulări, vizibil pentru echipa dvs.',
      'Documentație de operare și rollback',
    ],
    stack: ['REST', 'Webhooks', 'Cozi de mesaje', 'Cron'],
  },
  {
    id: 'ai',
    title: 'Funcționalități cu AI, aplicate',
    summary:
      'Asistență la clasificare, extragere de date din documente și căutare semantică — acolo unde reduc muncă reală.',
    detail:
      'Nu adăugăm AI ca argument de marketing. Începem cu o sarcină măsurabilă, stabilim un prag de acuratețe acceptat împreună cu dvs. și păstrăm întotdeauna un traseu de verificare umană. Dacă evaluarea nu trece pragul, spunem asta și oprim direcția.',
    deliverables: [
      'Set de evaluare pe datele dumneavoastră',
      'Prag de acuratețe agreat înainte de implementare',
      'Interfață de verificare și corectare umană',
      'Estimare de cost per operațiune',
    ],
    stack: ['API-uri LLM', 'Căutare vectorială', 'OCR', 'Evaluări automate'],
  },
  {
    id: 'mentenanta',
    title: 'Preluare și mentenanță',
    summary:
      'Preluăm proiecte existente, stabilizăm ce e fragil și documentăm ce a rămas nescris.',
    detail:
      'Începem cu un audit scurt: dependențe, riscuri de securitate, acoperire cu teste, procesul de release. Primiți un raport cu problemele ordonate după impact și cost, iar dumneavoastră decideți ce reparăm și în ce ordine.',
    deliverables: [
      'Audit tehnic scris, cu priorități',
      'Actualizări de dependențe și securitate',
      'Teste pentru zonele critice',
      'Predare completă: acces, documentație, cod',
    ],
    stack: ['Audit', 'CI/CD', 'Teste', 'Monitorizare'],
  },
  {
    id: 'cloud',
    title: 'Livrare și operare în cloud',
    summary:
      'Publicăm și operăm aplicații pe infrastructură proprie, cu procese clare de actualizare, monitorizare și recuperare.',
    detail:
      'Pregătim aplicația pentru producție, separăm mediile de test și producție și automatizăm livrările. Configurăm jurnalizarea, monitorizarea, copiile de siguranță și procedurile de restaurare, astfel încât operarea să nu depindă de intervenții improvizate.',
    deliverables: [
      'Mediu de test și mediu de producție separate',
      'Deploy automat și procedură de revenire',
      'Monitorizare, alerte și jurnalizare',
      'Backup verificat și documentație de restaurare',
    ],
    stack: ['Linux', 'Containere', 'CI/CD', 'Monitorizare'],
  },
]

export type ProcessStep = { title: string; body: string; duration: string }

export const process: ProcessStep[] = [
  {
    title: 'Discuție și delimitare',
    duration: 'Zilele 1–3',
    body: 'O conversație despre problema concretă, nu despre tehnologie. Ieșim cu obiectivul, constrângerile, integrările necesare și ce înseamnă „funcționează” pentru dumneavoastră.',
  },
  {
    title: 'Propunere cu preț și plan',
    duration: 'Săptămâna 1',
    body: 'Primiți un document cu scopul lucrării, etapele, prețul și ce nu este inclus. Dacă bugetul nu acoperă tot, propunem o variantă redusă care rămâne utilă.',
  },
  {
    title: 'Livrare în incremente',
    duration: 'Continuu',
    body: 'Lucrăm în cicluri scurte, cu o versiune accesibilă în mediu de test. Vedeți progresul săptămânal și puteți schimba prioritățile între cicluri.',
  },
  {
    title: 'Lansare și predare',
    duration: 'La final',
    body: 'Punem în producție, configurăm monitorizarea și predăm codul, accesele și documentația. Rămâneți proprietarul întregului cod sursă.',
  },
]

export type Project = {
  id: string
  title: string
  category: string
  glyph: string
  /** Culoarea cardului și macheta desenată în CSS. */
  tone: 'coral' | 'lime' | 'blue' | 'sand' | 'violet' | 'amber'
  motif: 'dash' | 'phone' | 'flow'
  problem: string
  approach: string
  result?: string
  kind: 'real' | 'demo'
  href?: string
  stack: string[]
}

/** Un produs real urmat de studii de capabilitate marcate ca demonstrații. */
export const projects: Project[] = [
  {
    id: 'contabo',
    tone: 'lime',
    motif: 'dash',
    title: 'Contabo — contabilitate completă în cloud',
    category: 'SaaS',
    glyph: '01',
    kind: 'real',
    href: 'https://contabo.space/',
    problem:
      'Documentele, facturarea, registrele și raportarea unei firme ajung ușor în aplicații și pași separați, greu de urmărit fără experiență contabilă.',
    approach:
      'O platformă online care grupează documentele primite și emise, e-Factura, banca și casa, balanța, TVA-ul, stocurile, salariile și rapoartele într-un flux ghidat.',
    result:
      'Produs SaaS funcțional, disponibil public, cu înscriere de firmă și moduri demo distincte pentru patron și contabil.',
    stack: ['SaaS', 'Cloud', 'e-Factura'],
  },
  {
    id: 'flux-comenzi',
    tone: 'coral',
    motif: 'dash',
    title: 'Panou de urmărire a comenzilor',
    category: 'Aplicații web',
    glyph: '02',
    kind: 'demo',
    problem:
      'Comenzile ajung din trei surse diferite, iar starea reală există doar într-un fișier partajat.',
    approach:
      'Un singur ecran cu stările comenzii, istoric de modificări și filtre salvabile. Actualizările sunt împinse către interfață fără reîncărcarea paginii.',
    stack: ['React', 'Node.js', 'PostgreSQL'],
  },
  {
    id: 'extragere-documente',
    tone: 'lime',
    motif: 'flow',
    title: 'Extragere de date din documente',
    category: 'AI aplicat',
    glyph: '03',
    kind: 'demo',
    problem:
      'Facturile primite pe e-mail sunt introduse manual în sistemul contabil.',
    approach:
      'Extragem câmpurile, marcăm nivelul de încredere și trimitem la verificare umană tot ce coboară sub pragul stabilit. Nimic nu intră automat fără confirmare.',
    stack: ['OCR', 'API LLM', 'Cozi'],
  },
  {
    id: 'sincronizare-stoc',
    tone: 'blue',
    motif: 'flow',
    title: 'Sincronizare de stoc între sisteme',
    category: 'Integrări',
    glyph: '04',
    kind: 'demo',
    problem:
      'Stocul din magazinul online rămâne în urma stocului din depozit.',
    approach:
      'Sincronizare pe eveniment, cu reîncercări și cu un jurnal în care se vede exact ce a eșuat și de ce. Diferențele sunt raportate zilnic.',
    stack: ['Webhooks', 'Cron', 'Redis'],
  },
  {
    id: 'portal-clienti',
    tone: 'sand',
    motif: 'dash',
    title: 'Portal pentru clienți',
    category: 'Aplicații web',
    glyph: '05',
    kind: 'demo',
    problem:
      'Clienții sună pentru informații care ar putea fi disponibile permanent.',
    approach:
      'Autentificare, documente, stadiul lucrărilor și facturi într-un singur loc, cu permisiuni pe organizație și jurnal de acces.',
    stack: ['React', 'Autentificare', 'S3'],
  },
  {
    id: 'raportare',
    tone: 'violet',
    motif: 'dash',
    title: 'Raportare operațională',
    category: 'Integrări',
    glyph: '06',
    kind: 'demo',
    problem:
      'Raportul de luni dimineață se face manual, din patru exporturi.',
    approach:
      'Colectare automată în timpul nopții, verificări de consistență și un raport care semnalează explicit datele lipsă în loc să le ascundă.',
    stack: ['ETL', 'PostgreSQL', 'Cron'],
  },
  {
    id: 'app-teren',
    tone: 'amber',
    motif: 'phone',
    title: 'Aplicație pentru echipe de teren',
    category: 'Mobil',
    glyph: '07',
    kind: 'demo',
    problem:
      'Echipa completează formulare pe hârtie, iar datele ajung în sistem după câteva zile.',
    approach:
      'Aplicație care funcționează offline, cu sincronizare la revenirea semnalului și rezolvarea conflictelor pe ultima modificare confirmată.',
    stack: ['PWA', 'IndexedDB', 'Sincronizare'],
  },
]

export const projectCategories = [
  'Toate',
  ...Array.from(new Set(projects.map((p) => p.category))),
]

export type Principle = { title: string; body: string }

export const principles: Principle[] = [
  {
    title: 'Estimări pe care le respectăm',
    body: 'Dacă o estimare se dovedește greșită, aflați în aceeași săptămână, nu la termenul de livrare. Preferăm o discuție incomodă devreme unei surprize târzii.',
  },
  {
    title: 'Codul vă aparține',
    body: 'Repository-ul, codul și documentația vă aparțin de la început. Găzduirea pe infrastructura noastră sau în mediul dumneavoastră este o alegere separată, explicită în propunere.',
  },
  {
    title: 'Fără magie nedocumentată',
    body: 'Fiecare decizie tehnică netrivială este scrisă undeva. Următorul dezvoltator care deschide proiectul trebuie să se descurce fără noi.',
  },
  {
    title: 'Refuzăm ce nu putem livra bine',
    body: 'Dacă o cerință depășește ce putem susține la calitate, spunem asta și, când se poate, recomandăm pe altcineva.',
  },
]

export const faq: { q: string; a: string }[] = [
  {
    q: 'Cum se stabilește prețul?',
    a: 'Pentru lucrări cu scop clar propunem preț fix pe etape. Pentru dezvoltare continuă lucrăm cu tarif lunar și un plan revizuit la fiecare ciclu. Ambele variante sunt scrise în propunere înainte să înceapă lucrul.',
  },
  {
    q: 'Lucrați cu proiecte începute de altcineva?',
    a: 'Da. Începem cu un audit tehnic plătit separat, la finalul căruia primiți raportul chiar dacă alegeți să nu continuați cu noi.',
  },
  {
    q: 'Cine deține codul și infrastructura?',
    a: 'Codul și documentația vă aparțin. Aplicația poate rula pe infrastructura noastră administrată sau în mediul dumneavoastră, în funcție de cerințele proiectului; alegerea și costurile sunt scrise în propunere.',
  },
  {
    q: 'Ce se întâmplă după lansare?',
    a: 'Puteți alege mentenanță lunară sau intervenție la cerere. În ambele cazuri, documentația de operare este livrată odată cu proiectul, ca să nu depindeți de un contract.',
  },
]

/** Capabilități afișate în banda de sub hero. */
export const capabilities = [
  'Aplicații cloud',
  'Produse SaaS',
  'Integrări API',
  'Automatizări',
  'AI aplicat',
  'Mentenanță',
]
