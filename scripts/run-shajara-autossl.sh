#!/usr/bin/env bash
set -euo pipefail

/usr/local/cpanel/bin/uapi --output=jsonpretty --user=pmsa \
  SSL remove_autossl_excluded_domains domains=shajara.pm.sa || true
/usr/local/cpanel/bin/uapi --output=jsonpretty --user=pmsa \
  SSL start_autossl_check || true
/usr/local/cpanel/bin/autossl_check --user=pmsa
/scripts/rebuildhttpdconf
/scripts/restartsrv_httpd
