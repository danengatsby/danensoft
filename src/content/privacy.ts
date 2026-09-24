/**
 * Notă de confidențialitate — DRAFT.
 *
 * ⚠ Textul de mai jos descrie corect comportamentul tehnic al acestui site,
 *    dar NU este un document juridic verificat. Înainte de publicare trebuie
 *    revizuit de un consultant și completat cu datele reale ale operatorului
 *    (denumire, sediu, CUI, responsabil cu protecția datelor dacă e cazul).
 */

export type PrivacySection = { title: string; body: string[] }

export const privacyUpdated = '14 august 2026'

export const privacySections: PrivacySection[] = [
  {
    title: 'Cine prelucrează datele',
    body: [
      'Operatorul este compania identificată în subsolul site-ului. Datele de identificare legală sunt momentan neconfigurate și trebuie completate înainte de publicare.',
      'Pentru orice întrebare legată de datele dumneavoastră, ne puteți scrie la adresa de e-mail din pagina de contact.',
    ],
  },
  {
    title: 'Ce date colectăm prin formular',
    body: [
      'Formularul de contact solicită numele, adresa de e-mail, opțional organizația, subiectul ales și mesajul dumneavoastră. Nu cerem alte date și nu folosim câmpuri ascunse de profilare.',
      'Există un singur câmp ascuns, o capcană anti-robot care trebuie să rămână goală. Conținutul lui nu este stocat și nu este transmis nicăieri.',
    ],
  },
  {
    title: 'Ce se întâmplă cu mesajul trimis',
    body: [
      'Mesajul este transmis către serverul nostru și salvat într-o bază de date găzduită tot pe acel server. Nu folosim un serviciu extern de formulare, deci datele nu ajung la un furnizor terț.',
      'Accesul la mesajele salvate este restricționat: doar contul cu rol de administrator le poate vedea. Nu sunt publice și nu apar nicăieri pe site.',
      'Nu reținem adresa dumneavoastră IP împreună cu mesajul. Adresele IP sunt folosite temporar, doar în memoria serverului, pentru a limita trimiterile repetate și a bloca roboții.',
    ],
  },
  {
    title: 'Contul de client',
    body: [
      'Crearea unui cont este opțională. Dacă vă faceți cont, stocăm numele, adresa de e-mail și parola în formă criptată ireversibil (scrypt). Nu putem citi parola și nu o putem recupera.',
      'Adresa de e-mail nu este verificată printr-un mesaj de confirmare, pentru că nu avem încă un serviciu de e-mail configurat. Din acest motiv, un cont nou nu vede cererile trimise anterior de la aceeași adresă: în cont apar doar cererile trimise cât timp sunteți autentificat. Este o măsură deliberată, ca nimeni să nu poată citi cererile altcuiva înregistrându-se cu adresa lui.',
      'Autentificarea folosește un cookie de sesiune strict necesar, valabil 30 de zile, pe care îl ștergeți ieșind din cont.',
    ],
  },
  {
    title: 'Temeiul și durata prelucrării',
    body: [
      'Prelucrăm mesajul pentru a vă răspunde și, dacă se ajunge acolo, pentru a pregăti o ofertă. Temeiul este interesul legitim de a răspunde unei solicitări comerciale primite de la dumneavoastră, respectiv demersurile precontractuale.',
      'Păstrăm mesajul atât timp cât este necesar discuției și obligațiilor legale ulterioare. Ne puteți cere oricând ștergerea; putem șterge o înregistrare individual, iar dacă nu există o obligație legală de păstrare, o facem.',
    ],
  },
  {
    title: 'Cookie-uri, analiză și servicii externe',
    body: [
      'Site-ul public nu folosește cookie-uri, nu are instrumente de analiză a traficului și nu încarcă fonturi, hărți sau scripturi de la terți. Nicio pagină nu face cereri către alte domenii. Zona de administrare, accesibilă doar nouă, folosește un cookie de sesiune strict necesar pentru autentificare.',
      'Singura informație salvată local este preferința dumneavoastră pentru tema deschisă sau întunecată, păstrată în `localStorage` sub cheia `danen-theme`. Rămâne în browser, nu ne este transmisă și dispare când ștergeți datele site-ului.',
      'Serverul care găzduiește site-ul înregistrează, ca orice server web, adresa IP și pagina accesată, în jurnale tehnice folosite pentru funcționare și securitate.',
    ],
  },
  {
    title: 'Drepturile dumneavoastră',
    body: [
      'Aveți dreptul de acces, rectificare, ștergere, restricționare, opoziție și portabilitate, conform Regulamentului (UE) 2016/679. Ne puteți contacta pe adresa din pagina de contact pentru oricare dintre ele.',
      'Dacă răspunsul nostru nu vă mulțumește, aveți dreptul să depuneți o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal.',
    ],
  },
]
