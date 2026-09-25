> Procedura actuală pentru conturi, publicare completă, monitorizare și backup: [operations.md](operations.md).

# Instalare ubuntu-aws

SMTP și HTTPS activate și verificate la 2026-09-25.

## Configurația activă

- Site: https://danenachesoft.space și https://www.danenachesoft.space.
- DNS: ambele nume indică 3.66.232.196; HTTP redirecționează la HTTPS.
- Repository: /var/www/danensoft, ramura main.
- Node.js 24.21.0: /opt/node-v24.21.0-linux-x64; comenzi în /usr/local/bin.
- Nginx: /etc/nginx/sites-available/danensoft; porturi 80 și 443.
- Site static: /var/www/danensoft/current; resurse în shared-assets.
- API: danen-api.service, utilizator danen, 127.0.0.1:8091.
- Configurație privată: /etc/danen/api.env, root:danen, 0640.
- SQLite: /var/lib/danen/messages.db, danen:danen, 0600.
- SMTP: smtp.gmail.com:587 cu STARTTLS; cont moldovanlux@gmail.com.
- DANEN_HTTPS=1; cookie-uri HttpOnly, SameSite=Strict și Secure.
- Certificat Let's Encrypt: /etc/letsencrypt/live/danenachesoft.space/.
- Expirarea certificatului curent: 2026-12-24; certbot.timer activ.
- Backup zilnic SQLite: danen-backup.timer, /var/backups/danen, 14 copii.

Configurația de e-mail și cheile private rămân în afara repository-ului.
Nu afișați api.env în jurnale, conversații sau rapoarte.

## Publicare

Din directorul proiectului:

    npm ci
    npm run lint
    npm run typecheck
    npm test -- --maxWorkers=2
    npm run build
    npm run csp:hash
    npm run deploy

Publicarea verifică implicit https://danenachesoft.space.
Dacă se modifică scripturile inline, actualizați hash-urile din
deploy/nginx-snippet-csp.conf și /etc/nginx/snippets/danen-csp.conf,
validați cu nginx -t și reîncărcați Nginx înainte de publicare.
Nu copiați modelul HTTP nginx.conf.example peste configurația TLS activă.

## Operare și verificări

    systemctl status nginx danen-api
    systemctl list-timers certbot.timer danen-backup.timer
    sudo journalctl -u danen-api -n 50
    sudo systemctl start danen-backup.service
    sudo certbot renew --dry-run --no-random-sleep-on-renew --cert-name danenachesoft.space
    sudo /usr/local/bin/node --env-file=/etc/danen/api.env scripts/test-mail.mjs

Comanda SMTP fără argument suplimentar verifică doar conexiunea și autentificarea;
nu trimite e-mail. Rularea cu un destinatar trimite un mesaj și necesită cerere explicită.

## Înlocuirea parolei de aplicație Gmail

Din PowerShell:

    ssh -t ubuntu-aws "sudo /usr/local/bin/node /var/www/danensoft/scripts/setup-gmail.mjs"

Parola se introduce ascuns. Scriptul verifică autentificarea înainte de salvare,
păstrează permisiunile fișierului și DANEN_HTTPS, apoi repornește API-ul.
Nu trimite un mesaj de test implicit. Notificările din coadă se procesează normal.

## Administrator

Administratorul moldovanlux@gmail.com a fost creat și a primit invitația pentru setarea parolei. Setare interactivă alternativă:

    sudo -u danen /usr/local/bin/node scripts/set-admin.mjs ADRESA_ADMINISTRATORULUI

## Dovezi de verificare

- Autentificare Gmail reușită; variabilele SMTP confirmate în procesul API.
- Testul formularului și invitația administratorului: trei mesaje acceptate de SMTP și identificate în Inbox.
- HTTP public: 301 către HTTPS.
- HTTPS: certificat validat din exterior; domeniul răspunde 200; www redirecționează 301 către domeniul principal.
- Pagini RO/EN, contact și autentificare: 200; rută inexistentă: 404.
- Cookie-ul de sesiune include Secure.
- Antetul temporar X-Robots-Tag noindex a fost eliminat după migrare.
- Simularea reînnoirii Certbot a reușit pentru domeniu și www.
