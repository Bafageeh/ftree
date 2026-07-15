#!/usr/bin/env bash
set -euo pipefail

DOMAIN="shajara.pm.sa"
ROOT_DOMAIN="pm.sa"
SUBDOMAIN="shajara"
CPANEL_USER="pmsa"
DOCUMENT_ROOT="/mnt/home-storage/home/pmsa/apps/shajara"
RELATIVE_DOCUMENT_ROOT="apps/shajara"
DNS_TTL="300"

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

get_server_ipv4() {
  local candidate=""

  if [[ -s /var/cpanel/mainip ]]; then
    candidate="$(tr -d '[:space:]' < /var/cpanel/mainip)"
  fi

  if [[ ! "$candidate" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] && command -v whmapi1 >/dev/null 2>&1; then
    candidate="$(whmapi1 --output=json get_mainip 2>/dev/null | python3 -c '
import json, re, sys
try:
    obj=json.load(sys.stdin)
except Exception:
    raise SystemExit(0)
def walk(v):
    if isinstance(v, dict):
        for x in v.values():
            yield from walk(x)
    elif isinstance(v, list):
        for x in v:
            yield from walk(x)
    elif isinstance(v, str):
        yield v
for value in walk(obj):
    if re.fullmatch(r"(?:[0-9]{1,3}\\.){3}[0-9]{1,3}", value):
        print(value)
        break
' || true)"
  fi

  if [[ ! "$candidate" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    candidate="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<=NF;i++) if ($i=="src") {print $(i+1); exit}}')"
  fi

  [[ "$candidate" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || return 1
  printf '%s\n' "$candidate"
}

zone_has_a_record() {
  local expected_ip="$1"
  local output=""

  output="$(/usr/local/cpanel/bin/uapi --output=json --user="$CPANEL_USER" \
    ZoneEdit fetchzone_records domain="$ROOT_DOMAIN" 2>/dev/null)" || return 1

  DNS_OUTPUT="$output" DNS_NAME="$DOMAIN" DNS_IP="$expected_ip" python3 - <<'PY'
import json
import os
import sys

try:
    payload = json.loads(os.environ.get("DNS_OUTPUT", ""))
except Exception:
    raise SystemExit(1)

wanted_name = os.environ["DNS_NAME"].rstrip(".").lower()
wanted_ip = os.environ["DNS_IP"]

def walk(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)

for item in walk(payload):
    name = str(item.get("name") or item.get("dname") or "").rstrip(".").lower()
    rtype = str(item.get("type") or item.get("record_type") or "").upper()
    address = str(item.get("address") or item.get("record") or item.get("data") or "").strip()
    if name == wanted_name and rtype == "A" and address == wanted_ip:
        raise SystemExit(0)

raise SystemExit(1)
PY
}

ensure_dns_record() {
  local server_ip="$1"

  if zone_has_a_record "$server_ip"; then
    log "DNS A record already exists: $DOMAIN -> $server_ip"
    return 0
  fi

  log "Adding DNS A record: $DOMAIN -> $server_ip"

  if uapi_call ZoneEdit add_zone_record \
      domain="$ROOT_DOMAIN" \
      name="${DOMAIN}." \
      type="A" \
      address="$server_ip" \
      ttl="$DNS_TTL"; then
    log "DNS record added through cPanel UAPI."
  elif command -v whmapi1 >/dev/null 2>&1 && \
      whmapi1 addzonerecord \
        domain="$ROOT_DOMAIN" \
        name="${DOMAIN}." \
        type="A" \
        address="$server_ip" \
        ttl="$DNS_TTL"; then
    log "DNS record added through WHM API."
  else
    fail "Could not add the A record for $DOMAIN to the $ROOT_DOMAIN DNS zone."
  fi

  if [[ -x /scripts/restartsrv_named ]]; then
    /scripts/restartsrv_named || true
  elif [[ -x /scripts/restartsrv_powerdns ]]; then
    /scripts/restartsrv_powerdns || true
  fi

  zone_has_a_record "$server_ip" || fail "The DNS API reported success, but the A record was not found afterward."
}

if domain_exists; then
  log "$DOMAIN already exists for $CPANEL_USER; keeping the existing virtual host."
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

SERVER_IPV4="$(get_server_ipv4)" || fail "Could not determine the server's public IPv4 address."
log "Server IPv4 detected as $SERVER_IPV4"
ensure_dns_record "$SERVER_IPV4"

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

if command -v dig >/dev/null 2>&1; then
  log "Authoritative nameservers for $ROOT_DOMAIN:"
  dig +short "$ROOT_DOMAIN" NS || true

  log "Local DNS answer:"
  dig @127.0.0.1 +short "$DOMAIN" A || true

  log "Public DNS answer (may require a short propagation period):"
  dig +short "$DOMAIN" A || true
fi

# Trigger AutoSSL after ensuring the DNS record exists.
if [[ -x /usr/local/cpanel/bin/autossl_check ]]; then
  log "Starting AutoSSL for $CPANEL_USER."
  /usr/local/cpanel/bin/autossl_check --user="$CPANEL_USER" || log "AutoSSL did not finish yet; cPanel will retry automatically."
elif command -v whmapi1 >/dev/null 2>&1; then
  log "Starting AutoSSL through WHM API."
  whmapi1 start_autossl_check_for_one_user username="$CPANEL_USER" || log "AutoSSL did not finish yet; cPanel will retry automatically."
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
