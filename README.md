> Operare curentă: [deploy/operations.md](deploy/operations.md).

# Dan Enache — site de prezentare

Site de prezentare pentru aplicații cloud și produse SaaS: React + Vite +
TypeScript, pagini prerandate, navigație accesibilă și formular de contact validat.

## Instalarea pe AWS

Starea și comenzile pentru ubuntu-aws sunt în [deploy/ubuntu-aws.md](deploy/ubuntu-aws.md).

## Rulare

```bash
npm install
npm run dev        # server de dezvoltare
```

| Comandă             | Ce face                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Server local cu reîncărcare la salvare   |
| `npm run build`     | Verificare de tipuri + build + prerandare HTML |
| `npm run preview`   | Servește candidatul din `.build/dist/`   |
| `npm run lint`      | ESLint                                   |
| `npm run typecheck` | Verificare de tipuri, fără emitere       |
| `npm test`          | Vitest                                   |
| `npm run qa`        | Verificare în Chromium; acceptă o adresă: `npm run qa -- https://danenachesoft.space` |
| `npm run og:render` | Regenerează imaginea socială PNG din sursa SVG |
| `npm run csp:hash`  | Recalculează hash-ul CSP după modificarea scriptului din `index.html` |
| `npm run backup`    | Copie de siguranță imediată a bazei de mesaje |

Remote-ul `origin` este `https://github.com/danengatsby/danensoft.git`.
Prima sincronizare folosește conectorul GitHub: cele patru revizii istorice și
starea curentă sunt importate cu arbori de fișiere identici. Hash-urile commiturilor
importate diferă; mesajele includ hash-ul original. Istoricul local original
rămâne în ramura `archive/local-history-20260924`; `main` urmărește `origin/main`.
Pentru `git push` direct din shell este necesară autentificarea acestui server
la noul depozit; conectorul GitHub poate sincroniza modificările independent.
Depozitul conține sursele; baza SQLite și secretele din `/etc/danen/` rămân
în afara Git. O modificare locală devine copie externă numai după sincronizare.

## Pagini

| Rută         | Conținut                                                            |
| ------------ | ------------------------------------------------------------------- |
| `/`          | Oferta pe scurt, trei arii de servicii, patru proiecte și procesul colaborării |
| `/servicii`  | Cinci servicii în trei arii, navigare laterală, livrabile și detalii extensibile |
| `/proiecte`  | Contabo, PCS, Poetio, RVR Taxi și demonstrații filtrabile după categorie           |
| `/proiecte/:id` | Studii de caz pentru cele patru proiecte publicate, cu context, soluție, rezultat și acces separat la site |
| `/despre`    | Dan Enache, activitate, principii, proces și datele operatorului     |
| `/contact`   | Formular validat, date de contact și pașii de după trimitere         |
| `/confidentialitate` | Șapte secțiuni tematice cu un cuprins navigabil              |
| orice altceva| Pagină 404 cu rutele principale                                      |

Verificările rulate și limitele lor sunt în [QUALITY-REPORT.md](QUALITY-REPORT.md).

## Identitate și indexare

Identitatea și conținutul comercial se editează din
[`src/content/site.ts`](src/content/site.ts). Identitatea publică este Dan Enache. Operatorul juridic și adresa de contact
existente sunt păstrate în nota de confidențialitate și în datele structurate.

- Telefonul și profilurile sociale nu sunt afișate, fiindcă nu au fost furnizate.
- Nota de confidențialitate descrie comportamentul tehnic și identifică operatorul,
  dar trebuie revizuită juridic înainte de a fi tratată ca document final.
- `robots.txt`, sitemap-ul, canonical, Open Graph, Twitter Card și JSON-LD sunt
  configurate pentru domeniul `danenachesoft.space`.

Site-ul nu inventează testimoniale, certificări sau cifre de rezultat. Contabo, PCS, Poetio și RVR Taxi
sunt afișate primele, cu capturi locale din `public/projects/`, descrieri scurte
și link pe întregul card către studiul de caz intern. Fiecare studiu are un buton separat către site-ul proiectului. Demonstrațiile interne sunt într-o secțiune pliabilă
separată; alegerea unei categorii o deschide automat.

## Studii de caz

