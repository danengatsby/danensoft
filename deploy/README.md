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

Build-ul generează paginile publice și `dist/404.html`. nginx folosește
`try_files $uri $uri/ =404` și servește intern `404.html` pentru fișierele sau
paginile inexistente, păstrând statusul HTTP 404 și adresa cerută. Publicați
build-ul înainte de activarea acestei configurații.

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
