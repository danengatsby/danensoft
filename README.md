# Moldovan Lux — site de prezentare

Site de prezentare pentru aplicații cloud și produse SaaS: React + Vite +
TypeScript, pagini prerandate, navigație accesibilă și formular de contact validat.

## Rulare

```bash
npm install
npm run dev        # server de dezvoltare
```

| Comandă             | Ce face                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Server local cu reîncărcare la salvare   |
| `npm run build`     | Verificare de tipuri + build + prerandare HTML |
| `npm run preview`   | Servește build-ul din `dist/`            |
| `npm run lint`      | ESLint                                   |
| `npm run typecheck` | Verificare de tipuri, fără emitere       |
| `npm test`          | Vitest                                   |
| `npm run qa`        | Verificare în Chromium; acceptă o adresă: `npm run qa -- https://danenachesoft.space` |
| `npm run og:render` | Regenerează imaginea socială PNG din sursa SVG |
| `npm run csp:hash`  | Recalculează hash-ul CSP după modificarea scriptului din `index.html` |
| `npm run backup`    | Copie de siguranță imediată a bazei de mesaje |

Proiectul este sub git din 15 august 2026. Depozitul este local, fără copie la
distanță: `git remote add origin …` când există unde.

## Pagini

| Rută         | Conținut                                                            |
| ------------ | ------------------------------------------------------------------- |
| `/`          | Poziționare cloud/SaaS, servicii, proiect real și contact             |
| `/servicii`  | Cele cinci servicii, cu livrabile și tehnologii, plus întrebări      |
| `/proiecte`  | Produsul Contabo și demonstrații filtrabile după categorie           |
| `/despre`    | Echipa, mod de lucru, proces și principii                            |
| `/contact`   | Date de contact și formular validat                                  |
| `/confidentialitate` | Notă de confidențialitate, link doar în subsol               |
| orice altceva| Pagină 404 cu rutele principale                                      |

Verificările rulate și limitele lor sunt în [QUALITY-REPORT.md](QUALITY-REPORT.md).

## Identitate și indexare

Identitatea și conținutul comercial se editează din
[`src/content/site.ts`](src/content/site.ts). Sunt configurate denumirea Moldovan
Lux, datele juridice, adresa de contact, administratorul și proiectul Contabo.

- Telefonul și profilurile sociale nu sunt afișate, fiindcă nu au fost furnizate.
- Nota de confidențialitate descrie comportamentul tehnic și identifică operatorul,
  dar trebuie revizuită juridic înainte de a fi tratată ca document final.
- `robots.txt`, sitemap-ul, canonical, Open Graph, Twitter Card și JSON-LD sunt
  configurate pentru domeniul `danenachesoft.space`.

Site-ul nu inventează testimoniale, certificări sau cifre de rezultat. Contabo
este marcat drept produs real și trimite la aplicația publică; restul cardurilor
sunt marcate explicit drept demonstrații interne.

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

Build-ul produce în `dist/` șase pagini publice prerandate și `404.html`.
nginx servește paginile valide inclusiv la acces direct, iar pentru adresele
inexistente afișează pagina de eroare cu status HTTP 404. Un exemplu comentat de configurație este în
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
cheia `moldovan-lux-theme`. Un script scurt din `index.html` aplică tema înainte de prima
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
| Copii de siguranță | `/var/backups/danen`, zilnic (`systemctl status danen-backup.timer`) |
| Zonă de administrare | `/admin` |

### Copii de siguranță

`danen-backup.timer` rulează zilnic la 03:20 și păstrează ultimele 14 copii în
`/var/backups/danen`. Fiecare copie este verificată imediat după scriere
(`PRAGMA integrity_check` plus numărarea rândurilor); dacă verificarea pică,
unitatea eșuează și se vede în `systemctl status danen-backup`.

```bash
sudo -u danen node scripts/backup.mjs   # copie imediată, în afara programului
systemctl list-timers danen-backup      # când rulează următoarea
journalctl -u danen-backup -n 20        # ce s-a întâmplat la ultimele rulări
```

Copierea folosește `VACUUM INTO`, nu `cp`: baza rulează în modul WAL, deci
scrierile recente stau în `messages.db-wal`, iar o copiere a fișierului
principal ar da o copie veche sau incoerentă. Serviciul poate rămâne pornit în
timpul copierii.

Restaurare (serviciul trebuie oprit, altfel scrie peste):

```bash
systemctl stop danen-api
sudo -u danen cp /var/backups/danen/messages-<data>.db /var/lib/danen/messages.db
sudo -u danen rm -f /var/lib/danen/messages.db-wal /var/lib/danen/messages.db-shm
systemctl start danen-api
```

Copiile stau pe **același disc** ca baza: apără de ștergere accidentală și de
stricarea fișierului, nu de pierderea serverului. Pentru asta ar trebui duse în
altă parte.

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

- limitare de rată per IP: 5 mesaje / 10 minute, 8 autentificări / 15 minute și
  5 conturi noi / oră
- limitare de rată per cont: 20 de autentificări / oră pe aceeași adresă,
  oricâte adrese IP ar folosi cine încearcă; socoteala se șterge la prima
  autentificare reușită
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
