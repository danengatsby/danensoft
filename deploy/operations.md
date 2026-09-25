# Operare și recuperare — 25 septembrie 2026

Aplicația rulează pe Ubuntu AWS, în /var/www/danensoft. Configurația cu secrete este /etc/danen/api.env (root:danen, 0640), iar SQLite este /var/lib/danen/messages.db (danen:danen, 0600).
Nu copiați aceste fișiere în Git.

## Publicare și revenire

Din /var/www/danensoft, ca ubuntu:

    npm ci
    npm run lint
    npm run typecheck
    npm test
    npm run build
    npm audit --audit-level=moderate
    npm run deploy

Fiecare release conține site/, runtime/server, runtime/node_modules (doar producție), package-lock.json și manifeste de integritate.
current indică site-ul; api-current indică runtime-ul aceleiași versiuni.
API-ul nu mai pornește din arborele de lucru. Modificările server/*.mjs devin active numai prin deploy.
Publicarea face backup SQLite înainte de restart și verifică identitatea API-ului, markerul frontend, rutele sitemap și 404.
La eșec se revine la frontendul și API-ul anterioare. Pot exista câteva secunde de indisponibilitate la restart.

    npm run releases
    npm run rollback
    npm run rollback -- ID

Migrările din această versiune sunt aditive și compatibile cu versiunea precedentă.
Rollbackul codului păstrează datele curente; nu restaurează automat o bază veche și nu șterge cererile primite după publicare.
Migrările distructive necesită separat o procedură de migrare și restaurare testată.
Nu schimbați un release după publicare și nu ștergeți shared-assets folosite de pagini deja deschise.
Backupul inițial al codului/configurației de instalare este în /var/backups/danen-deploy, accesibil doar root.

## Conturi

/cont/autentificare și ?lang=en oferă RO/EN.
Înregistrarea trimite o confirmare valabilă 24h; verificarea cere și parola aleasă la înregistrare.
Recuperarea folosește linkuri de unică folosință valabile 30min și invalidează toate sesiunile.
Linkurile sunt generate din DANEN_PUBLIC_URL (implicit https://danenachesoft.space), niciodată din Host.
GET nu consumă tokenul; tokenurile nu intră în jurnalele de acces nginx ale /cont/.
Hashul tokenului este stocat în account_tokens; mesajul încă netrimis conține linkul în coada privată SQLite. După livrare payloadul este șters.
Cozile sunt persistente și reiau expedierile după restart. Nu există asociere retroactivă automată a mesajelor după adresă.

Administratorul moldovanlux@gmail.com își setează parola din invitația trimisă prin e-mail.
Pentru un link nou:

    sudo -u danen /usr/local/bin/node scripts/invite-admin.mjs moldovanlux@gmail.com

Alternativ, setare interactivă fără afișarea parolei:

    sudo -u danen /usr/local/bin/node scripts/set-admin.mjs moldovanlux@gmail.com

## SMTP

Parola de aplicație comunicată în conversație trebuie revocată de titular în Google.
Configurați înlocuitoarea direct în terminal, fără a o publica:

    sudo /usr/local/bin/node /var/www/danensoft/scripts/setup-gmail.mjs

Comanda verifică autentificarea înainte de salvare și repornește serviciul; nu trimite mail de test implicit.
Pentru verificare fără trimitere:

    sudo -u danen /usr/local/bin/node --env-file=/etc/danen/api.env scripts/test-mail.mjs

## Backup și restaurare

danen-backup.timer rulează zilnic și păstrează 14 copii SQLite verificate, în /var/backups/danen.
Testarea restaurării citește efectiv o copie și verifică integrity_check și foreign_key_check.

O copie externă criptată a fost încărcată în Google Drive și verificată prin descărcare, decriptare și verificare SQLite. Transferul zilnic direct de pe server necesită autorizarea Google separată descrisă mai jos. Alternativa SSH/rsync rămâne disponibilă.
Copia externă include baza și api.env, criptate AES-256-GCM; serverul descarcă, decriptează și verifică copia înainte de a marca succesul.
Cheia de 32 octeți este /etc/danen/backup.key, root:danen, 0640. Salvați separat o copie a cheii într-un seif/parolier accesibil la recuperare.
Pierderea serverului și a singurei copii a cheii ar face imposibilă decriptarea. Nu încărcați cheia alături de arhiva externă.

Configurați /etc/danen/backup.env după deploy/backup.env.example și /etc/danen/backup-ssh.conf după exemplu.
Adăugați DANEN_BACKUP_KEY=/etc/danen/backup.key. Confirmați amprenta cheii SSH a destinației printr-un canal de încredere.
Cheia SSH și known_hosts trebuie să poată fi citite de utilizatorul danen.

    sudo systemctl start danen-backup-offsite.service
    sudo systemctl enable --now danen-backup-offsite.timer
    sudo cat /var/backups/danen/offsite-status.json

Nu activați timerul înainte de primul transfer verificat. Copiile externe nu se șterg automat.
Verificare nedistructivă a unei arhive descărcate:

    sudo -u danen /usr/local/bin/node scripts/inspect-encrypted-backup.mjs /cale/backup.enc /etc/danen/backup.key

Pentru restaurare operațională: opriți API-ul, faceți o copie a stării curente, decriptați într-un director privat, verificați SQLite,
înlocuiți baza numai cu serviciul oprit și mutați deoparte și vechile fișiere -wal/-shm. Restabiliți owner danen:danen și 0600.
Verificați api.env separat; nu înlocuiți necontrolat parole SMTP deja rotite. Porniți API-ul și verificați /api/health și autentificarea.
Migrarea datelor de pe vechiul server rămâne dependentă de acces și de existența unui export; nu s-a presupus că datele noi le înlocuiesc.

## Monitorizare

danen-monitor.timer verifică la fiecare 5 minute HTTPS/API, expirarea certificatului, vechimea backupurilor și cozile de e-mail.
Alertele și revenirea sunt trimise la MAIL_TO; un incident neschimbat este repetat cel mult o dată pe zi.
Raport: /var/lib/danen-monitor/status.json, vizibil administratorului și la /admin/health.
Lipsa backupului extern este raportată explicit ca problemă până la configurare.
Workflow-ul GitHub Production availability verifică suplimentar site-ul și API-ul din afara serverului la fiecare 15 minute. Eșecurile apar în GitHub Actions; notificările depind de preferințele GitHub ale titularului. Execuțiile programate pot fi întârziate de GitHub, iar într-un repository public fără activitate pot fi dezactivate după 60 de zile. Verificați periodic starea workflow-ului.
Pentru diagnostic:

    sudo systemctl status danen-api nginx danen-monitor.timer danen-backup.timer certbot.timer
    sudo journalctl -u danen-api -u danen-monitor --since today
    curl -fsS https://danenachesoft.space/api/health

## GitHub și dezvoltare

GitHub Actions verifică instalarea, sintaxa JS, lint, tipuri, teste, build și audit.
Dependabot verifică săptămânal npm și lunar acțiunile GitHub.
Pentru dezvoltare, porniți API-ul separat cu o bază temporară și SMTP neconfigurat. Vite proxy direcționează /api, /admin și /cont către localhost:8091, fără a intercepta /contact.

## Google Drive

Folder privat al titularului: https://drive.google.com/drive/folders/1dP3WsOyIKCZ01WNeNT0CCDj_VEFSdkwH

Copia din 25 septembrie 2026, ora 15:57 UTC, include 1 utilizator (administrator), 1 mesaj de test și api.env.
SHA-256: 9edaa999af6ffd89c360eca67c8f2b441fc0b2d3b429fa177756f4a92c122e22.
A fost descărcată prin conectorul Google Drive, comparată și decriptată; integritatea SQLite și relațiile au trecut verificarea.
Cheia de recuperare a fost copiată separat în C:\Users\danen\.ssh\danensoft-backup.key, cu acces numai pentru contul Windows al titularului.
Nu încărcați cheia în folderul cu arhivele.

Conectorul Google Drive din conversație permite copiile manuale, dar nu expune autorizarea sa către server.
Pentru operațiuni zilnice, rclone este instalat pe server; configurați conexiunea danensoft direct în terminal:

    sudo -u danen rclone config --config /etc/danen/drive/rclone.conf

Creați un OAuth client propriu de tip Desktop în Google Cloud Console, activați Google Drive API și adăugați contul titular drept utilizator. Rclone avertizează că ID-ul OAuth comun nu va mai funcționa în 2026: https://rclone.org/drive/#making-your-own-client-id.

Aplicația aflată în modul Testing poate avea tokenurile de reîmprospătare revocate după 7 zile. Pentru o programare zilnică fără reautorizări săptămânale, publicați aplicația personală în Production; Google poate afișa avertismentul că aplicația nu este verificată. Detaliile și pașii Google se pot schimba; urmați documentația rclone de mai sus.

Autorizarea serverului fără browser se face prin tunel SSH: https://rclone.org/remote_setup/.
În prima fereastră PowerShell de pe PC, lăsați tunelul deschis:

    ssh -L 53682:127.0.0.1:53682 -N ubuntu-aws

Într-o a doua fereastră PowerShell, conectați-vă și porniți configurarea:

    ssh ubuntu-aws
    sudo -u danen /usr/local/bin/rclone config --config /etc/danen/drive/rclone.conf

Creați remote-ul danensoft, selectați drive, introduceți client ID și secret în terminal, alegeți scope-ul drive și răspundeți y la autentificarea automată în browser. Scope-ul drive acordă aplicației acces complet la fișierele Drive. Google va cere consimțământ explicit. ID-ul folderului de mai sus este rădăcina folosită de joburile rclone, dar nu restrânge permisiunile OAuth ale tokenului.
Deschideți în browserul PC-ului adresa http://127.0.0.1:53682/... pe care rclone o afișează în terminalul serverului și aprobați aplicația în contul titularului. Finalizați configurarea în terminalul serverului.

Introduceți client ID, secret și token numai în terminal; configurația privată trebuie să rămână în /etc/danen/drive/rclone.conf. Nu copiați valorile în GitHub, documentație sau conversații.

După autorizare:

    sudo /var/www/danensoft/deploy/activate-drive-backup.sh

Scriptul verifică transferul prin descărcare/decriptare/restaurare înainte de activarea timerului.
danen-backup-drive.timer este pregătit pentru 03:45 UTC zilnic, cu întârziere aleatoare de până la 15 minute.
Nu este încă activat: lipsa autorizării este raportată separat de existența copiei manuale.
Rclone poate actualiza tokenul numai în directorul privat /etc/danen/drive (danen:danen, 0700; config 0600).
Fișierul public drive.env.example conține doar numele conexiunii, calea configurației și ID-ul folderului.

Creați o arhivă criptată pentru transfer manual cu:

    sudo -u danen /usr/local/bin/node /var/www/danensoft/scripts/create-encrypted-backup.mjs

Scriptul zilnic păstrează ultimele 14 arhive criptate atât local, cât și în folderul Drive și șterge arhivele mai vechi numai după verificarea descărcării și decriptării copiei noi.