Contabo, PCS, Poetio și RVR Taxi au pagini la `/proiecte/contabo/`,
`/proiecte/pcpens/`, `/proiecte/poetio/` și `/proiecte/rvr-taxi/`.
Cardurile de pe Acasă și Proiecte duc la aceste pagini, în aceeași filă.
Butonul „Deschide site-ul” din studiu deschide site-ul extern într-o filă nouă.

Conținutul este preluat din `src/content/site.ts`: `problem`, `approach`,
`result`, `preview` și `summary`. Câmpul opțional `contribution` conține `role`
și `responsibilities`; se completează numai cu informații confirmate de autor.
În lipsa lui, secțiunile „Rolul meu” și „Contribuția mea” nu sunt afișate.
Textele au traduceri în `src/content/english.ts`. Nu sunt adăugate cifre de
performanță sau responsabilități personale deduse din capturile proiectelor.

Prerandarea folosește aceeași listă de proiecte ca aplicația. Doar proiectele
publicate au pagini proprii; identificatorii necunoscuți și demonstrațiile
interne afișează pagina 404. Cele patru adrese sunt incluse în sitemap.

## Formularul de contact

Formularul validează datele local, dar **nu trimite nimic** fără un endpoint
configurat. În lipsa lui afișează un mesaj care spune clar acest lucru și oferă
un link `mailto:` pre-completat.

Pentru trimitere reală:

```bash
cp .env.example .env.local
# completați VITE_CONTACT_ENDPOINT cu un endpoint care acceptă POST JSON
```

Endpoint-ul primește `{ name, email, organisation, topic, message }` și confirmă
salvarea printr-un status 2xx cu JSON `{ "ok": true }`. Nu puneți chei private în cod: variabilele `VITE_*`
ajung în bundle-ul livrat browserului.

Formularul așteaptă cel mult 15 secunde pentru răspunsul complet. Limita include
citirea JSON-ului, iar cererea este anulată la expirare sau părăsirea paginii.
În timpul trimiterii, câmpurile și butonul sunt dezactivate pentru a preveni
modificări pierdute și trimiteri simultane; selectorul de limbă rămâne activ.

Mesajele RO/EN disting expirarea, pierderea conexiunii, validarea, datele prea
lungi, accesul refuzat, limitarea frecvenței și indisponibilitatea serverului.
La 422, câmpurile cunoscute din lista `fields` primesc explicații locale și
focusul ajunge la primul câmp invalid. Corpurile tehnice ale erorilor nu sunt
afișate vizitatorului. Un răspuns HTML sau JSON fără `ok: true` nu confirmă succesul.

La eșec, datele se păstrează în formular și sunt incluse în linkul de e-mail.
Expirarea sau pierderea confirmării nu dovedesc că mesajul nu a fost salvat;
interfața recomandă verificarea e-mailului înainte de retrimitere. Formularul
nu reîncearcă automat. Acest comportament este separat de coada SMTP, care
reîncearcă livrarea notificărilor pentru mesajele deja salvate.

## Publicare

Site-ul rulează la **https://danenachesoft.space** (HTTP redirectează automat).

| Element | Valoare |
| --- | --- |
| Configurație nginx | `/etc/nginx/sites-available/danensoft` |
| Rădăcină servită | `/var/www/danensoft/current` |
| Certificat | Let's Encrypt, reînnoit automat de `certbot.timer` |
| API intern | `http://127.0.0.1:8091` |

Build-ul produce în `.build/dist/` 20 de pagini publice prerandate (10 RO și
10 EN), plus `404.html` și `en/404.html`.
nginx servește paginile valide inclusiv la acces direct, iar pentru adresele
inexistente afișează pagina de eroare cu status HTTP 404. Un exemplu comentat de configurație este în
[`deploy/nginx.conf.example`](deploy/nginx.conf.example).

Compilarea și publicarea sunt separate:

```bash
npm run lint && npm run typecheck && npm test
npm run build       # candidat în .build/dist; site-ul activ nu este modificat
npm run preview     # verificarea candidatului
npm run deploy      # release nou, comutare atomică și verificări HTTP
npm run releases    # versiunea curentă, precedentă și lista copiilor
npm run rollback    # revine la versiunea precedentă
```

