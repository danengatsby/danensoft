# Raport de verificare

## Formular: termen de așteptare și erori explicite — 25 septembrie 2026

Publicat în release-ul `2026-09-25T05-36-12-501Z-0c0ac0c4`.
Versiunea precedentă rămâne disponibilă prin `npm run rollback`.

- Cererea are un termen de 15 secunde, inclusiv citirea răspunsului JSON.
  Expirarea și părăsirea paginii anulează cererea; timerul și listener-ele
  sunt curățate după încheiere. O confirmare întârziată nu golește formularul.
- Câmpurile și butonul sunt dezactivate în timpul trimiterii, iar o rezervare
  sincronă împiedică două cereri simultane. Selectorul RO/EN păstrează cererea
  activă, datele și termenul inițial.
- Mesajele RO/EN disting conexiunea întreruptă, expirarea, validarea, datele
  prea lungi, accesul refuzat, prea multe încercări și erorile serverului.
  Codurile HTTP și corpurile tehnice ale răspunsurilor nu sunt afișate.
- La 422, lista `fields` este filtrată la câmpurile cunoscute; explicațiile
  locale sunt asociate accesibil câmpurilor, iar primul primește focusul.
  Pentru celelalte erori, focusul ajunge la mesajul de stare.
- Succesul necesită status 2xx și JSON cu `ok: true`, conform API-ului existent.
  HTML-ul sau un răspuns fără confirmare nu sunt prezentate ca succes.
- La eșec se păstrează datele și se oferă un link de e-mail precompletat.
  Expirarea, pierderea conexiunii sau a confirmării pot surveni după salvare;
  mesajul recomandă verificarea e-mailului înainte de retrimitere. Nu există
  reîncercări automate ale formularului. Serviciul Node și coada SMTP nu au
  fost modificate în această rundă.
- ESLint, TypeScript, build-ul cu 22 de pagini și toate cele 269 de teste din
  15 fișiere au trecut. Cele 31 de teste noi acoperă inclusiv răspunsuri
  blocate înainte de antete sau în corp, JSON invalid, anularea la demontare,
  răspunsuri întârziate, retrimiterea explicită și schimbarea limbii.
- Chromium pe candidat: 40 de scenarii în RO/EN, la 360 px cu tema deschisă
  și 1440 px cu tema întunecată. Verificate zece stări de trimitere, fără
  overflow, excepții JavaScript sau încălcări axe serious/critical.
- Pe HTTPS: șase probe pentru validare, expirare și succes, în ambele limbi.
  Termenul a fost verificat cu așteptare reală, fără accelerarea timerului.
  Rapoarte: `qa-screens/contact-request-candidate.json` și
  `qa-screens/contact-request-production.json`.

Toate cererile POST din probele de browser au fost interceptate și simulate.
Nu au fost salvate mesaje de test sau trimise e-mailuri reale. Verificarea
confirmă comportamentul formularului, fără a reverifica livrarea SMTP.

## Adrese RO / EN și HTML prerandat — 25 septembrie 2026

Publicat pe HTTPS și portul 8090 în release-ul
`2026-09-25T05-14-17-493Z-e7a500c7`; `previous` păstrează `baseline-20260924`.
Secțiunile de mai jos sunt istoricul verificărilor, la datele respective.

- Limba urmează adresa: rutele românești existente și cele engleze sub `/en/`.
  Browserul și vechea preferință locală nu schimbă limba paginii. Selectorul
  folosește linkuri reale către aceeași pagină și funcționează fără JavaScript.
- Build-ul produce 22 de pagini HTML: 10 publice în fiecare limbă și două
  pagini 404. Titlurile, descrierile, `html lang`, metadatele sociale,
  canonical și alternativele `ro` / `en` / `x-default` sunt prerandate.
  Sitemap-ul cu 20 de URL-uri este generat din același registru de rute.
- nginx servește o pagină 404 engleză sub `/en/`, cu status HTTP 404,
  `noindex,follow`, fără canonical sau hreflang. Configurația a trecut
  `nginx -t` și a fost reîncărcată pe ambele puncte de acces.
