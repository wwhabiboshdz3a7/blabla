@echo off
REM =====================================================================
REM  Vigie PC - lanceur Windows (double-clic)
REM  Prepare un environnement Python isole (avec psutil), puis lance l'agent
REM  qui surveille ce PC et l'envoie au site. Laisse la fenetre ouverte.
REM  Pour arreter : ferme la fenetre, ou Ctrl+C.
REM =====================================================================
setlocal
cd /d "%~dp0"

if not exist config.json (
  echo Vigie PC n'est pas configure.
  echo Copie config.example.json en config.json et renseigne site_url et shared_secret.
  echo Voir le README.
  pause
  exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
  echo Python 3 est necessaire. Installe-le depuis https://www.python.org/downloads/
  echo en cochant "Add Python to PATH", puis relance ce fichier.
  pause
  exit /b 1
)

if not exist .venv (
  echo Preparation (une seule fois)...
  python -m venv .venv
)
call .venv\Scripts\activate.bat
python -m pip install --quiet --upgrade pip psutil >nul 2>&1

echo == Vigie PC - surveillance de ce PC ==
python agent.py
pause
