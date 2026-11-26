#!/usr/bin/env bash
# Builds dist/Senso-Bar.apk. Run from the repository root (GitHub Actions does this).
set -uo pipefail
cd "$(dirname "$0")"
fail() { echo "::error title=$1::$(tail -n 60 "$2" | sed 's/%/%25/g; s/\r//g' | sed ':a;N;$!ba;s/\n/%0A/g')"; exit 1; }
step() { local name="$1"; shift; echo "== $name"; "$@" > "/tmp/step.log" 2>&1; local rc=$?; cat /tmp/step.log; [ $rc -eq 0 ] || fail "$name" /tmp/step.log; }

rm -rf www android
cp -r ../app www
sed -i '/Content-Security-Policy/d' www/index.html
rm -f www/sw.js
step "npm install" npm install --no-audit --no-fund
step "cap add android" npx cap add android
step "brand" node brand.js
step "android setup" node android-setup.js
step "cap sync" npx cap sync android
chmod +x android/gradlew
export SENSO_KS="$PWD/senso-release.p12"
step "gradle assembleRelease" bash -c "cd android && ./gradlew assembleRelease --no-daemon --stacktrace"
mkdir -p ../dist
cp android/app/build/outputs/apk/release/app-release.apk ../dist/Senso-Bar.apk
ls -la ../dist
