# -*- coding: utf-8 -*-
"""
Vigie PC — agent local.

Tourne en continu sur l'ordinateur à surveiller (Mac, Windows ou Linux). Toutes les N secondes
il mesure l'état de la machine (processeur, mémoire, disque, batterie, réseau, applications
surveillées), l'envoie au site Netlify (-> Upstash), déclenche une notification sur le téléphone
quand quelque chose mérite ton attention, et exécute les commandes déposées depuis le téléphone
(faire sonner l'ordinateur, afficher un message, le verrouiller…).

Dépendances : uniquement la bibliothèque standard de Python 3. Si le paquet « psutil » est
installé (fortement conseillé — les lanceurs l'installent tout seuls), les mesures sont beaucoup
plus riches (% processeur précis, débit réseau, top des applications). Sans psutil, l'agent
fonctionne quand même avec les informations essentielles.

Lancement : via les lanceurs du dossier agent/ (Mac : vigie-mac.command, Windows : vigie-windows.bat,
Linux : vigie-linux.sh), ou à la main :  python3 agent/agent.py
Arrêt : Ctrl+C.
"""
import json
import os
import platform
import shutil
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

try:
    import psutil  # facultatif mais recommandé
except Exception:
    psutil = None

HERE = Path(__file__).resolve().parent
IS_MAC = sys.platform == "darwin"
IS_WIN = os.name == "nt"
IS_LINUX = sys.platform.startswith("linux")

DEFAULT_CONFIG = {
    "site_url": "",                 # ex. https://vigie-daniel.netlify.app
    "shared_secret": "",            # identique à VIGIE_SHARED_SECRET côté Netlify
    "host_name": "",                # vide = nom réseau de la machine
    "interval_s": 20,               # fréquence des mesures (secondes)
    "thresholds": {
        "cpu_pct": 90,              # processeur saturé au-dessus de…
        "ram_pct": 90,              # mémoire pleine au-dessus de…
        "disk_pct": 92,             # disque presque plein au-dessus de…
        "battery_pct": 15,          # batterie faible en dessous de…
        "sustain_cycles": 3,        # nb de mesures d'affilée avant d'alerter (évite les faux positifs)
    },
    "watch_processes": [],          # ex. ["ltx", "Studio Vidéo IA", "obs"] — alerte si ça s'arrête
    "allow_commands": ["ping", "notify", "refresh"],   # lock/sleep à ajouter si tu les veux
    "events_file": "events.ndjson", # fichier où d'autres outils peuvent déposer des événements
    "quiet": False,                 # True = n'affiche presque rien dans le terminal
}


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
def load_config():
    cfg = json.loads(json.dumps(DEFAULT_CONFIG))  # copie profonde
    path = HERE / "config.json"
    if path.exists():
        try:
            user = json.loads(path.read_text(encoding="utf-8"))
            for k, v in user.items():
                if isinstance(v, dict) and isinstance(cfg.get(k), dict):
                    cfg[k].update(v)
                else:
                    cfg[k] = v
        except Exception as e:
            print(f"[vigie] config.json illisible ({e}) — valeurs par défaut utilisées.")
    # Les variables d'environnement l'emportent (pratique pour un service système).
    cfg["site_url"] = (os.environ.get("VIGIE_SITE_URL") or cfg["site_url"]).strip().rstrip("/")
    cfg["shared_secret"] = (os.environ.get("VIGIE_SECRET") or cfg["shared_secret"]).strip()
    cfg["host_name"] = (os.environ.get("VIGIE_HOST") or cfg["host_name"]).strip() or hostname()
    return cfg


def hostname():
    try:
        return socket.gethostname().split(".")[0] or "ordinateur"
    except Exception:
        return "ordinateur"


# ---------------------------------------------------------------------------
# Mesures
# ---------------------------------------------------------------------------
_last_net = {"t": 0.0, "up": 0, "down": 0}


def collect(cfg):
    snap = {
        "agent": "vigie 1.0",
        "os": os_name(),
        "os_detail": platform.platform(),
        "python": platform.python_version(),
        "psutil": bool(psutil),
    }
    snap.update(cpu_stats())
    snap.update(ram_stats())
    snap.update(disk_stats())
    snap.update(battery_stats())
    snap.update(net_stats())
    snap.update(uptime_stats())
    snap["top_cpu"], snap["top_ram"] = top_processes()
    snap["watched"] = watched_status(cfg.get("watch_processes") or [])
    return snap


