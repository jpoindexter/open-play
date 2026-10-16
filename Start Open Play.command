#!/bin/zsh
set -eu
cd "${0:A:h}"
if curl --fail --silent http://127.0.0.1:8768/prototype/ | /usr/bin/grep -q 'Open Play — DJ prototype'; then
  open http://127.0.0.1:8768/prototype/
  exit 0
fi
exec python3 scripts/serve_prototype.py --port 8768 --open-browser
