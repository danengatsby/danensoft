# Danen Soft Studio — site de prezentare

Site de prezentare pentru un studio de software: React + Vite + TypeScript, cinci
pagini reale, navigație accesibilă, formular de contact validat.

## Rulare

```bash
npm install
npm run dev        # server de dezvoltare
```

| Comandă             | Ce face                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Server local cu reîncărcare la salvare   |
| `npm run build`     | Verificare de tipuri + build de producție|
| `npm run preview`   | Servește build-ul din `dist/`            |
| `npm run lint`      | ESLint                                   |
| `npm run typecheck` | Verificare de tipuri, fără emitere       |
| `npm test`          | Vitest                                   |
| `npm run qa`        | Verificare în Chromium; acceptă o adresă: `npm run qa -- https://danenachesoft.space` |
| `npm run csp:hash`  | Recalculează hash-ul CSP după modificarea scriptului din `index.html` |

## Pagini

| Rută         | Conținut                                                            |
| ------------ | ------------------------------------------------------------------- |
| `/`          | Poziționare, servicii pe scurt, mod de lucru, principii             |
| `/servicii`  | Cele patru servicii, cu livrabile și tehnologii, plus întrebări      |
| `/proiecte`  | Studii de capabilitate, filtrabile după categorie                    |
| `/despre`    | Mod de lucru, ce nu promitem, proces, principii                      |
| `/contact`   | Date de contact și formular validat                                  |
| `/confidentialitate` | Notă de confidențialitate (draft, link doar în subsol)       |
| orice altceva| Pagină 404 cu rutele principale                                      |

Verificările rulate și limitele lor sunt în [QUALITY-REPORT.md](QUALITY-REPORT.md).

## Ce trebuie completat înainte de publicare

Toate datele de identitate și de contact sunt **placeholder** și se editează
dintr-un singur fișier: [`src/content/site.ts`](src/content/site.ts).

- `company.name` / `company.initials` — numele „Danen Soft Studio” a fost derivat din
  calea proiectului; înlocuiți-l cu denumirea reală.
- `company.email`, `company.phone` — valori de exemplu, neapărat de înlocuit.
- `company.legal` — denumire legală, CUI, Reg. Com.
- `social` — linkurile duc momentan către paginile principale ale rețelelor.

De asemenea:

- `index.html` conține `noindex, nofollow` cât timp datele sunt demonstrative —
  ștergeți linia la publicarea pe domeniul final.
- Nota de confidențialitate (`src/content/privacy.ts`) descrie corect
  comportamentul tehnic, dar trebuie revizuită juridic și completată cu datele
  operatorului și cu numele furnizorului ales pentru formular.

Site-ul nu conține nume de clienți, testimoniale, certificări sau cifre de
rezultat. Elementele din `/proiecte` sunt marcate explicit în pagină drept
exemple interne, nu lucrări de client.

## Formularul de contact

Formularul validează datele local, dar **nu trimite nimic** fără un endpoint
configurat. În lipsa lui afișează un mesaj care spune clar acest lucru și oferă
un link `mailto:` pre-completat.

Pentru trimitere reală:

```bash
cp .env.example .env.local
# completați VITE_CONTACT_ENDPOINT cu un endpoint care acceptă POST JSON
```

Endpoint-ul primește `{ name, email, organisation, topic, message }` și trebuie
să răspundă cu un status 2xx. Nu puneți chei private în cod: variabilele `VITE_*`
ajung în bundle-ul livrat browserului.

## Publicare

Site-ul rulează la **https://danenachesoft.space** (HTTP redirectează automat).

| Element | Valoare |
| --- | --- |
| Configurație nginx | `/etc/nginx/sites-available/danenachesoft` |
| Rădăcină servită | `/var/www/danen/dist` |
| Certificat | Let's Encrypt, reînnoit automat de `certbot.timer` |
| Adresă internă de rezervă | `http://159.69.200.202:8090` |

Build-ul produce fișiere statice în `dist/`. Fiind o aplicație cu rutare pe
client, serverul întoarce `index.html` pentru rutele necunoscute, altfel accesul
direct la `/servicii` ar da 404. Un exemplu comentat de configurație este în
[`deploy/nginx.conf.example`](deploy/nginx.conf.example).

După orice modificare de conținut: `npm run build`. nginx servește direct din
`dist/`, deci schimbarea apare imediat, fără reload.

## Design

Tokenurile de culoare, tipografie și spațiere sunt în
[`src/styles/tokens.css`](src/styles/tokens.css); schimbarea paletei sau a scării
tipografice se face doar de acolo. Nu se încarcă fonturi externe — site-ul nu
face nicio cerere către terți.

Tema implicită este cea deschisă (hârtie caldă). Comutatorul din antet schimbă
în tema întunecată (albastru închis) și salvează alegerea în `localStorage`, sub
cheia `danen-theme`. Un script scurt din `index.html` aplică tema înainte de prima
randare, ca să nu apară o sclipire de temă greșită la încărcare.

## Mesajele din formular