def os_name():
    if IS_MAC:
        return "macOS"
    if IS_WIN:
        return "Windows"
    if IS_LINUX:
        return "Linux"
    return platform.system() or "?"


def cpu_stats():
    out = {"cpu_pct": None, "cpu_count": os.cpu_count(),
           "load1": None, "load5": None, "load15": None}
    try:
        la = os.getloadavg()
        out["load1"], out["load5"], out["load15"] = round(la[0], 2), round(la[1], 2), round(la[2], 2)
    except Exception:
        pass
    if psutil:
        try:
            out["cpu_pct"] = round(psutil.cpu_percent(interval=None), 1)
        except Exception:
            pass
    elif IS_LINUX:
        out["cpu_pct"] = _cpu_pct_proc()
    if out["cpu_pct"] is None and out["load1"] is not None and out["cpu_count"]:
        # approximation quand on n'a ni psutil ni /proc : charge moyenne ramenée au nb de cœurs
        out["cpu_pct"] = round(min(100.0, out["load1"] / out["cpu_count"] * 100.0), 1)
    return out


_proc_prev = {"total": 0, "idle": 0}


def _cpu_pct_proc():
    try:
        with open("/proc/stat") as f:
            parts = f.readline().split()[1:]
        nums = [int(x) for x in parts]
        idle = nums[3] + (nums[4] if len(nums) > 4 else 0)
        total = sum(nums)
        dt = total - _proc_prev["total"]
        di = idle - _proc_prev["idle"]
        _proc_prev["total"], _proc_prev["idle"] = total, idle
        if dt <= 0:
            return None
        return round(100.0 * (dt - di) / dt, 1)
    except Exception:
        return None


def ram_stats():
    if psutil:
        try:
            m = psutil.virtual_memory()
            return {"ram_pct": round(m.percent, 1), "ram_used": m.used, "ram_total": m.total}
        except Exception:
            pass
    total = used = None
    try:
        if IS_LINUX:
            info = {}
            with open("/proc/meminfo") as f:
                for line in f:
                    k, _, v = line.partition(":")
                    info[k] = int(v.strip().split()[0]) * 1024
            total = info.get("MemTotal")
            avail = info.get("MemAvailable", info.get("MemFree", 0))
            used = total - avail if total else None
        elif IS_MAC:
            total = int(subprocess.check_output(["sysctl", "-n", "hw.memsize"]).strip())
            vm = subprocess.check_output(["vm_stat"]).decode()
            page = 4096
            free = spec = 0
            for line in vm.splitlines():
                if "page size of" in line:
                    try: page = int(line.split("page size of")[1].split("bytes")[0])
                    except Exception: pass
                if line.startswith("Pages free"):
                    free = int(line.split(":")[1].strip().rstrip(".")) * page
                if line.startswith("Pages speculative"):
                    spec = int(line.split(":")[1].strip().rstrip(".")) * page
            used = total - free - spec if total else None
        elif IS_WIN:
            total, used = _win_mem()
    except Exception:
        pass
    pct = round(100.0 * used / total, 1) if (total and used is not None) else None
    return {"ram_pct": pct, "ram_used": used, "ram_total": total}


def _win_mem():
    import ctypes

    class MEMSTAT(ctypes.Structure):
        _fields_ = [("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong),
                    ("ullTotalPhys", ctypes.c_ulonglong), ("ullAvailPhys", ctypes.c_ulonglong),
                    ("ullTotalPageFile", ctypes.c_ulonglong), ("ullAvailPageFile", ctypes.c_ulonglong),
                    ("ullTotalVirtual", ctypes.c_ulonglong), ("ullAvailVirtual", ctypes.c_ulonglong),
                    ("ullAvailExtendedVirtual", ctypes.c_ulonglong)]
    st = MEMSTAT()
    st.dwLength = ctypes.sizeof(MEMSTAT)
    ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(st))
    return int(st.ullTotalPhys), int(st.ullTotalPhys - st.ullAvailPhys)