- ESLint, TypeScript și toate cele 238 de teste din 13 fișiere au trecut.
  Sunt acoperite accesul direct în EN, linkurile interne traduse, metadatele,
  istoricul, stocarea indisponibilă, păstrarea formularului și filtrelor.
- QA Chromium pe candidat: 176 de combinații (11 pagini × 2 limbi × 2 teme
  × 4 lățimi), fără overflow, erori de consolă, statusuri HTTP neașteptate
  sau încălcări axe serious/critical. Raport: `qa-screens/summary.json`.
- Verificare statică: 20 de pagini, fără erori de limbă, canonical sau
  reciprocitate hreflang; ambele pagini 404 exclud indexarea.
  Raport: `qa-screens/locale-static.json`.
- Chromium fără JavaScript, pe candidat și domeniul public: toate cele
  20 de pagini și ambele răspunsuri 404 verificate; selectorul de limbă
  navighează corect din fiecare pagină publică.
- Pe domeniul public, cu JavaScript: adresa EN prevalează asupra preferinței
  RO, formularul își păstrează datele la schimbarea limbii, iar parametrii,
  ancora, navigarea înapoi și reîncărcarea sunt corecte. Fără erori de runtime
  sau consolă. Rapoarte: `qa-screens/locale-smoke-candidate.json` și
  `qa-screens/locale-smoke-production.json`. Nu s-au trimis formulare sau
  e-mailuri reale în aceste verificări.
- Această publicare include și cele patru studii de caz pregătite anterior,
  în ambele limbi. Rolul și responsabilitățile personale necesită în continuare
  informații confirmate de autor pentru completarea conținutului.

Conturile, administrarea și e-mailurile automate rămân în română. Verificările
confirmă paginile servite și navigarea; indexarea efectivă în motoarele de
căutare și experiența în Firefox, Safari sau cititoare de ecran nu au fost testate.

## Publicare versionată, Git extern și backup — 24 septembrie 2026

- `npm run build` produce candidatul în `.build/dist/`. nginx servește
  `current`, către `releases/baseline-20260924/site`, pe HTTPS și portul 8090.
  Migrarea păstrează conținutul public anterior; `dist/` rămâne copie de rezervă.
- `npm run deploy` verifică HTML-ul, sitemap-ul, resursele și CSP, copiază într-un
  release nou, apoi comută atomic linkul. Verifică identificatorul public,
  paginile și 404; la eșec restaurează linkul anterior. `npm run rollback`
  folosește versiunea precedentă. Resursele cu hash sunt păstrate separat.
- ESLint, TypeScript, build-ul cu 11 pagini și 168 de teste au trecut.
  Testele de infrastructură acoperă rollback, eșecul verificării HTTP,
  publicări concurente, integritatea release-urilor, CSP și resurse lipsă.
- nginx a trecut validarea configurației. După reload, Acasă și Contact au
  răspuns 200, o adresă necunoscută 404, iar identificatorul baseline și
  resursele JS/CSS au fost accesibile pe ambele adrese.
- Backupul local a fost rulat prin systemd: succes. Copiile sunt validate
  înainte de rotație, au permisiuni 600, iar valorile de retenție invalide
  sunt respinse înaintea oricărei scrieri sau ștergeri.
- Mecanismul SSH/rsync a fost verificat cu server SSH temporar și bază fictivă:
  transfer, descărcare, SHA-256, integritate și marcaj `verified.json` reușite.
  Această probă locală nu reprezintă un backup extern de producție.
- Destinația bazei de date nu a fost furnizată; timerul extern nu este activat.
  Sunt pregătite scriptul și modelele systemd/SSH. Copiile externe nu sunt
  șterse automat; retenția se stabilește pe destinația aleasă.
- Remote Git configurat: `https://github.com/danengatsby/danensoft.git`.
  Exportul surselor și al istoricului este realizat separat prin conector;
  baza SQLite, secretele și artefactele de runtime sunt excluse din Git.

Limite: rollbackul acoperă numai site-ul static, nu serviciul Node sau baza.
Fișierele de release și resursele partajate necesită curățare administrată în timp.
Verificările HTTP de deploy nu înlocuiesc testarea vizuală a candidatului.

