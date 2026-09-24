# Configurația de sistem

Fișierele de aici sunt **copii** ale configurației care rulează pe server.
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
