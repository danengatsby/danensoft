#!/usr/bin/env bash
set -euo pipefail
if [[ $EUID -ne 0 ]]; then echo "Run with sudo"; exit 1; fi
test -s /etc/danen/drive/rclone.conf
chown -R danen:danen /etc/danen/drive
chmod 700 /etc/danen/drive
chmod 600 /etc/danen/drive/rclone.conf
systemctl daemon-reload
systemctl start danen-backup-drive.service
# systemd conditions may skip units successfully; confirm that a real run wrote a recent receipt.
python3 - <<'PY'
import json,datetime
from pathlib import Path
report=json.loads(Path('/var/backups/danen/offsite-status.json').read_text())
stamp=datetime.datetime.fromisoformat(report['verifiedAt'].replace('Z','+00:00'))
assert report.get('automated') is True and report.get('provider')=='google_drive'
assert (datetime.datetime.now(datetime.timezone.utc)-stamp).total_seconds()<600
PY
systemctl enable --now danen-backup-drive.timer
systemctl start danen-monitor.service
echo "Google Drive daily backup activated and verified."
