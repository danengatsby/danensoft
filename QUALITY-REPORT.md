# Raport de verificare

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