## Coada persistentă SMTP — 24 septembrie 2026

Activată în serviciul `danen-api` la 22:20 UTC, după o copie SQLite separată,
verificată cu `PRAGMA integrity_check`. Migrarea adaugă tabelul `mail_jobs`;
mesajele istorice nu sunt programate retroactiv pentru expediere.

- Cererea și cele două notificări sunt persistate într-o singură tranzacție.
  Notificarea administratorului și confirmarea vizitatorului se reîncearcă
  independent, maximum 6 încercări, cu întârzieri de 1 min / 5 min / 15 min /
  1 h / 6 h după eșecul precedent.
- Administrarea afișează starea fiecărei notificări și permite reluarea numai
  a celor eșuate. Acțiunea este protejată prin rol și verificarea originii.
- Rezervările persistente împiedică preluarea simultană a aceleiași notificări
  și permit recuperarea expedierilor întrerupte. Ștergerea cererii elimină
  notificările în cascadă; o expediere deja începută nu poate fi retrasă.
- ESLint, TypeScript și suita de 155 de teste au trecut. După adăugarea
  testului de procesare periodică și izolarea suplimentară a testului de
  administrare, cele 65 de teste backend au fost rerulate și au trecut
  (156 de teste în total în proiect).
- Testele acoperă tranzacția și rollbackul, programarea reîncercărilor,
  recuperarea printr-o conexiune nouă, lease-uri expirate, procesoare concurente,
  oprirea controlată, SMTP neconfigurat, reluarea manuală, autorizarea,
  protecția originii și ștergerea în cascadă. SMTP este simulat în teste.
- Chromium: administrarea cu date fictive la 360 și 1440 px, în ambele teme,
  fără overflow sau încălcări axe serious/critical după corectarea contrastului
  butonului de ștergere în tema întunecată. Raport:
  `qa-screens/mail-queue-admin.json`; capturi `mail-queue-admin-*.png`.
- După activare: serviciu activ, tabelul cozii prezent și gol, integritate
  SQLite validă, zero erori de chei externe. Pe HTTPS, autentificarea răspunde
  200, iar `/admin` redirecționează vizitatorii neautentificați cu 302.
- Nu au fost expediate e-mailuri reale de test și nu au fost create mesaje
  în producție. Acceptarea SMTP și primirea în Inbox nu au fost reverificate.

Limită: acceptarea SMTP urmată de oprirea procesului înainte de persistarea
rezultatului poate duce la un duplicat la reîncercare. Identificatorul e-mailului
rămâne stabil, dar deduplicarea destinatarului nu este garantată. Restaurarea
unui backup vechi poate relua notificări acceptate după momentul copiei.

## Studii de caz în portofoliu — 24 septembrie 2026

Implementare pregătită în surse, verificată într-o copie temporară a proiectului.
Nu a fost publicată în `dist/` pe serverul de producție în această rundă.

- Patru rute noi pentru Contabo, PCS, Poetio și RVR Taxi; cardurile duc la
  paginile interne, iar accesul extern este un buton distinct.
- Conținutul existent (context, soluție, rezultat) este afișat în RO și EN.
  Rolul și contribuțiile personale au suport în model și interfață, dar nu
  sunt completate până la confirmarea autorului.
- ESLint, TypeScript și 139 de teste în 9 fișiere au trecut.
- Build-ul izolat a generat 11 pagini HTML, inclusiv studiile de caz.
- Chromium: 32 de combinații pentru cele 4 pagini noi × RO/EN × întunecat/deschis
  × 360/1440 px, fără overflow, excepții JavaScript sau încălcări axe
  serious/critical. Canonical verificat pentru fiecare rută.
- Verificate navigarea din Acasă către studiu, întoarcerea în portofoliu și
  afișarea paginii 404 pentru un proiect necunoscut. Serverul Vite de
  previzualizare nu verifică statusul HTTP 404 din nginx.
- Rezultate: `qa-screens/case-study-validation.json`; capturi în
  `qa-screens/case-study-preview-desktop.png` și `case-study-preview-mobile.png`.
