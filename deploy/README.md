# Configurația de sistem

Fișierele de aici sunt **copii** ale configurației care rulează pe server și un
**model nginx** pentru instalare.
Sistemul citește din `/etc`, nu din depozit, deci o modificare făcută aici nu
are niciun efect până nu este copiată la locul ei.

Ținute în depozit ca să existe istoric și ca serverul să poată fi refăcut de la
zero — nu ca sursă de adevăr.

| Fișier | Locul lui pe server |
| --- | --- |
| `danen-api.service` | `/etc/systemd/system/danen-api.service` |
| `danen-backup.service` | `/etc/systemd/system/danen-backup.service` |
| `danen-backup.timer` | `/etc/systemd/system/danen-backup.timer` |
| `nginx-snippet-headers.conf` | `/etc/nginx/snippets/danen-headers.conf` |
| `nginx-snippet-csp.conf` | `/etc/nginx/snippets/danen-csp.conf` |
| `nginx.conf.example` | model pentru `/etc/nginx/sites-available/…` |

Ce **nu** este aici, intenționat:

- `/etc/danen/api.env` — conține secrete (parola SMTP). Rămâne doar pe server.
- `/etc/nginx/sites-available/danenachesoft` — are căi de certificate scrise de
  certbot, specifice mașinii. `nginx.conf.example` acoperă partea care contează.

Modelul trimite `/api/`, `/cont` (potrivire exactă), `/cont/` și `/admin…` către
serviciul Node de pe `127.0.0.1:8091`. `/contact` rămâne o pagină statică.
Blocurile proxy includ antetele comune de securitate; paginile Node își trimit
propria politică CSP, fără politica suplimentară a site-ului static.

Build-ul generează 20 de pagini publice în RO și EN, `.build/dist/404.html`
și `.build/dist/en/404.html`. nginx folosește `try_files $uri $uri/ =404`.
Blocul `location /en/` servește intern `/en/404.html` pentru adresele engleze
inexistente; celelalte folosesc `/404.html`. Ambele păstrează statusul HTTP 404
și adresa cerută, au `Cache-Control: no-store` și antetele de securitate.
Publicați build-ul înainte de activarea acestei configurații.

## După modificare

```bash
# systemd
cp deploy/danen-*.service deploy/danen-*.timer /etc/systemd/system/
systemctl daemon-reload
systemctl restart danen-api

# nginx
cp deploy/nginx-snippet-headers.conf /etc/nginx/snippets/danen-headers.conf
cp deploy/nginx-snippet-csp.conf     /etc/nginx/snippets/danen-csp.conf
nginx -t && systemctl reload nginx
```

## Verificarea că ce rulează este ce scrie aici

```bash
diff deploy/danen-api.service       /etc/systemd/system/danen-api.service
diff deploy/nginx-snippet-csp.conf  /etc/nginx/snippets/danen-csp.conf
```

Hash-ul din `nginx-snippet-csp.conf` depinde de scriptul inline din
`index.html`; după orice modificare a lui, `npm run build && npm run csp:hash`.

## Publicare în versiuni

Configurația nginx folosește `root /var/www/danen/current` și
`alias /var/www/danen/shared-assets/` în blocul `/assets/`.
`npm run build` scrie numai în `.build/dist/`; `npm run deploy` pregătește
un director nou în `releases/` și comută linkul `current` prin rename atomic.
`npm run rollback` folosește `previous`. Verificările sunt executate după
comutare; la eșec se restaurează ținta anterioară.

## Backup extern (neactivat fără destinație)

Fișiere pregătite: `backup.env.example`, `backup-ssh.conf.example`,
`danen-backup-offsite.service`, `danen-backup-offsite.timer`.
Nu copiați fișierele `.example` ca atare pentru activare: completați mai întâi
gazda, directorul, cheia dedicată și amprenta verificată a serverului extern.

```bash
cp deploy/danen-backup-offsite.service deploy/danen-backup-offsite.timer /etc/systemd/system/
systemctl daemon-reload
systemctl start danen-backup-offsite.service
systemctl status danen-backup-offsite.service
# Numai după verificarea primei copii externe:
systemctl enable --now danen-backup-offsite.timer
```

GitHub păstrează codul în `danengatsby/danensoft`; mesajele și conturile nu
se includ în depozit. Configurația SMTP, cheia SSH și cheia certificatului
necesită o strategie separată de păstrare a secretelor pentru refacerea serverului.
