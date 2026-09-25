#!/usr/bin/env bash
set -euo pipefail

if [[ $(id -u) -ne 0 ]]; then
    echo "Run with sudo: sudo bash /var/www/danensoft/deploy/activate-https.sh" >&2
    exit 1
fi

# Validate DNS before requesting a certificate; never issue for the old server.
python3 - <<'DNS'
import socket, sys
expected = '3.66.232.196'
valid = True
for domain in ['danenachesoft.space', 'www.danenachesoft.space']:
    try:
        addresses = {entry[4][0] for entry in socket.getaddrinfo(domain, 80, type=socket.SOCK_STREAM)}
    except socket.gaierror:
        addresses = set()
    print(domain + ': ' + (', '.join(sorted(addresses)) or 'DNS unavailable'))
    if addresses != {expected}:
        valid = False
if not valid:
    print('DNS must resolve both names only to ' + expected + ' before HTTPS activation.', file=sys.stderr)
    sys.exit(2)
DNS

if [[ ${1:-} == --check ]]; then
    nginx -t
    echo "DNS and Nginx preflight passed."
    exit 0
fi

nginx -t
install -d -m 0700 /var/backups/danen-config
backup="/var/backups/danen-config/https-$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 0700 "$backup"
cp -p /etc/nginx/sites-available/danensoft "$backup/nginx.conf"
cp -p /etc/nginx/snippets/danen-headers.conf "$backup/headers.conf"
cp -p /etc/danen/api.env "$backup/api.env"

certbot --nginx --non-interactive --agree-tos     --email moldovanlux@gmail.com     --cert-name danenachesoft.space     -d danenachesoft.space -d www.danenachesoft.space --redirect

nginx -t
systemctl reload nginx
curl --fail --silent --show-error     --resolve danenachesoft.space:443:127.0.0.1     https://danenachesoft.space/ -o /dev/null

python3 - <<'CONFIG'
import os,re,tempfile
from pathlib import Path
def replace(path,content):
    stat=path.stat()
    fd,name=tempfile.mkstemp(prefix=path.name+'.',dir=path.parent)
    try:
        with os.fdopen(fd,'w') as output:
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
        os.chown(name,stat.st_uid,stat.st_gid)
        os.chmod(name,stat.st_mode & 0o777)
        os.replace(name,path)
    finally:
        if os.path.exists(name): os.unlink(name)
env=Path('/etc/danen/api.env')
text=re.sub(r'^DANEN_HTTPS=.*(?:\n|$)','',env.read_text(),flags=re.M)
replace(env,text.rstrip()+'\nDANEN_HTTPS=1\n')
headers=Path('/etc/nginx/snippets/danen-headers.conf')
text='\n'.join(line for line in headers.read_text().splitlines()
    if 'X-Robots-Tag' not in line and '# Preview on AWS' not in line)+'\n'
replace(headers,text)
CONFIG
systemctl restart danen-api
systemctl is-active --quiet danen-api
nginx -t
systemctl reload nginx
systemctl enable --now certbot.timer
certbot renew --dry-run --no-random-sleep-on-renew --cert-name danenachesoft.space
echo "HTTPS activated; Secure session cookies enabled; renewal tested."