Formularul trimite către `/api/contact`, un serviciu Node care rulează pe același
server și salvează mesajele într-o bază SQLite. Nu există furnizor extern.

| Componentă | Unde |
| --- | --- |
| Cod serviciu | [`server/`](server/) |
| Bază de date | `/var/lib/danen/messages.db` (proprietar: utilizatorul `danen`) |
| Conturi și parole (hash) | tabelul `users` din baza de date |
| Serviciu | `systemctl status danen-api` |
| Zonă de administrare | `/admin` |

Serviciul folosește module Node (`node:sqlite`, `node:crypto`, `node:http`) și, doar
pentru notificările prin e-mail, `nodemailer`.

> **Notificările prin e-mail sunt inactive.** `/etc/danen/api.env` conține doar
> `DANEN_HTTPS=1`, fără variabilele `SMTP_*`, așa că mesajele se salvează în baza
> de date fără să anunțe pe nimeni. Variabilele necesare sunt listate în
> [`server/mail.mjs`](server/mail.mjs); după completare, verificați cu
> `npm run mail:test`.

### Conturi de client

Vizitatorii își pot crea cont la `/cont/inregistrare`. După autentificare, `/cont`
arată cererile trimise **din acel cont**, cu starea fiecăreia. Paginile sunt
randate pe server, ca și administrarea.

Legătura dintre cerere și cont se face prin sesiune, nu prin adresa de e-mail
scrisă în formular. Motivul: adresele nu sunt verificate prin e-mail, deci
potrivirea după adresă ar permite cuiva să citească cererile altcuiva
înregistrându-se cu adresa lui. Cererile trimise fără autentificare rămân
nelegate de vreun cont.

Când se adaugă un serviciu de e-mail, pasul următor firesc este confirmarea
adresei și resetarea parolei — ambele lipsesc acum.

### Administrare

`/admin` cere parolă, listează mesajele, arată din ce cont provine fiecare (sau
că a fost trimisă anonim), permite schimbarea stării (primit / în lucru / ofertat
/ închis, vizibilă clientului în contul lui), marcarea ca citit, ștergerea
individuală (necesară pentru cererile de ștergere GDPR) și exportul CSV. Paginile
sunt randate pe server, deci nimic din zona de administrare nu ajunge în bundle-ul
public.

Administratorul se autentifică **prin aceeași pagină ca toți utilizatorii**,
la `/cont/autentificare`, cu e-mail și parolă. Diferența este doar rolul salvat
în baza de date: contul cu `role = 'admin'` vede `/admin`, restul sunt trimiși
în contul propriu. Rolul nu poate fi obținut prin înregistrare publică.

Creare sau schimbare de administrator:

```bash
sudo -u danen node scripts/set-admin.mjs email@exemplu.ro
```

Comanda cere parola interactiv, o transformă în hash scrypt și, dacă adresa are
deja cont, doar îi ridică rolul. Parola în clar nu se salvează nicăieri.

### Protecții

- limitare de rată: 5 mesaje / 10 minute, 8 autentificări / 15 minute și 5 conturi
  noi / oră, per IP
- parolele conturilor: minimum 10 caractere, stocate cu scrypt
- la autentificare greșită, același mesaj **și același timp de răspuns**,
  indiferent dacă adresa are cont sau nu
- schimbarea parolei invalidează toate celelalte sesiuni ale contului
- capcană anti-robot: cererea primește 200, dar nu se salvează nimic
- validare și pe server, independent de cea din browser
- cookie de sesiune `HttpOnly`, `SameSite=Strict`, `Secure`; expiră la 12 ore
  pentru administratori și la 30 de zile pentru conturile de client
- pe cererile care schimbă starea: antetul `Origin`, iar în lipsa lui
  `Sec-Fetch-Site`
- corpul cererii este limitat la 64 KB (peste, răspunde `413`)
- exportul CSV neutralizează celulele care încep cu `= + - @`, ca un mesaj
  trimis din exterior să nu devină formulă în Excel
- antete de securitate din nginx (`snippets/danen-headers.conf`): HSTS,
  `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`
- politică de securitate a conținutului: pentru site-ul static din
  `snippets/danen-csp.conf`, iar pentru paginile randate de serviciu direct din
  `server/pages.mjs`, cu hash pe singurul script inline
- adresele IP sunt folosite doar în memorie, pentru limitare; nu se salvează cu
  mesajul

> **Limitarea de rată depinde de nginx.** Cheia este antetul `X-Real-IP`, pe care
> nginx îl scrie din `$remote_addr`. `X-Forwarded-For` **nu** se folosește: nginx
> îi adaugă adresa reală la final, deci începutul listei este scris de vizitator,
> iar cine citea primul element putea ocoli complet limitarea schimbând antetul.
> Dacă serviciul ajunge după alt proxy, acela trebuie să seteze `X-Real-IP`;
> altfel toți vizitatorii intră în aceeași găleată.

### HTTPS

Activ. Zona de administrare este la **https://danenachesoft.space/admin**, iar
`DANEN_HTTPS=1` este setat în `/etc/danen/api.env`, deci cookie-ul de sesiune
primește flagul `Secure`.