def disk_stats():
    # Disque principal : celui qui contient le dossier personnel (cross-plateforme via shutil).
    target = os.path.expanduser("~") or ("C:\\" if IS_WIN else "/")
    try:
        du = shutil.disk_usage(target)
        pct = round(100.0 * du.used / du.total, 1) if du.total else None
        mount = os.path.splitdrive(target)[0] if IS_WIN else "/"
        return {"disk_pct": pct, "disk_used": du.used, "disk_total": du.total, "disk_mount": mount}
    except Exception:
        return {"disk_pct": None, "disk_used": None, "disk_total": None, "disk_mount": ""}


def battery_stats():
    out = {"battery_pct": None, "battery_charging": None, "battery_secs_left": None}
    if psutil and hasattr(psutil, "sensors_battery"):
        try:
            b = psutil.sensors_battery()
            if b is not None:
                out["battery_pct"] = round(b.percent, 1)
                out["battery_charging"] = bool(b.power_plugged)
                if b.secsleft is not None and b.secsleft >= 0:
                    out["battery_secs_left"] = int(b.secsleft)
                return out
        except Exception:
            pass
    if IS_MAC:
        try:
            txt = subprocess.check_output(["pmset", "-g", "batt"]).decode()
            import re
            m = re.search(r"(\d+)%", txt)
            if m:
                out["battery_pct"] = float(m.group(1))
            out["battery_charging"] = ("AC Power" in txt) or ("charging" in txt.lower())
        except Exception:
            pass
    return out


def net_stats():
    if not psutil:
        return {"net_up_kbps": None, "net_down_kbps": None}
    try:
        io = psutil.net_io_counters()
        now = time.time()
        up, down = io.bytes_sent, io.bytes_recv
        prev = _last_net
        res = {"net_up_kbps": None, "net_down_kbps": None}
        if prev["t"]:
            dt = max(0.001, now - prev["t"])
            res["net_up_kbps"] = round((up - prev["up"]) / dt / 1024, 1)
            res["net_down_kbps"] = round((down - prev["down"]) / dt / 1024, 1)
        prev["t"], prev["up"], prev["down"] = now, up, down
        return res
    except Exception:
        return {"net_up_kbps": None, "net_down_kbps": None}


def uptime_stats():
    boot = None
    if psutil:
        try:
            boot = psutil.boot_time()
        except Exception:
            boot = None
    if boot is None:
        try:
            if IS_LINUX:
                with open("/proc/uptime") as f:
                    boot = time.time() - float(f.read().split()[0])
            elif IS_MAC:
                txt = subprocess.check_output(["sysctl", "-n", "kern.boottime"]).decode()
                import re
                m = re.search(r"sec = (\d+)", txt)
                if m:
                    boot = float(m.group(1))
        except Exception:
            boot = None
    uptime = int(time.time() - boot) if boot else None
    return {"boot_time": int(boot) if boot else None, "uptime_s": uptime}


def top_processes(n=5):
    if not psutil:
        return [], []
    top_ram = []
    try:
        procs = []
        for p in psutil.process_iter(["name", "memory_percent"]):
            try:
                procs.append((p.info.get("name") or "?", float(p.info.get("memory_percent") or 0)))
            except Exception:
                continue
        procs.sort(key=lambda x: x[1], reverse=True)
        top_ram = [{"name": a[:40], "pct": round(a_pct, 1)} for a, a_pct in procs[:n]]
    except Exception:
        pass
    top_cpu = []
    try:
        # Mesure sur une courte fenêtre pour un % processeur par application fiable.
        objs = list(psutil.process_iter())
        for p in objs:
            try: p.cpu_percent(None)
            except Exception: pass
        time.sleep(0.35)
        rows = []
        ncpu = os.cpu_count() or 1
        for p in objs:
            try:
                rows.append((p.name(), p.cpu_percent(None) / ncpu))
            except Exception:
                continue
        rows.sort(key=lambda x: x[1], reverse=True)
        top_cpu = [{"name": a[:40], "pct": round(a_pct, 1)} for a, a_pct in rows[:n] if a_pct > 0.1]
    except Exception:
        pass
    return top_cpu, top_ram