- Scriptul general QA include acum noile rute (176 de combinații); matricea
  completă nu a fost rerulată în această rundă. Nu s-au trimis mesaje reale.

## Comutator RO / EN — 24 septembrie 2026

Antetul include un selector de limbă accesibil, vizibil pe desktop și mobil.
Paginile publice, navigarea, titlurile și descrierile documentului, textele
accesibile și formularul sunt traduse în engleză. Alegerea se păstrează în
browser, se sincronizează între file și nu resetează formularul sau filtrele.
Nota de confidențialitate descrie și stocarea preferinței de limbă.

Validare:

- ESLint, TypeScript, 113 teste și build-ul cu 7 pagini prerandate au trecut.
- QA complet: 112 combinații (7 pagini × 4 lățimi × 2 teme × 2 limbi),
  fără erori de consolă, overflow, răspunsuri HTTP neașteptate sau încălcări
  axe serious/critical. Rezultate în `qa-screens/summary.json`.
- Cele șase teste noi verifică schimbarea limbii și metadatelor, persistența,
  sincronizarea între file, stocarea blocată, păstrarea filtrelor și a datelor
  formularului, traducerea erorilor și trimiterea valorilor originale.
- Pe HTTPS, verificarea în Chromium confirmă comutarea de la tastatură,
  navigarea mobilă, persistența după reîncărcare și păstrarea datelor formularului.
- Verificări suplimentare ale antetului la 320, 576, 1100 și 1280 px în ambele
  limbi și teme: 16 combinații fără overflow, selectorul de limbă vizibil.
  Rezultate în `qa-screens/language-interactions.json`.
- Toate cele șapte pagini au fost parcurse în engleză, inclusiv detaliile
  extensibile. Textele originale din dicționar nu au rămas în conținutul afișat.

Formularele din teste folosesc răspunsuri simulate. Nu s-au expediat e-mailuri
reale pentru această modificare. Conturile, administrarea și e-mailurile
automate rămân în română; selectorul acoperă site-ul public de prezentare.

## Reorganizare în stil de companie software — 24 septembrie 2026

Toate cele șapte pagini publice au o structură comună, cu titluri compacte,
fundal verde-albastru închis, informații grupate în panouri și un subsol mai scurt.
Acasă rezumă oferta, cele patru proiecte publicate și procesul de colaborare.
Serviciile sunt grupate în trei arii, cu navigare laterală și detalii extensibile.
Despre reunește profilul, principiile și procesul; Contact grupează formularul,
datele de contact și pașii următori. Confidențialitate are un cuprins navigabil.

Validare:

- ESLint, TypeScript, toate cele 107 teste și build-ul cu 7 pagini prerandate
  au trecut. Configurația CSP corespunde scripturilor inline din build.
- QA complet în Chromium: 56 combinații, fără erori de consolă, răspunsuri HTTP
  neașteptate, overflow orizontal sau încălcări axe serious/critical.
  Rezultatele sunt în `qa-screens/summary.json`.
- Verificate pe domeniul HTTPS: ancorele serviciilor și confidențialității,
  detaliile extensibile cu mouse și tastatură, întrebările frecvente,
  cele patru linkuri de proiect și filtrele SaaS/Mobil/Toate.
- Verificate meniul mobil, închiderea cu Escape, restaurarea focusului și
  închiderea după navigare. Acasă și Contact nu au overflow nici la 320 px,
  în ambele teme. Rezultate în `qa-screens/corporate-interactions.json`.
- Formularul a fost verificat în browser pentru câmpuri invalide și succes,
  cu răspuns API simulat. Nu s-au trimis mesaje reale pentru această reorganizare;
  notificarea administratorului și confirmarea expeditorului sunt păstrate.
- După ajustarea spațiului ancorelor sub antet, Servicii, Confidențialitate și
  Proiecte au fost reverificate pe HTTPS în 12 combinații (360/1440 px, ambele
  teme): HTTP 200, fără overflow sau încălcări axe serious/critical.
  Rezultate în `qa-screens/corporate-final.json`.