nginx servește `current`, un link către `releases/<id>/site`. `npm run deploy`
verifică HTML-ul prerandat, rutele din sitemap, resursele și hash-urile CSP,
apoi comută atomic linkul. Verificarea publică urmărește identificatorul
release-ului, toate rutele și un răspuns 404. Dacă eșuează, linkul anterior
este restaurat. `previous` păstrează ținta de rollback. Se poate alege explicit
un release cu `npm run rollback -- <id>`.

Fișierele JS/CSS cu hash sunt păstrate în `shared-assets/`, servit separat de
nginx: rămân accesibile pentru file vechi și după rollback. Publicările
concurente sunt blocate prin `.deploy-lock/`. Dacă procesul este omorât,
verificați PID-ul din `.deploy-lock/owner.json` înainte de îndepărtarea manuală
a blocării. Release-urile și resursele partajate nu sunt șterse automat.

Configurația CSP activă este verificată înainte de publicare; dacă se schimbă
scripturile inline, rulați `npm run csp:hash` și actualizați configurația nginx
înainte de deploy. `DANEN_DEPLOY_URL` permite verificarea unei instanțe de test.
Fiecare release include site-ul static, API-ul și dependențele de producție. `api-current` indică runtime-ul activ. Revenirea restaurează codul frontend și backend; baza curentă este păstrată. Migrările trebuie să rămână compatibile cu versiunea precedentă. Detalii: [operations.md](deploy/operations.md).

Configurația AWS și versiunea de referință din 25 septembrie sunt documentate în [deploy/ubuntu-aws.md](deploy/ubuntu-aws.md).

## Design

Tokenurile de culoare, tipografie și spațiere sunt în
[`src/styles/tokens.css`](src/styles/tokens.css). Nu se încarcă fonturi externe
sau alte resurse de la terți.

Prezentarea companiei este definită în [`src/styles/business.css`](src/styles/business.css),
încărcat după stilurile de bază. Paginile folosesc titluri compacte, panouri
consecvente, navigare între secțiuni și grile adaptate ecranului. Serviciile sunt
grupate în dezvoltare, integrări și operare; detaliile tehnice sunt extensibile.
Pagina principală include o schemă HTML/CSS a soluției și toate cele patru proiecte.

Grupurile de servicii, rezumatele procesului și angajamentele se editează în
[`src/content/presentation.ts`](src/content/presentation.ts). `PageIntro`,
`ProcessSteps`, `PublishedProjectCard` și `ContactCTA` păstrează aceeași structură
între pagini; subsolul grupează navigarea, serviciile și contactul.
Interfața respectă preferința de mișcare redusă, iar linkurile către servicii
poziționează secțiunea sub antetul fix.

Tema implicită este verde-albastru închis, cu text deschis și accente mentă.
Comutatorul din antet oferă și o temă deschisă și salvează alegerea în `localStorage`,
sub cheia `dan-enache-theme`. Vechea cheie nu este preluată: vizitatorii existenți
văd noua identitate la prima vizită după schimbare.
Un script scurt din `index.html` aplică tema înainte de prima
randare, ca să nu apară o sclipire de temă greșită la încărcare.

## Română și engleză

Limba este stabilită de URL. Fiecare pagină publică are HTML prerandat în
ambele limbi, inclusiv navigarea, metadatele și textele formularului.

| Română | Engleză |
| --- | --- |
| `/` | `/en/` |
| `/servicii/` | `/en/services/` |
| `/proiecte/` | `/en/projects/` |
| `/proiecte/:id/` | `/en/projects/:id/` |
| `/despre/` | `/en/about/` |
| `/contact/` | `/en/contact/` |
| `/confidentialitate/` | `/en/privacy/` |

Comutatorul RO / EN folosește linkuri către aceeași pagină în cealaltă limbă,
accesibile și fără JavaScript. Linkurile interne păstrează limba curentă.
La schimbare se păstrează parametrii URL, ancora, filtrele și datele introduse
în formular. Pentru o adresă inexistentă, selectorul oferă pagina principală.
Reîncărcarea și istoricul browserului păstrează limba prin adresă, inclusiv
când stocarea este blocată. Vechea cheie `dan-enache-language` este eliminată
la pornirea aplicației; preferințele browserului nu schimbă limba URL-ului.

