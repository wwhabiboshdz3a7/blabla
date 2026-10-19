#!/bin/bash
# =====================================================================
#  Vigie PC — lanceur Linux
#  Prépare un environnement Python isolé (avec psutil), puis lance l'agent.
#  Usage :  ./vigie-linux.sh      (depuis le dossier agent/)
#  Pour qu'il démarre tout seul au démarrage, voir le README (section systemd).
# =====================================================================
cd "$(dirname "$0")" || exit 1

if [ ! -f config.json ]; then
  echo "Vigie PC n'est pas configuré : copie config.example.json en config.json"
  echo "et renseigne site_url et shared_secret (voir le README)."
  exit 1
fi

PY="$(command -v python3 || true)"
if [ -z "$PY" ]; then echo "Python 3 est nécessaire (sudo apt install python3 python3-venv)."; exit 1; fi

if [ ! -d .venv ]; then
  echo "Préparation (une seule fois)…"
  "$PY" -m venv .venv >/dev/null 2>&1 || { echo "venv indisponible — installe python3-venv"; }
fi
# shellcheck disable=SC1091
[ -f .venv/bin/activate ] && source .venv/bin/activate
python -m pip install --quiet --upgrade pip psutil >/dev/null 2>&1 || \
  echo "(psutil non installé — mesures de base)"

echo "== Vigie PC — surveillance de cet ordinateur =="
exec python agent.py