def watched_status(names):
    result = []
    if not names:
        return result
    # On construit un seul « blob » minuscule listant les processus en cours, puis on y
    # cherche chaque nom surveillé (insensible à la casse, correspondance partielle).
    blob = ""
    if psutil:
        try:
            parts = []
            for p in psutil.process_iter(["name"]):
                nm = p.info.get("name") or ""
                if nm:
                    parts.append(nm)
            blob = "\n".join(parts).lower()
        except Exception:
            blob = ""
    else:
        try:
            if IS_WIN:
                blob = subprocess.check_output(["tasklist"], text=True, errors="ignore").lower()
            else:
                blob = subprocess.check_output(["ps", "-A", "-o", "comm"], text=True, errors="ignore").lower()
        except Exception:
            blob = ""
    for name in names:
        result.append({"name": str(name), "up": str(name).lower() in blob})
    return result


# ---------------------------------------------------------------------------
# Moteur d'alertes : on ne notifie qu'aux transitions (passage de bon à mauvais / inverse),
# avec une petite hystérésis pour éviter les notifications en rafale.
# ---------------------------------------------------------------------------
class Alerts:
    def __init__(self, cfg):
        self.th = cfg["thresholds"]
        self.state = {}       # clé -> bool (en état « mauvais » ?)
        self.counters = {}    # clé -> nb de mesures consécutives au-dessus du seuil
        self.proc_prev = {}   # nom surveillé -> up ?

    def _edge(self, key, bad, out, on_title, on_msg, off_title=None, off_msg=None, level="warn"):
        was = self.state.get(key, False)
        if bad and not was:
            self.state[key] = True
            out.append({"level": level, "title": on_title, "message": on_msg, "key": key})
        elif not bad and was:
            self.state[key] = False
            if off_title:
                out.append({"level": "info", "title": off_title, "message": off_msg or "", "key": key})

    def evaluate(self, snap, host):
        out = []
        th = self.th
        sustain = int(th.get("sustain_cycles", 3))

        def sustained(key, value, limit, above=True):
            hit = value is not None and ((value >= limit) if above else (value <= limit))
            self.counters[key] = (self.counters.get(key, 0) + 1) if hit else 0
            return self.counters[key] >= sustain

        cpu = snap.get("cpu_pct")
        self._edge("cpu", sustained("cpu", cpu, th["cpu_pct"]), out,
                   f"⚠️ Processeur saturé sur {host}",
                   f"Processeur à {cpu}% depuis un moment.",
                   f"✅ Processeur revenu à la normale sur {host}",
                   f"Processeur à {cpu}%." if cpu is not None else "")

        ram = snap.get("ram_pct")
        self._edge("ram", sustained("ram", ram, th["ram_pct"]), out,
                   f"⚠️ Mémoire pleine sur {host}",
                   f"Mémoire utilisée à {ram}%.",
                   f"✅ Mémoire revenue à la normale sur {host}",
                   f"Mémoire à {ram}%." if ram is not None else "")

        disk = snap.get("disk_pct")
        self._edge("disk", disk is not None and disk >= th["disk_pct"], out,
                   f"🟠 Disque presque plein sur {host}",
                   f"Disque occupé à {disk}%. Fais un peu de place.",
                   f"✅ Disque de nouveau OK sur {host}",
                   f"Disque à {disk}%." if disk is not None else "", level="warn")

        batt = snap.get("battery_pct")
        charging = snap.get("battery_charging")
        batt_bad = (batt is not None and batt <= th["battery_pct"] and charging is False)
        self._edge("battery", batt_bad, out,
                   f"🔋 Batterie faible sur {host}",
                   f"Batterie à {batt}% et pas branché.",
                   f"🔌 {host} rebranché",
                   f"Batterie à {batt}%." if batt is not None else "", level="warn")

        # Applications surveillées : alerte quand une appli suivie s'arrête / redémarre.
        for w in snap.get("watched", []):
            name, up = w.get("name"), bool(w.get("up"))
            prev = self.proc_prev.get(name)
            if prev is True and not up:
                out.append({"level": "critical", "title": f"🔴 « {name} » s'est arrêté sur {host}",
                            "message": f"L'application surveillée « {name} » ne tourne plus.", "key": "proc:" + name})
            elif prev is False and up:
                out.append({"level": "info", "title": f"🟢 « {name} » a redémarré sur {host}",
                            "message": f"L'application « {name} » tourne de nouveau.", "key": "proc:" + name})
            self.proc_prev[name] = up

        return out


