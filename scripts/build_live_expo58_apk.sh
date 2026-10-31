#!/usr/bin/env bash
set -euo pipefail
: "${SERVER_HOST:?}" "${SERVER_PORT:?}" "${APP_PATH:?}"
key="$HOME/.ssh/id_ed25519"
mkdir -p shajara-mobile
rsync -az --exclude node_modules --exclude .expo --exclude .git --exclude .env --exclude '*.pem' \
  -e "ssh -i $key -o BatchMode=yes -o StrictHostKeyChecking=yes -p $SERVER_PORT" \
  "root@$SERVER_HOST:$APP_PATH/shajara-mobile/" shajara-mobile/
cd shajara-mobile
test -s package.json
test -s src/generated/bundledPeople.ts
node - <<'JS'
const fs=require('fs');
const expo=require('./package.json').dependencies?.expo;
if(!/58/.test(expo||'')) throw new Error('Expected Expo SDK 58, got '+expo);
const data=fs.readFileSync('src/generated/bundledPeople.ts','utf8');
const count=(data.match(/"source_code":/g)||[]).length;
if(count!==517) throw new Error('Offline snapshot is not latest workbook: '+count);
console.log('SOURCE_VERIFIED Expo',expo,'people',count);
JS
# The server's package-lock may be older than its SDK 58 package.json.
npm install --no-audit --no-fund
export CI=1 EXPO_PUBLIC_API_URL=https://shajara.pm.sa/api/v1
if test -f scripts/generate-shajara-icon.js && ! test -s assets/icon.png; then
  npm install --no-save --no-audit --no-fund sharp
  node scripts/generate-shajara-icon.js assets
fi
npx tsc --noEmit
npx expo prebuild --platform android --clean
test -s android/gradlew
python3 - <<'PY'
from pathlib import Path
p=Path('android/app/build.gradle')
s=p.read_text()
mark='release {'
idx=s.find(mark)
assert idx>=0, 'No release build type'
brace=s.index('{',idx); depth=0; end=None
for j in range(brace,len(s)):
    if s[j]=='{': depth+=1
    elif s[j]=='}':
        depth-=1
        if not depth: end=j; break
assert end, 'Invalid gradle release block'
if 'signingConfig' not in s[brace:end]:
    s=s[:brace+1]+'\n            signingConfig signingConfigs.debug\n'+s[brace+1:]
    p.write_text(s)
print('ANDROID_SIGNING_CONFIGURED')
PY
cd android
chmod +x gradlew
./gradlew assembleRelease --no-daemon --stacktrace
src=app/build/outputs/apk/release/app-release.apk
test -s "$src"
cp "$src" ../../Shajara-Android-517-Expo58.apk
cd ../..
sha256sum Shajara-Android-517-Expo58.apk > Shajara-Android-517-Expo58.apk.sha256
ls -lh Shajara-Android-517-Expo58.apk
apksigner="$(find "$ANDROID_HOME/build-tools" -type f -name apksigner | sort -V | tail -1)"
test -x "$apksigner"
"$apksigner" verify --verbose Shajara-Android-517-Expo58.apk
echo APK_BUILD_VERIFIED