Traducerile se întrețin în [`src/content/english.ts`](src/content/english.ts),
prin `useLanguage().t()`. Registrul [`src/lib/routes.ts`](src/lib/routes.ts)
alimentează linkurile, metadatele, prerandarea și sitemap-ul generat la build.
Fiecare pagină are canonical propriu și alternative reciproce `ro`, `en` și
`x-default` (română). Sitemap-ul include toate cele 20 de adrese. Paginile 404
sunt traduse, au `noindex,follow` și nu au canonical sau alternative hreflang.
Paginile de cont și e-mailurile de confirmare/resetare sunt disponibile în RO și EN. Administrarea mesajelor și notificările formularului de contact folosesc româna.

`npm run qa` verifică ambele limbi și teme: 176 combinații de pagină și ecran.

## Mesajele din formular

Formularul trimite către `/api/contact`, un serviciu Node care rulează pe același
server și salvează mesajele într-o bază SQLite. Notificările sunt expediate
prin Gmail către `moldovanlux@gmail.com`.

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

Restaurarea necesită oprirea API-ului, salvarea stării curente, verificarea copiei și gestionarea fișierelor WAL/SHM. Urmați procedura din [deploy/operations.md](deploy/operations.md); nu înlocuiți baza în timp ce API-ul rulează.

Copiile locale rămân pe același server. Este pregătit și un mecanism extern
prin SSH/rsync, care necesită destinația furnizată de proprietar:

1. Configurați `/etc/danen/backup.env` și `/etc/danen/backup-ssh.conf` folosind
   exemplele din `deploy/`. Cheia SSH și fișierul cu gazdele cunoscute se păstrează
   în `/etc/danen/`, accesibile numai utilizatorului `danen`; verificați separat
   amprenta gazdei. Destinația trebuie să aibă `rsync` instalat.
2. Rulați serviciul `danen-backup-offsite` pentru o probă. Fiecare execuție creează
   o copie SQLite coerentă, o criptează împreună cu api.env, transferă arhiva într-un director privat nou, o descarcă din nou, compară SHA-256, o decriptează și verifică integritatea, relațiile și tabelele.
3. După prima probă reușită, activați `danen-backup-offsite.timer` (zilnic,
   03:45 UTC, cu întârziere aleatoare de până la 15 minute).

Numai directoarele externe cu `verified.json` sunt copii confirmate.
`/var/backups/danen/offsite-status.json` arată ultima reușită; o eroare ulterioară
este raportată de systemd, fără să șteargă reușita anterioară. Copiile de pe
serverul extern nu se șterg automat: retenția trebuie stabilită pe destinație.
Arhiva include SQLite și configurația SMTP, criptate AES-256-GCM înainte de transferul SSH. Cheia este păstrată separat în /etc/danen/backup.key și trebuie salvată într-un seif extern. Codul se păstrează în GitHub.
Până la configurare și prima probă reușită, **backupul extern nu este activ**.

Serviciul folosește module Node (`node:sqlite`, `node:crypto`, `node:http`) și, doar
pentru notificările prin e-mail, `nodemailer`.

Gmail este activ pe `smtp.gmail.com:587`, cu STARTTLS, expeditorul
`Dan Enache <moldovanlux@gmail.com>` și destinatarul `moldovanlux@gmail.com`.
Odată cu salvarea cererii, se programează independent notificarea către administrator
și o confirmare automată către adresa din formular, într-o coadă persistentă. Confirmarea include termenul
de răspuns de două zile lucrătoare și permite răspuns direct către Dan Enache;
nu include conținutul introdus în formular. Un eșec SMTP nu anulează salvarea cererii.
`Reply-To` folosește adresa vizitatorului în notificare și adresa de contact în
confirmare. Parola este păstrată numai pe server,
în `/etc/danen/api.env` (root:danen, permisiuni 640), niciodată în depozit.

**Verificat pe AWS la 25 septembrie 2026.** Formularul a salvat cererea, iar cele două notificări și invitația administratorului au fost identificate în Inbox prin Message-ID. Mesajele se păstrează și în baza de date. Pentru schimbarea
parolei de aplicație, creați una pentru contul `moldovanlux@gmail.com`, apoi rulați
într-un terminal al serverului:

```bash
sudo node /var/www/danensoft/scripts/setup-gmail.mjs
```

