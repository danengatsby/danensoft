/**
 * Notă de confidențialitate — DRAFT.
 *
 * ⚠ Textul de mai jos descrie corect comportamentul tehnic al acestui site,
 *    dar NU este un document juridic verificat. Înainte de publicare trebuie
 *    revizuit de un consultant înainte de publicarea ca document juridic final.
 */

export type PrivacySection = { title: string; body: string[] }

export const privacyUpdated = '25 septembrie 2026'

export const privacySections: PrivacySection[] = [
  {
    title: 'Cine prelucrează datele',
    body: [
      'Operatorul este MOLDOVAN LUX S.R.L., cu sediul în Iași, CUI 30342978, înregistrată la Registrul Comerțului sub nr. J22/1026/21.06.2012.',
      'Pentru orice întrebare legată de datele dumneavoastră, ne puteți scrie la moldovanlux@gmail.com.',
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
      'Mesajul este transmis către serverul nostru și salvat într-o bază de date găzduită pe acel server. O notificare care include numele, adresa de e-mail, organizația și subiectul completate, precum și textul mesajului, este expediată prin serviciul Gmail al Google către moldovanlux@gmail.com, pentru a putea răspunde solicitării.',
      'La adresa de e-mail completată în formular trimitem, tot prin Gmail, o confirmare automată de primire. Confirmarea nu include textul mesajului sau detaliile organizației.',
      'Accesul la mesajele salvate este restricționat: doar contul cu rol de administrator le poate vedea. Nu sunt publice și nu apar nicăieri pe site.',
      'Nu reținem adresa dumneavoastră IP împreună cu mesajul. Adresele IP sunt folosite temporar, doar în memoria serverului, pentru a limita trimiterile repetate și a bloca roboții.',
    ],
  },
  {
    title: 'Contul de client',
    body: [
      'Crearea unui cont este opțională. Dacă vă faceți cont, stocăm numele, adresa de e-mail și parola în formă criptată ireversibil (scrypt). Nu putem citi parola și nu o putem recupera.',
      'Confirmăm adresa de e-mail printr-un link trimis prin Gmail, valabil 24 de ore. Recuperarea parolei folosește un link separat, valabil 30 de minute și utilizabil o singură dată. Resetarea parolei închide sesiunile existente. Contul afișează doar cererile trimise cât timp sunteți autentificat; cererile anterioare nu sunt asociate automat.',
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
      'Navigarea fără autentificare nu necesită cookie-uri. Conturile de client și administrarea folosesc un cookie strict necesar pentru autentificare, valabil 30 de zile pentru clienți și 12 ore pentru administratori. Nu folosim instrumente de analiză a traficului și nu încărcăm fonturi, hărți sau scripturi de la terți.',
      'Preferința pentru temă este salvată local în browser, în localStorage, sub cheia dan-enache-theme. Nu ne este transmisă și dispare când ștergeți datele site-ului. Limba este determinată de adresa paginii: paginile în engleză folosesc prefixul /en/.',
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
