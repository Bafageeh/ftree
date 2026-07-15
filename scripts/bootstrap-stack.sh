#!/usr/bin/env bash
set -euo pipefail

ROOT_PATH="${1:-/mnt/home-storage/home/pmsa/apps/shajara}"
API_PATH="$ROOT_PATH/shajara-api"
MOBILE_PATH="$ROOT_PATH/shajara-mobile"
SCAFFOLD_PATH="$ROOT_PATH/scaffold"
WEB_ROOT="/mnt/home-storage/home/pmsa/public_html/apps/shajara"
CPANEL_USER="pmsa"

log() {
  printf '[shajara-bootstrap] %s\n' "$*"
}

fail() {
  printf '[shajara-bootstrap] ERROR: %s\n' "$*" >&2
  exit 1
}

[[ "$(id -u)" -eq 0 ]] || fail "Run this script as root."
command -v php >/dev/null 2>&1 || fail "PHP is not installed."
command -v npm >/dev/null 2>&1 || fail "npm is not installed."
command -v npx >/dev/null 2>&1 || fail "npx is not installed."

COMPOSER_BIN="$(command -v composer || true)"
if [[ -z "$COMPOSER_BIN" && -x /opt/cpanel/composer/bin/composer ]]; then
  COMPOSER_BIN="/opt/cpanel/composer/bin/composer"
fi
[[ -n "$COMPOSER_BIN" ]] || fail "Composer is not installed."

install -d -m 0755 -o "$CPANEL_USER" -g "$CPANEL_USER" "$ROOT_PATH"

log "Preparing Laravel 13 API."
if [[ ! -s "$API_PATH/artisan" ]]; then
  "$COMPOSER_BIN" create-project laravel/laravel:^13.0 "$API_PATH" --no-interaction --prefer-dist
fi

cd "$API_PATH"
if [[ ! -f .env ]]; then
  cp .env.example .env
fi

touch database/database.sqlite

set_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env
  else
    printf '%s=%s\n' "$key" "$value" >> .env
  fi
}

set_env APP_NAME '"شجرة النسب الشريف"'
set_env APP_ENV production
set_env APP_DEBUG false
set_env APP_URL https://shajara.pm.sa
set_env APP_LOCALE ar
set_env APP_FALLBACK_LOCALE ar
set_env DB_CONNECTION sqlite
set_env DB_DATABASE "$API_PATH/database/database.sqlite"
set_env CACHE_STORE database
set_env SESSION_DRIVER database
set_env QUEUE_CONNECTION database

if ! grep -q 'laravel/sanctum' composer.json; then
  php artisan install:api --no-interaction
fi

rsync -a "$SCAFFOLD_PATH/api/" "$API_PATH/"

"$COMPOSER_BIN" install --no-dev --no-interaction --prefer-dist --optimize-autoloader
php artisan key:generate --force
php artisan migrate --force
php artisan db:seed --class=DatabaseSeeder --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

log "Preparing Expo SDK 57 React Native application."
if [[ ! -s "$MOBILE_PATH/package.json" ]]; then
  CI=1 npx create-expo-app@latest "$MOBILE_PATH" --template default@sdk-57 --yes
fi

rsync -a "$SCAFFOLD_PATH/mobile/" "$MOBILE_PATH/"
cd "$MOBILE_PATH"
npm install --no-audit --no-fund
npx expo install --fix
npx tsc --noEmit

log "Applying ownership and runtime permissions."
chown -R "$CPANEL_USER:$CPANEL_USER" "$API_PATH" "$MOBILE_PATH"
find "$API_PATH" -type d -exec chmod 0755 {} +
find "$API_PATH" -type f -exec chmod 0644 {} +
chmod 0755 "$API_PATH/artisan"
chmod -R ug+rwX "$API_PATH/storage" "$API_PATH/bootstrap/cache"

log "Linking cPanel document root to Laravel public directory."
ln -sfn "$API_PATH/public" "$WEB_ROOT"
chown -h "$CPANEL_USER:$CPANEL_USER" "$WEB_ROOT"

if [[ -x /scripts/rebuildhttpdconf ]]; then
  /scripts/rebuildhttpdconf
fi
if [[ -x /scripts/restartsrv_httpd ]]; then
  /scripts/restartsrv_httpd
fi
if [[ -x /usr/local/cpanel/bin/autossl_check ]]; then
  /usr/local/cpanel/bin/autossl_check --user="$CPANEL_USER" || true
fi

cd "$API_PATH"
php artisan route:list --path=api/v1

cat > "$ROOT_PATH/STACK_STATUS.txt" <<EOF
Laravel API: $API_PATH
React Native app: $MOBILE_PATH
Public directory: $API_PATH/public
API health: https://shajara.pm.sa/api/v1/health
Expo start: cd $MOBILE_PATH && npx expo start
Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
chown "$CPANEL_USER:$CPANEL_USER" "$ROOT_PATH/STACK_STATUS.txt"

log "Laravel and React Native environments are ready."