## Istoricul verificărilor

## Actualizare UI — 22 septembrie 2026

Interfața publică folosește acum o paletă fildeș/verde, titluri mai mari,
spațiere aerisită și componente coerente în ambele teme. Pagina principală
include o ilustrație cloud în HTML/SVG, carduri de servicii, un proiect Contabo
pus în evidență și etapele colaborării. Fundalul decorativ cu cod a fost eliminat.
Faviconul și imaginea socială au fost aliniate la noua paletă.

Meniul mobil are buton de închidere vizibil și fundal pe întreaga înălțime,
se închide și la alegerea paginii curente și blochează derularea din fundal.
Linkurile către servicii respectă fragmentul URL și spațiul ocupat de antet.

Validare:

- Lint, TypeScript, cele 95 de teste existente și build-ul cu 7 pagini
  prerandate au trecut.
- QA în Chromium pe HTTPS: 56 de combinații (7 pagini × 4 lățimi × 2 teme),
  fără erori de consolă, overflow orizontal sau încălcări axe serious/critical.
- Verificări de interacțiune pe HTTPS: meniul mobil (buton, fundal, Escape și
  pagina curentă), cele 5 ancore de servicii, accesul direct la o ancoră,
  filtrele portofoliului, persistența temei și preferința de mișcare redusă.
- Ajustarea finală a siglei și titlului pentru ecrane înguste a fost verificată
  separat la 320 și 360 px, în ambele teme.
- Capturile și raportul automat sunt în `qa-screens/`. Verificările publice
  nu au trimis mesaje și nu au creat conturi.

Build-ul rezultat este servit de nginx din `dist/`. Verificările de browser
acoperă Chromium; nu reprezintă un audit manual complet de accesibilitate.

## Actualizare — 20 septembrie 2026

Corecții verificate și activate în producție:

- Sesiunile sunt verificate și curățate folosind același format ISO UTC,
  inclusiv la milisecunda exactă a expirării.
- Mesajele de peste 5.000 de caractere sunt respinse cu explicație în formular
  și cu HTTP 422 în API; mesajele acceptate sunt salvate integral.
- JSON-ul cu structură invalidă primește 400, iar câmpurile cu tip incorect
  primesc 422. Cookie-urile deteriorate sunt ignorate și deconectarea fără
  cookie funcționează. Un Host sau URL invalid primește 400 fără oprirea Node.
- Exemplul nginx include rutele pentru conturi și administrare, cu politici
  CSP separate de site-ul static.
- Build-ul generează șase pagini publice și `404.html`. nginx servește pagina
  de eroare cu HTTP 404, păstrând URL-ul cerut, pe HTTPS și pe portul 8090.

Validare: 95 de teste în 6 fișiere, lint, TypeScript și build trecute.
QA-ul pe build-ul final, într-o instanță nginx temporară cu antetele din
depozit, a verificat 56 de combinații de rută, lățime și temă fără probleme.
După publicare, verificările HTTPS au confirmat răspunsurile 404 pentru GET și
HEAD, paginile valide, rutarea conturilor și navigarea din pagina de eroare.
Pagina 404 a fost verificată și fără JavaScript. Cazurile API au fost testate
pe baze temporare; verificările din producție nu au creat conturi sau mesaje.

Auditul dependențelor de mai jos este istoric; nu a fost rerulat în această
sesiune.

## Verificarea anterioară — 15 august 2026

Data verificării: 15 august 2026 (după revizuirea de securitate)
Versiune verificată: build-ul de producție servit la `https://danenachesoft.space`

## Verificări de cod

| Comandă | Rezultat |
| --- | --- |
| `npm run lint` | trecut, 0 avertismente |
| `npm run typecheck` | trecut |
| `npm test` | trecut, 53 de teste în 4 fișiere |
| `npm run build` | trecut, build Vite de producție generat |
| `npm run qa -- https://danenachesoft.space` | trecut, 56 de combinații, 0 probleme |
| `npm audit --omit=dev --audit-level=moderate` | trecut, 0 vulnerabilități |