# ---------------------------------------------------------------------------
# Événements déposés par d'autres outils (le côté « agrégateur »).
# Un autre programme écrit une ligne JSON dans events.ndjson, ex. depuis un script :
#   echo '{"level":"info","title":"Sauvegarde finie","message":"42 Go copiés"}' >> agent/events.ndjson
# L'agent lit les nouvelles lignes, les transmet en notification, puis vide le fichier.
# ---------------------------------------------------------------------------
def read_events(cfg):
    name = cfg.get("events_file") or ""
    if not name:
        return []
    path = (HERE / name) if not os.path.isabs(name) else Path(name)
    if not path.exists():
        return []
    out = []
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
        path.write_text("", encoding="utf-8")   # consommé : on repart propre
        for line in lines:
            line = line.strip()
            if not line:
                continue
            try:
                e = json.loads(line)
            except Exception:
                e = {"title": "Événement", "message": line}
            out.append({
                "level": e.get("level", "info") if e.get("level") in ("info", "warn", "critical") else "info",
                "title": str(e.get("title", "Événement"))[:120],
                "message": str(e.get("message", ""))[:300],
                "key": "event",
            })
    except Exception as ex:
        log(cfg, f"lecture des événements impossible : {ex}")
    return out


# ---------------------------------------------------------------------------
# Réseau : envoi de l'état au site Netlify
# ---------------------------------------------------------------------------
def http_json(url, method="GET", body=None, headers=None, timeout=25):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"Content-Type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8") or "{}"), r.status
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read().decode("utf-8") or "{}"), e.code
        except Exception:
            return {"error": str(e)}, e.code
    except Exception as e:
        return {"error": str(e)}, 0


def send_snapshot(cfg, snap, alerts):
    url = cfg["site_url"] + "/api/status/ingest"
    hdr = {"x-vigie-secret": cfg["shared_secret"]}
    body = {"host": cfg["host_name"], "snapshot": snap, "alerts": alerts}
    return http_json(url, method="POST", body=body, headers=hdr, timeout=25)


# ---------------------------------------------------------------------------
# Commandes reçues depuis le téléphone
# ---------------------------------------------------------------------------
def handle_commands(cfg, commands):
    allowed = set(cfg.get("allow_commands") or [])
    for c in commands or []:
        action = c.get("action")
        arg = c.get("arg") or ""
        if action not in allowed:
            log(cfg, f"commande « {action} » ignorée (non autorisée dans allow_commands).")
            continue
        log(cfg, f"commande reçue du téléphone : {action} {arg}".rstrip())
        try:
            if action == "ping":
                pc_beep()
                pc_notify("Vigie PC", "C'est ton téléphone qui te cherche 👋")
            elif action == "notify":
                pc_notify("Message depuis le téléphone", arg or "(vide)")
            elif action == "refresh":
                pass  # le simple fait de répondre renvoie l'état au prochain tour
            elif action == "lock":
                pc_lock()
            elif action == "sleep":
                pc_sleep()
        except Exception as e:
            log(cfg, f"commande « {action} » en erreur : {e}")


def pc_notify(title, message):
    try:
        if IS_MAC:
            esc = lambda s: str(s).replace("\\", "").replace('"', "'")
            subprocess.run(["osascript", "-e",
                            f'display notification "{esc(message)[:220]}" with title "{esc(title)[:80]}" sound name "Glass"'],
                           capture_output=True, timeout=10)
        elif IS_WIN:
            import ctypes
            ctypes.windll.user32.MessageBoxW(0, str(message)[:400], str(title)[:120], 0x40)
        elif IS_LINUX and shutil.which("notify-send"):
            subprocess.run(["notify-send", str(title)[:120], str(message)[:400]], capture_output=True, timeout=10)
    except Exception:
        pass


def pc_beep():
    try:
        if IS_MAC:
            subprocess.run(["afplay", "/System/Library/Sounds/Glass.aiff"], capture_output=True, timeout=10)
        elif IS_WIN:
            import winsound
            winsound.MessageBeep()
        else:
            sys.stdout.write("\a"); sys.stdout.flush()
    except Exception:
        pass


