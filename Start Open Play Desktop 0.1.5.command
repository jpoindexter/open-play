#!/bin/zsh
set -eu
cd "${0:A:h}"
desktop_bundle="$PWD/local-evidence/desktop-builds/0.1.5/Open Play Test-darwin-arm64/Open Play Test.app"
if [[ ! -d "$desktop_bundle" ]]; then
  print 'Desktop test bundle is missing. See desktop/README.md for the reproducible local build.'
  exit 1
fi
open "$desktop_bundle"