QA-ul a rulat de data aceasta pe domeniul public, nu pe portul intern 8090:
doar acolo sunt active antetele de securitate, deci doar acolo se vede dacă
politica de conținut blochează ceva. Nu blochează: 0 erori de consolă.

## Probleme de securitate găsite și reparate (15 august 2026)

1. **Limitarea de rată se ocolea complet.** Cheia era primul element din
   `X-Forwarded-For`, dar nginx adaugă adresa reală la **finalul** valorii
   trimise de client (`$proxy_add_x_forwarded_for`), deci începutul listei era
   scris de vizitator. Confirmat pe serviciul live: 10 încercări de autentificare
   cu același antet fals se opreau la a 9-a cu `429`, iar 5 încercări cu antet
   diferit treceau toate. Cădeau astfel toate cele trei limitări: parole, conturi
   noi, mesaje. Cheia este acum `X-Real-IP`, pe care nginx îl scrie din
   `$remote_addr` și pe care clientul nu îl poate falsifica. Reverificat: cu
   `X-Forwarded-For` **și** `X-Real-IP` falsificate, limitarea se aplică.
2. **Conturile se puteau enumera după timpul de răspuns.** Mesajul de eroare era
   identic, dar pentru o adresă fără cont nu se calcula scrypt: 10 ms față de
   ~46 ms pentru o adresă existentă. Autentificarea verifică acum parola contra
   unui hash-momeală când adresa nu are cont. Măsurat după reparație: 36–61 ms în
   ambele cazuri.
3. **Schimbarea parolei nu dădea afară celelalte sesiuni** — care durează 30 de
   zile pentru conturile de client. Verificat cu două sesiuni paralele: cea care
   schimbă parola rămâne activă, cealaltă este invalidată imediat.
4. **Injecție de formule în exportul CSV.** Câmpurile care încep cu `= + - @`
   primesc acum un apostrof; altfel un mesaj trimis anonim, de forma
   `=HYPERLINK(...)`, s-ar fi executat la deschiderea exportului în Excel.
   Verificat cap-coadă, cu mesaj trimis prin formular și export descărcat.
5. **Lipseau antetele de securitate.** Adăugate în nginx: HSTS,
   `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`,
   plus o politică de securitate a conținutului. Paginile randate de serviciu au
   propria politică, trimisă din aplicație — verificat că browserul primește
   exact un antet CSP, nu două.
6. **Diverse:** redirectul după autentificare accepta `//gazda` (adresă absolută
   fără schemă); un corp peste 64 KB închidea conexiunea fără răspuns în loc să
   returneze `413`; verificarea de origine se completează acum cu
   `Sec-Fetch-Site`; scriptul `set-admin.mjs` afișa parola tastată în terminal.

Prima problemă era exploatabilă din exterior, fără cont. Restul cereau fie acces
de administrator, fie condiții mai înguste.

## Lipsuri operaționale acoperite (15 august 2026)

1. **Control de versiune.** Proiectul rula în producție fără git: nicio
   modificare nu avea istoric și nimic nu se putea anula. Depozit inițializat,
   cu starea curentă drept prim commit. Nu există copie la distanță.
2. **Copii de siguranță.** Baza cu cererile clienților nu avea niciuna.
   `danen-backup.timer` face zilnic o copie verificată în `/var/backups/danen`,
   cu păstrarea ultimelor 14. Testate: scrierea prin `VACUUM INTO` cu serviciul
   pornit, verificarea de integritate și rotația (cu limita coborâtă temporar,
   au rămas exact cele mai noi copii). Copiile stau pe același disc ca baza.
3. **Ghicirea parolelor pe un singur cont.** Limitarea era doar per IP, deci un
   atac împărțit pe mai multe adrese nu întâlnea nicio piedică. S-a adăugat o
   limitare per cont: 20 de încercări pe oră, indiferent de IP. Verificat cu 22
   de încercări de la 22 de adrese diferite — blocate de la a 21-a. Socoteala se
   șterge la prima autentificare reușită, verificat separat, ca un utilizator
   care greșește de câteva ori și apoi nimerește parola să nu rămână blocat.

   Limita e largă intenționat: orice prag mic pe cont devine o armă, fiindcă
   oricine poate bloca un cont străin greșind parola în locul lui.