Comanda solicită parola fără afișare, verifică autentificarea înainte de salvare,
păstrează celelalte setări din fișier și repornește `danen-api`. Un test se trimite numai cu opțiunea explicită --send-test.
Dacă repornirea eșuează, restaurează configurația anterioară. Un răspuns de acceptare
SMTP confirmă predarea către Gmail; verificați și Inbox/Spam pentru primire.
Verificarea ulterioară fără expediere: `npm run mail:test`.

### Coada persistentă de notificări

La primirea formularului, mesajul și două notificări (`admin` și `confirmation`)
sunt salvate atomic în SQLite, în tabelele `messages` și `mail_jobs`. Răspunsul
HTTP 201 nu așteaptă conexiunea SMTP. E-mailurile sunt procesate în fundal, la
primirea cererii, la pornirea serviciului și apoi la fiecare 10 secunde.

Fiecare notificare are cel mult 6 încercări: prima imediat, apoi la 1 minut,
5 minute, 15 minute, 1 oră și 6 ore după eșecul precedent. Notificarea acceptată
nu este retrimisă când cealaltă eșuează. Fără SMTP configurat, notificările
rămân în așteptare fără a consuma încercări.

În `/admin` apar separat stările fiecărei notificări: în așteptare, în curs,
reîncercare programată, acceptat de SMTP sau necesită intervenție. După epuizarea
încercărilor, administratorul poate relua doar notificările eșuate. Butonul
folosește verificările existente de rol și origine. Mesajele mai vechi nu
sunt trimise retroactiv; pentru ele apare lipsa istoricului de livrare.

Coada fixează destinatarul, conținutul și un `Message-ID` la primirea mesajului.
Rezervările expiră după 2 minute și sunt reînnoite la fiecare 40 de secunde cât
timp expedierea continuă. Astfel, o notificare întreruptă poate fi recuperată
la repornire, iar două procesoare nu preiau simultan aceeași rezervare validă.
La oprire, serviciul așteaptă până la 45 de secunde operațiunea în curs.

SMTP nu permite garantarea unei singure livrări: dacă acceptă mesajul, dar
procesul se oprește înainte să salveze rezultatul, reîncercarea poate produce
un duplicat. `Message-ID` rămâne stabil, însă deduplicarea la destinatar nu
este garantată. „Acceptat de SMTP” nu dovedește sosirea în Inbox.

Ștergerea cererii elimină în cascadă notificările din coadă; o expediere deja
în curs nu poate fi retrasă. Conținutul duplicat al e-mailului este eliminat
din coadă după acceptarea SMTP. Pentru erori se păstrează o explicație generică,
numărul de încercări și următorul termen, fără răspunsul SMTP brut.
Copiile SQLite existente includ automat și coada; restaurarea unei copii vechi
poate relua notificări a căror acceptare a avut loc după realizarea acelei copii.

Implementare: `server/mail-queue.mjs` (persistență), `server/mail-worker.mjs`
(procesare), `server/mail.mjs` (conținut și transport). Migrarea este aditivă și
rulează la pornirea serviciului, fără schimbarea conturilor sau mesajelor.

### Conturi de client

Vizitatorii își pot crea cont la `/cont/inregistrare`. După autentificare, `/cont`
arată cererile trimise **din acel cont**, cu starea fiecăreia. Paginile sunt
randate pe server, ca și administrarea.

Legătura dintre cerere și cont se face prin sesiune. Cererile trimise fără autentificare rămân nelegate de vreun cont; nu se asociază retroactiv pe baza adresei.

Confirmarea adresei folosește linkuri valabile 24h și cere parola aleasă la înregistrare.
Recuperarea de la /cont/recuperare trimite linkuri de unică folosință, valabile 30min.
Resetarea invalidează sesiunile și linkurile vechi. Adăugați ?lang=en pentru paginile în engleză.

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
deja cont, actualizează parola și rolul și invalidează sesiunile anterioare. Parola în clar nu se salvează nicăieri.

### Protecții

- limitare de rată per IP: 5 mesaje / 10 minute, 8 autentificări / 15 minute și
  8 cereri de înregistrare/recuperare/retrimitere / 15 minute; maximum 3 e-mailuri de cont / oră per adresă
- limitare de rată per cont: 20 de autentificări / oră pe aceeași adresă,
  oricâte adrese IP ar folosi cine încearcă; socoteala se șterge la prima
  autentificare reușită
- parolele conturilor: între 10 și 128 de caractere, stocate cu scrypt
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
