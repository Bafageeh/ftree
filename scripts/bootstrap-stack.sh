#!/usr/bin/env bash
set -euo pipefail

ROOT_PATH="${1:-/mnt/home-storage/home/pmsa/apps/shajara}"
API_PATH="$ROOT_PATH/shajara-api"
MOBILE_PATH="$ROOT_PATH/shajara-mobile"
SCAFFOLD_PATH="$ROOT_PATH/scaffold"
WEB_ROOT="/mnt/home-storage/home/pmsa/public_html/apps/shajara"
CPANEL_USER="pmsa"
PUBLIC_API_URL="https://shajara.pm.sa/api/v1"

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

if ! grep -Eq '^APP_KEY=base64:.+' .env; then
  php artisan key:generate --force
fi

php artisan optimize:clear
php artisan migrate --force
php artisan db:seed --class=DatabaseSeeder --force
php artisan db:seed --class=ProvisionalPersonSeeder --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

log "Preparing Expo SDK 57 React Native application."
if [[ ! -s "$MOBILE_PATH/package.json" ]]; then
  CI=1 npx create-expo-app@latest "$MOBILE_PATH" --template default@sdk-57 --yes
fi

install -d "$MOBILE_PATH/app" "$MOBILE_PATH/src"
rsync -a --delete "$SCAFFOLD_PATH/mobile/app/" "$MOBILE_PATH/app/"
rsync -a --delete "$SCAFFOLD_PATH/mobile/src/" "$MOBILE_PATH/src/"
cp "$SCAFFOLD_PATH/mobile/app.json" "$MOBILE_PATH/app.json"
cp "$SCAFFOLD_PATH/mobile/.env.example" "$MOBILE_PATH/.env.example"
printf 'EXPO_PUBLIC_API_URL=%s\n' "$PUBLIC_API_URL" > "$MOBILE_PATH/.env"

log "Generating a complete local genealogy snapshot for Expo fallback."
install -d "$MOBILE_PATH/src/generated"
php - "$API_PATH" "$MOBILE_PATH/src/generated/bundledPeople.ts" <<'PHP'
<?php

use App\Models\Person;
use Illuminate\Contracts\Console\Kernel;

$apiPath = $argv[1];
$outputPath = $argv[2];

require $apiPath.'/vendor/autoload.php';
$app = require $apiPath.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$people = Person::query()
    ->orderByRaw('chart_order is null')
    ->orderBy('chart_order')
    ->orderBy('id')
    ->get()
    ->map(static fn (Person $person): array => [
        'id' => $person->id,
        'full_name' => $person->full_name,
        'source_code' => $person->source_code,
        'chart_reading_id' => $person->chart_reading_id,
        'node_type' => $person->node_type,
        'honorific' => $person->honorific,
        'lineage_parent_id' => $person->lineage_parent_id,
        'status' => $person->status,
        'approval_status' => $person->approval_status,
        'is_provisional' => (bool) $person->is_provisional,
        'supervisor_note' => $person->supervisor_note,
        'approved_at' => $person->approved_at?->toISOString(),
        'chart_branch' => $person->chart_branch,
        'chart_color' => $person->chart_color,
        'generation' => (int) $person->generation,
        'summary' => $person->summary,
        'source_reference' => $person->source_reference,
        'source_locator' => $person->source_locator,
        'chart_order' => $person->chart_order,
        'is_living' => (bool) $person->is_living,
    ])
    ->values()
    ->all();

$pending = collect($people)->where('approval_status', 'pending_supervisor')->count();
$confirmed = collect($people)->where('approval_status', 'supervisor_confirmed')->count();

if (count($people) < 220 || $pending < 196 || $confirmed < 24) {
    fwrite(STDERR, sprintf(
        "Incomplete genealogy snapshot: total=%d pending=%d confirmed=%d\n",
        count($people),
        $pending,
        $confirmed,
    ));
    exit(1);
}

$json = json_encode(
    $people,
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR,
);

$content = "import type { Person } from '../types';\n\n".
    "// مولدة تلقائيًا من قاعدة بيانات شجرة النسب أثناء النشر.\n".
    "export const bundledPeople: Person[] = ".$json.";\n";

if (file_put_contents($outputPath, $content) === false) {
    fwrite(STDERR, "Unable to write Expo genealogy snapshot.\n");
    exit(1);
}

printf("Generated Expo snapshot: total=%d pending=%d confirmed=%d\n", count($people), $pending, $confirmed);
PHP

test -s "$MOBILE_PATH/src/generated/bundledPeople.ts" || fail "Generated Expo people snapshot is missing."
grep -q 'pending_supervisor' "$MOBILE_PATH/src/generated/bundledPeople.ts" || fail "Generated Expo snapshot has no pending-supervisor records."

cd "$MOBILE_PATH"
npm install --no-audit --no-fund
npx expo install \
  @expo/vector-icons \
  expo-constants \
  expo-router \
  react-native-safe-area-context \
  react-native-svg \
  react-dom \
  react-native-web \
  @expo/metro-runtime
npx expo install --fix
npx tsc --noEmit

log "Exporting Expo Web for production."
rm -rf "$MOBILE_PATH/dist"
EXPO_PUBLIC_API_URL="$PUBLIC_API_URL" \
  npx expo export --platform web --output-dir dist

test -s "$MOBILE_PATH/dist/index.html" || fail "Expo Web export did not create dist/index.html."
install -d "$API_PATH/public/app"
rsync -a --delete "$MOBILE_PATH/dist/" "$API_PATH/public/app/"

cat > "$API_PATH/public/app/.htaccess" <<'HTACCESS'
DirectoryIndex index.html
Options -Indexes

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
HTACCESS

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

test -s "$API_PATH/public/app/index.html" || fail "Published Expo Web index is missing."

cat > "$ROOT_PATH/STACK_STATUS.txt" <<EOF
Laravel API: $API_PATH
React Native app: $MOBILE_PATH
Expo Web: $API_PATH/public/app
Public directory: $API_PATH/public
Main URL: https://shajara.pm.sa/app/
Mobile API: $PUBLIC_API_URL
Expected people: 220+
Expected pending supervisor: 196+
Expo start: cd $MOBILE_PATH && npx expo start --port 8083
Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF
chown "$CPANEL_USER:$CPANEL_USER" "$ROOT_PATH/STACK_STATUS.txt"

log "Laravel, React Native, Expo Web, and the full coded genealogy snapshot are ready."
