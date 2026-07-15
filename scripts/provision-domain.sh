#!/usr/bin/env bash
set -euo pipefail

DOMAIN="shajara.pm.sa"
ROOT_DOMAIN="pm.sa"
SUBDOMAIN="shajara"
CPANEL_USER="pmsa"
DOCUMENT_ROOT="/mnt/home-storage/home/pmsa/apps/shajara"
RELATIVE_DOCUMENT_ROOT="apps/shajara"

log() {
  printf '[shajara-domain] %s\n' "$*"
}

fail() {
  printf '[shajara-domain] ERROR: %s\n' "$*" >&2
  exit 1
}

[[ "$(id -u)" -eq 0 ]] || fail "This script must run as root."
[[ -x /usr/local/cpanel/bin/uapi ]] || fail "cPanel UAPI was not found on this server."
id "$CPANEL_USER" >/dev/null 2>&1 || fail "The cPanel account $CPANEL_USER does not exist."

install -d -m 0755 -o "$CPANEL_USER" -g "$CPANEL_USER" "$DOCUMENT_ROOT"

if [[ ! -s "$DOCUMENT_ROOT/index.html" ]]; then
  log "Warning: index.html is not present yet in $DOCUMENT_ROOT. The domain will still be configured."
fi

uapi_call() {
  local output
  output="$(/usr/local/cpanel/bin/uapi --output=json --user="$CPANEL_USER" "$@" 2>&1)" || {
    printf '%s\n' "$output"
    return 1
  }

  printf '%s\n' "$output"

  UAPI_OUTPUT="$output" python3 - <<'PY'
import json
import os
import sys

raw = os.environ.get("UAPI_OUTPUT", "")
try:
    payload = json.loads(raw)
except json.JSONDecodeError:
    sys.exit(1)

result = payload.get("result", {})
status = result.get("status")
errors = result.get("errors")
if status in (1, True) and not errors:
    sys.exit(0)
sys.exit(1)
PY
}

domain_exists() {
  grep -Fq "${DOMAIN}: ${CPANEL_USER}" /etc/userdomains 2>/dev/null \
    || [[ -e "/var/cpanel/userdata/${CPANEL_USER}/${DOMAIN}" ]] \
    || [[ -e "/var/cpanel/userdata/${CPANEL_USER}/${DOMAIN}_SSL" ]]
}

if domain_exists; then
  log "$DOMAIN already exists for $CPANEL_USER; keeping the existing domain record."
else
  log "Creating $DOMAIN with document root $DOCUMENT_ROOT."

  if uapi_call Domains add_domain \
      domain="$DOMAIN" \
      document_root="$DOCUMENT_ROOT"; then
    log "Domain created through the cPanel Domains API."
  else
    log "The Domains API method did not complete successfully; trying the legacy SubDomain API."
    uapi_call SubDomain addsubdomain \
      domain="$SUBDOMAIN" \
      rootdomain="$ROOT_DOMAIN" \
      dir="$RELATIVE_DOCUMENT_ROOT" \
      disallowdot=1 \
      || fail "cPanel could not create $DOMAIN with either supported API method."
  fi
fi

# Keep the static application readable by the cPanel account and Apache.
chown -R "$CPANEL_USER:$CPANEL_USER" "$DOCUMENT_ROOT"
find "$DOCUMENT_ROOT" -type d -exec chmod 0755 {} +
find "$DOCUMENT_ROOT" -type f -exec chmod 0644 {} +

if [[ -x /scripts/rebuildhttpdconf ]]; then
  log "Rebuilding the Apache configuration."
  /scripts/rebuildhttpdconf
fi

if [[ -x /scripts/restartsrv_httpd ]]; then
  log "Restarting Apache."
  /scripts/restartsrv_httpd
fi

if ! domain_exists; then
  fail "$DOMAIN was not registered to $CPANEL_USER after provisioning."
fi

log "Domain ownership is registered correctly."

if command -v apachectl >/dev/null 2>&1; then
  apachectl -S 2>&1 | grep -F "$DOMAIN" || log "Warning: $DOMAIN was not shown by apachectl -S."
elif [[ -x /usr/local/apache/bin/httpd ]]; then
  /usr/local/apache/bin/httpd -S 2>&1 | grep -F "$DOMAIN" || log "Warning: $DOMAIN was not shown by httpd -S."
fi

# Trigger AutoSSL. DNS may need a short propagation period, so certificate issuance
# is allowed to continue later through cPanel's normal AutoSSL schedule.
if [[ -x /usr/local/cpanel/bin/autossl_check ]]; then
  log "Starting AutoSSL for $CPANEL_USER."
  /usr/local/cpanel/bin/autossl_check --user="$CPANEL_USER" || log "AutoSSL did not finish yet; cPanel will retry automatically."
elif command -v whmapi1 >/dev/null 2>&1; then
  log "Starting AutoSSL through WHM API."
  whmapi1 start_autossl_check_for_one_user username="$CPANEL_USER" || log "AutoSSL did not finish yet; cPanel will retry automatically."
fi

if command -v dig >/dev/null 2>&1; then
  log "Current DNS answer:"
  dig +short "$DOMAIN" A || true
fi

if command -v curl >/dev/null 2>&1 && [[ -s "$DOCUMENT_ROOT/index.html" ]]; then
  if curl -kfsSL \
      --connect-timeout 10 \
      --resolve "$DOMAIN:80:127.0.0.1" \
      --resolve "$DOMAIN:443:127.0.0.1" \
      "http://$DOMAIN/" >/dev/null; then
    log "Local HTTP virtual-host test succeeded."
  else
    log "Warning: the local HTTP test did not succeed yet. Check the cPanel Apache/Nginx service logs if the domain does not open."
  fi
fi

log "Provisioning complete for https://$DOMAIN"