## Verificare în browser

`npm run qa` (`scripts/qa.mjs`) pornește Chromium prin Playwright pe build-ul
real servit de nginx și parcurge **7 rute × 4 lățimi × 2 teme = 56 de
combinații**. Pentru fiecare verifică:

- codul de răspuns HTTP
- erorile din consolă și excepțiile de runtime
- overflow-ul orizontal, cu identificarea elementelor vinovate
- aplicarea corectă a temei salvate
- încălcările axe de nivel `serious` și `critical`, pe regulile
  `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`

Capturile rezultate ajung în `qa-screens/` (ignorat de git), una pentru fiecare
combinație, cu pagină întreagă la 1440 px.

Rute: `/`, `/servicii`, `/proiecte`, `/despre`, `/contact`,
`/confidentialitate`, rută necunoscută → 404.
Lățimi: 360, 768, 1024, 1440 px. Teme: întunecată și deschisă.

**Rezultat final: 0 erori de consolă, 0 overflow orizontal, 0 încălcări axe
serious/critical.**

## Probleme găsite și reparate la redesign

1. **Accent ilizibil în subsol** — marca folosea `--c-accent` (culoarea pentru
   fundal deschis) pe fundalul întunecat al subsolului, sub pragul AA. Trecut pe
   `--c-deep-accent`, varianta destinată suprafețelor întunecate.
