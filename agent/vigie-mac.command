#!/bin/bash
# =====================================================================
#  Vigie PC — lanceur macOS (double-clic)
#  Prépare un petit environnement Python isolé (avec psutil pour des mesures
#  détaillées), puis lance l'agent qui surveille ce Mac et l'envoie au site.
#  Laisse la fenêtre ouverte : tant qu'elle tourne, tu suis ton Mac depuis
#  le téléphone. Pour arrêter : ferme la fenêtre, ou Ctrl+C.
# =====================================================================
cd "$(dirname "$0")" || exit 1

if [ ! -f config.json ]; then
  osascript -e 'display dialog "Vigie PC n'\''est pas encore configuré.\n\nCopie « agent/config.example.json » en « agent/config.json » et renseigne site_url et shared_secret (voir le README), puis relance." buttons {"OK"} with title "Vigie PC"' >/dev/null 2>&1
  echo "Configuration manquante : crée agent/config.json (voir config.example.json)."
  exit 1
fi

PY="$(command -v python3 || true)"
if [ -z "$PY" ]; then
  osascript -e 'display dialog "Python 3 est nécessaire. Installe-le (par ex. depuis python.org ou « xcode-select --install »), puis relance." buttons {"OK"} with title "Vigie PC"' >/dev/null 2>&1
  exit 1
fi

# Environnement isolé + psutil (silencieux, sans toucher au Python du système).
if [ ! -d .venv ]; then
  echo "Préparation (une seule fois)…"
  "$PY" -m venv .venv >/dev/null 2>&1
fi
# shellcheck disable=SC1091
source .venv/bin/activate 2>/dev/null || true
python -m pip install --quiet --upgrade pip psutil >/dev/null 2>&1 || \
  echo "(psutil non installé — l'agent marchera avec les mesures de base)"

echo "== Vigie PC — surveillance de ce Mac =="
exec python agent.py