def pc_lock():
    if IS_MAC:
        subprocess.run(["/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession",
                        "-suspend"], capture_output=True)
    elif IS_WIN:
        subprocess.run(["rundll32.exe", "user32.dll,LockWorkStation"], capture_output=True)
    elif shutil.which("loginctl"):
        subprocess.run(["loginctl", "lock-session"], capture_output=True)
    elif shutil.which("xdg-screensaver"):
        subprocess.run(["xdg-screensaver", "lock"], capture_output=True)


def pc_sleep():
    if IS_MAC:
        subprocess.run(["pmset", "sleepnow"], capture_output=True)
    elif IS_WIN:
        subprocess.run(["rundll32.exe", "powrprof.dll,SetSuspendState", "0,1,0"], capture_output=True)
    elif shutil.which("systemctl"):
        subprocess.run(["systemctl", "suspend"], capture_output=True)


# ---------------------------------------------------------------------------
# Boucle principale
# ---------------------------------------------------------------------------
_running = True


def _stop(*_):
    global _running
    _running = False


def log(cfg, msg):
    if not cfg.get("quiet"):
        print(f"[vigie] {msg}", flush=True)


def main():
    cfg = load_config()
    if not cfg["site_url"] or not cfg["shared_secret"]:
        print("Vigie PC n'est pas encore configuré.")
        print("Renseigne « site_url » et « shared_secret » dans agent/config.json")
        print("(ou les variables d'environnement VIGIE_SITE_URL et VIGIE_SECRET), puis relance.")
        print("Voir le README, section « Mise en place ».")
        sys.exit(1)

    signal.signal(signal.SIGINT, _stop)
    signal.signal(signal.SIGTERM, _stop)
    if psutil:
        try: psutil.cpu_percent(interval=None)  # amorce la mesure du processeur
        except Exception: pass

    engine = Alerts(cfg)
    interval = max(5, int(cfg.get("interval_s", 20)))
    log(cfg, f"démarré — machine « {cfg['host_name']} » — envoi vers {cfg['site_url']} toutes les {interval}s.")
    log(cfg, "psutil " + ("présent (mesures détaillées)." if psutil else "absent (mesures de base ; installe-le pour plus de détail)."))
    log(cfg, "Laisse cette fenêtre ouverte. Ctrl+C pour arrêter.")

    first = True
    while _running:
        t0 = time.time()
        try:
            snap = collect(cfg)
            alerts = engine.evaluate(snap, cfg["host_name"])
            alerts += read_events(cfg)
            if first:
                alerts = [a for a in alerts if a.get("key") == "event"]  # pas d'alerte « au démarrage »
            resp, code = send_snapshot(cfg, snap, alerts)
            if code != 200:
                log(cfg, f"envoi refusé ({resp.get('error', code)}).")
            else:
                handle_commands(cfg, resp.get("commands"))
                if not cfg.get("quiet"):
                    line = fmt_line(snap)
                    print(f"[vigie] {line}", flush=True)
            first = False
        except Exception as e:
            log(cfg, f"cycle en erreur : {e}")
        # Attente jusqu'au prochain tour, en restant réactif au Ctrl+C.
        while _running and time.time() - t0 < interval:
            time.sleep(0.4)

    # Arrêt propre : on prévient que l'agent s'arrête (l'ordinateur passera « hors ligne »).
    log(cfg, "arrêt en cours…")
    try:
        snap = collect(cfg)
        send_snapshot(cfg, snap, [{"level": "info",
                                   "title": f"⏹️ Vigie arrêtée sur {cfg['host_name']}",
                                   "message": "La surveillance a été arrêtée sur cet ordinateur.",
                                   "key": "agent"}])
    except Exception:
        pass
    log(cfg, "arrêté.")


def fmt_line(s):
    def pc(v): return f"{v}%" if v is not None else "?"
    bits = [f"CPU {pc(s.get('cpu_pct'))}", f"RAM {pc(s.get('ram_pct'))}", f"Disque {pc(s.get('disk_pct'))}"]
    if s.get("battery_pct") is not None:
        bits.append(f"Batt {pc(s.get('battery_pct'))}{'⚡' if s.get('battery_charging') else ''}")
    down, up = s.get("net_down_kbps"), s.get("net_up_kbps")
    if down is not None:
        bits.append(f"Réseau ↓{down:.0f} ↑{up:.0f} ko/s")
    return "  ".join(bits)


if __name__ == "__main__":
    main()