2. **Titlu rupt în cinci rânduri** — la 1440 px titlul din hero se fragmenta
   („Software / care / înlocuiește / munca / manuală."). Coloana de text a fost
   lărgită și dimensiunea maximă redusă de la 5.1rem la 4.1rem.

## Probleme găsite și reparate în runda anterioară

1. **Contrast insuficient în tema deschisă** — `--c-ink-subtle` era `#6b7b93`,
   adică 4.08:1 pe fundal, sub pragul AA de 4.5:1 pentru text mic. Afecta 6–36
   elemente pe fiecare pagină: supratitluri, etichete, taguri, indicii de
   formular, subsol. Corectat la `#5a6880` (5.34:1), păstrând ierarhia față de
   `--c-ink-muted` (7.06:1). Tema întunecată trecea deja.
2. **Frază ruptă în casetele de notă** — `.notice` avea `display: grid`, deci
   fiecare copil inline (`<strong>`, `<code>`, textul) devenea rând separat, iar
   punctul final rămânea orfan pe ultimul rând. Trecut pe `display: block`, cu
   stil dedicat pentru `<code>`.
3. **Card orfan în grilele de patru** — `auto-fit` producea 3 + 1 la lățimi
   mari, la „Principii” și la întrebările frecvente. Fixat pe două coloane
   peste 46rem, deci 2 × 2 la orice lățime de desktop.

Primele două nu erau detectabile fără browser; a treia nu era detectabilă fără
inspecție vizuală.

## Serviciul de mesaje

Verificat manual pe serverul live, prin cereri HTTP:

| Caz | Rezultat |
| --- | --- |
| Trimitere validă | `201`, mesaj salvat în baza de date |
| Date invalide | `422`, cu lista câmpurilor respinse |
| Corp peste 64 KB | `413` |
| Capcană anti-robot completată | `200`, dar fără înregistrare salvată |
| `/admin` fără sesiune | `302` către `/cont/autentificare?catre=/admin` |
| Export CSV fără sesiune | `302` către autentificare |
| Parolă greșită | `401` |
| Parolă corectă | `302` și cookie de sesiune |
| Cookie peste HTTPS | conține `HttpOnly`, `SameSite=Strict`, `Secure` |
| Cerere cu `Origin` străin | `403` |
| Cerere cu `Sec-Fetch-Site: cross-site` | `403` |

`/admin` răspunde cu `302`, nu cu `401`, de când administrarea folosește aceeași
pagină de autentificare ca restul conturilor.

Suplimentar, un test complet prin Chromium a completat formularul real de pe
`/contact`: mesajul de succes a apărut, înregistrarea a ajuns în baza de date și
consola nu a raportat erori. Datele de test au fost șterse după verificare.

## Verificări structurale automate

Independent de browser, `src/test/structure.test.tsx` verifică pentru fiecare
rută: un singur `h1`, reperele `main` / `banner` / `contentinfo`, linkul de
sărire la conținut, absența linkurilor interne către rute inexistente, un nume
accesibil pe fiecare link și buton, `rel="noopener"` pe linkurile externe și
etichetă pentru fiecare câmp de formular.

## Interacțiuni verificate

- meniul mobil: deschidere, închidere cu `Escape`, revenirea focusului pe buton
- închiderea meniului la schimbarea rutei, inclusiv la navigarea „înapoi”
- comutatorul zi/noapte: pornire pe tema deschisă, comutare dus-întors,
  păstrarea preferinței între vizite, setarea `color-scheme`
- navigarea din meniu și din subsol
- filtrarea listei de proiecte
- formular gol: erorile apar, sunt asociate prin `aria-describedby`, focusul
  sare pe primul câmp invalid
- formular valid fără endpoint: mesajul spune explicit că datele **nu** au fost
  trimise și oferă linkul `mailto:`

## Ce rămâne neverificat

- Testarea s-a făcut doar pe Chromium. Firefox și Safari nu au fost verificate.
- Nu s-a testat cu cititor de ecran real (NVDA, VoiceOver); axe acoperă
  regulile automatizabile, nu experiența completă.
- Nu există teste de performanță (Lighthouse) sau de încărcare.

## Limitări intenționate ale site-ului

- Formularul are endpoint-ul `/api/contact` configurat în build-ul de producție;
  modul demonstrativ rămâne disponibil numai când variabila este eliminată.
- Identitatea Moldovan Lux, datele juridice și adresa de contact sunt completate.
  Telefonul și profilurile sociale nu se afișează, nefiind furnizate.
- Nota de confidențialitate identifică operatorul și descrie comportamentul
  tehnic, dar rămâne de revizuit juridic.
- Indexarea este permisă. Există sitemap, robots.txt, canonical, metadate sociale,
  JSON-LD și HTML prerandat pentru cele șase rute publice.
- Contabo este prezentat ca produs real; celelalte proiecte rămân marcate drept
  demonstrații, fără cifre sau testimoniale inventate.

## Redesign Dan Enache — 24 septembrie 2026

Identitatea comercială este acum Dan Enache: antet, subsol, pagini, metadate,
favicon și imagine socială. Datele operatorului juridic și adresa de contact
existente sunt păstrate. Cheia de temă rămâne compatibilă cu vizitele anterioare.

Designul folosește fildeș, teracotă și grafit, o ilustrație proprie HTML/SVG,
servicii într-o grilă editorială, prezentarea Contabo și o secțiune personală.
Tema întunecată și preferința de mișcare redusă sunt respectate.

Validare:
- ESLint, TypeScript și toate cele 95 de teste existente au trecut.
- Build-ul final a generat cele 7 pagini prerandate.
- QA complet: 56 combinații (7 rute × 4 dimensiuni × 2 teme), fără erori
  de consolă, status HTTP sau overflow; o singură problemă de contrast,
  cauzată de suprapunerea ilustrației pe mobil, a fost identificată și corectată.
- După corecție, pagina principală de pe domeniul HTTPS a fost reverificată
  la 320, 360 și 390 px în ambele teme: zero încălcări axe serious/critical,
  zero overflow, zero erori de consolă, HTTP 200. Rezultatele sunt în
  `qa-screens/redesign-validation.json`; raportul inițial rămâne în `summary.json`.
- Verificate în browser: navigarea mobilă, închiderea meniului după navigare,
  filtrele SaaS/Mobil, comutarea temei și ancora `/servicii#cloud`.
- Hash-ul CSP pentru datele structurate a fost adăugat, configurația nginx
  validată și reîncărcată. Domeniul public servește noul build cu HTTP 200.

Nu au fost trimise mesaje reale prin formular în timpul verificărilor.
