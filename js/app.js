import { startGestureCamera, GESTURE_TEXT } from './gesture.js';

const $ = (sel) => document.querySelector(sel);
const PREFIX = 'grabdrop-v1-';
const CHUNK_SIZE = 64 * 1024;
const GRAB_TIMEOUT_MS = 15000;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// Options PeerJS (surchargeables via window.GRABDROP_PEER pour un serveur PeerJS perso).
const PEER_OPTS = { debug: 1, ...(window.GRABDROP_PEER || {}) };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => { s.hidden = s.id !== id; });
}

function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3000);
}

function setStatus(el, text, kind = '') {
  el.textContent = text;
  el.className = `status ${kind}`;
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function cameraError(err) {
  if (!window.isSecureContext) return 'La caméra nécessite HTTPS.';
  if (err?.name === 'NotAllowedError') return 'Accès à la caméra refusé.';
  if (err?.name === 'NotFoundError') return 'Aucune caméra trouvée.';
  return `Impossible de démarrer la détection : ${err?.message || err}`;
}

/* ------------------------------------------------------------------ */
/* Mode PC : reçoit les photos                                         */
/* ------------------------------------------------------------------ */

function startPC() {
  show('pc');
  const status = $('#pc-status');
  const gallery = $('#pc-gallery');
  const holding = $('#pc-holding');
  const received = [];
  const incoming = new Map();
  let conn = null;
  let cam = null;
  let grabbed = false;

  const openPeer = () => {
    const code = makeCode();
    const peer = new Peer(PREFIX + code, PEER_OPTS);

    peer.on('open', () => {
      const url = `${location.origin}${location.pathname}?join=${code}`;
      $('#pc-code').textContent = code;
      $('#pc-link').textContent = url;
      const qr = $('#pc-qr');
      qr.innerHTML = '';
      new QRCode(qr, { text: url, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M });
      setStatus(status, 'En attente du téléphone…');
    });

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        peer.destroy();
        openPeer();
        return;
      }
      setStatus(status, `Erreur : ${err.type || err.message}`, 'bad');
    });

    peer.on('disconnected', () => { if (!peer.destroyed) peer.reconnect(); });

    peer.on('connection', (c) => {
      if (conn && conn.open) conn.close();
      conn = c;
      c.on('open', () => {
        setStatus(status, '📱 Téléphone connecté', 'ok');
        c.send({ t: 'pc-cam', on: !!cam });
      });
      c.on('data', onData);
      c.on('close', () => {
        if (conn !== c) return;
        conn = null;
        setGrabbed(false);
        setStatus(status, 'Téléphone déconnecté. En attente…', 'bad');
      });
    });
  };
  openPeer();

  function setGrabbed(on, thumbs = [], count = 0) {
    grabbed = on;
    holding.hidden = !on;
    if (!on) return;
    const wrap = $('#pc-holding-thumbs');
    wrap.innerHTML = '';
    thumbs.forEach((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.style.setProperty('--i', i);
      wrap.appendChild(img);
    });
    $('#pc-holding-text').textContent = `✊ ${count} photo${count > 1 ? 's' : ''} attrapée${count > 1 ? 's' : ''} — ${
      cam ? 'ouvre la main vers l’écran 🖐' : 'ouvre la main devant le téléphone 🖐'
    }`;
  }

  function onData(msg) {
    switch (msg.t) {
      case 'grab':
        setGrabbed(true, msg.thumbs || [], msg.count);
        break;
      case 'ungrab':
        setGrabbed(false);
        break;
      case 'batch-start':
        setGrabbed(false);
        gallery.querySelector('.empty')?.remove();
        break;
      case 'file-start': {
        const card = document.createElement('figure');
        card.className = 'card incoming';
        card.innerHTML = `<div class="ph"></div><figcaption><span class="name"></span><progress max="1" value="0"></progress></figcaption>`;
        card.querySelector('.name').textContent = msg.name;
        gallery.prepend(card);
        incoming.set(msg.id, { ...msg, parts: [], got: 0, card });
        break;
      }
      case 'chunk': {
        const f = incoming.get(msg.id);
        if (!f) break;
        f.parts.push(msg.d);
        f.got += msg.d.byteLength;
        f.card.querySelector('progress').value = f.size ? f.got / f.size : 1;
        break;
      }
      case 'file-end': {
        const f = incoming.get(msg.id);
        if (!f) break;
        incoming.delete(msg.id);
        finishFile(f);
        break;
      }
      case 'batch-end':
        toast(`✅ ${msg.total} photo${msg.total > 1 ? 's' : ''} reçue${msg.total > 1 ? 's' : ''}`);
        break;
    }
  }

  function finishFile(f) {
    const blob = new Blob(f.parts, { type: f.mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    received.push({ url, name: f.name });
    const { card } = f;
    card.classList.remove('incoming');
    card.classList.add('landed');
    const img = document.createElement('img');
    img.alt = f.name;
    img.src = url;
    img.onerror = () => { img.replaceWith(Object.assign(document.createElement('div'), { className: 'ph', textContent: '🖼️' })); };
    card.querySelector('.ph').replaceWith(img);
    const cap = card.querySelector('figcaption');
    cap.innerHTML = '';
    const a = document.createElement('a');
    a.href = url;
    a.download = f.name;
    a.textContent = `⬇ ${f.name} (${formatSize(f.size)})`;
    cap.appendChild(a);
    $('#pc-count').textContent = received.length;
    $('#pc-dl-all').disabled = false;
  }

  $('#pc-dl-all').onclick = async () => {
    for (const { url, name } of received) {
      const a = Object.assign(document.createElement('a'), { href: url, download: name });
      document.body.appendChild(a);
      a.click();
      a.remove();
      await sleep(250);
    }
  };

  const camBtn = $('#pc-cam-btn');
  camBtn.onclick = async () => {
    if (cam) {
      cam.stop();
      cam = null;
      $('#pc-video-wrap').hidden = true;
      camBtn.textContent = 'Activer la webcam';
      conn?.open && conn.send({ t: 'pc-cam', on: false });
      return;
    }
    camBtn.disabled = true;
    camBtn.textContent = 'Chargement du modèle…';
    $('#pc-video-wrap').hidden = false;
    try {
      cam = await startGestureCamera($('#pc-video'), {
        facingMode: 'user',
        onGesture: (g) => {
          $('#pc-gesture').textContent = GESTURE_TEXT[g];
          if (g === 'open' && grabbed && conn?.open) {
            conn.send({ t: 'release' });
            $('#pc-holding-text').textContent = '🖐 Lâché ! Réception…';
          }
        },
      });
      camBtn.textContent = 'Couper la webcam';
      conn?.open && conn.send({ t: 'pc-cam', on: true });
    } catch (err) {
      $('#pc-video-wrap').hidden = true;
      camBtn.textContent = 'Activer la webcam';
      toast(cameraError(err));
    } finally {
      camBtn.disabled = false;
    }
  };
}

/* ------------------------------------------------------------------ */
/* Mode téléphone : choisit et envoie les photos                       */
/* ------------------------------------------------------------------ */

function startPhone(prefillCode) {
  show('phone');
  const status = $('#ph-status');
  const stateEl = $('#ph-state');
  let peer = null;
  let conn = null;
  let files = [];
  let thumbs = [];
  let state = 'idle'; // idle | ready | grabbed | sending
  let pcCam = false;
  let cam = null;
  let facing = 'user';
  let grabTimer = null;

  const connected = () => !!conn?.open;

  function refresh() {
    if (state === 'grabbed' || state === 'sending') return;
    const camOn = !!cam;
    state = files.length && connected() && camOn ? 'ready' : 'idle';
    $('#ph-send-btn').disabled = !(files.length && connected());
    let text;
    if (!connected()) text = 'Connecte-toi d’abord au PC.';
    else if (!files.length) text = 'Choisis des photos.';
    else if (!camOn) text = 'Active la caméra pour utiliser le geste.';
    else text = '✊ Ferme la main devant la caméra pour attraper les photos.';
    stateEl.textContent = text;
    stateEl.className = 'state';
  }

  function connect(code) {
    code = code.trim().toUpperCase();
    if (code.length !== 6) { setStatus(status, 'Le code fait 6 caractères.', 'bad'); return; }
    if (conn) conn.close();
    setStatus(status, 'Connexion…');
    const go = () => {
      const c = peer.connect(PREFIX + code, { reliable: true, serialization: 'binary' });
      conn = c;
      c.on('open', () => {
        setStatus(status, `💻 Connecté au PC (${code})`, 'ok');
        refresh();
      });
      c.on('data', (msg) => {
        if (msg.t === 'release') release();
        else if (msg.t === 'pc-cam') { pcCam = msg.on; if (state === 'grabbed') showGrabbedText(); }
      });
      c.on('close', () => {
        if (conn !== c) return;
        conn = null;
        cancelGrab();
        setStatus(status, 'Déconnecté du PC.', 'bad');
        refresh();
      });
    };
    if (!peer || peer.destroyed) {
      peer = new Peer(`${PREFIX}phone-${makeCode()}${makeCode()}`, PEER_OPTS);
      peer.on('open', go);
      peer.on('error', (err) => {
        const msg = err.type === 'peer-unavailable' ? 'Code introuvable. Vérifie le code affiché sur le PC.' : `Erreur : ${err.type || err.message}`;
        setStatus(status, msg, 'bad');
      });
      peer.on('disconnected', () => { if (!peer.destroyed) peer.reconnect(); });
    } else {
      go();
    }
  }

  $('#ph-form').onsubmit = (e) => {
    e.preventDefault();
    connect($('#ph-code').value);
  };
  if (prefillCode) {
    $('#ph-code').value = prefillCode.toUpperCase();
    connect(prefillCode);
  }

  $('#ph-files').onchange = async (e) => {
    files = Array.from(e.target.files || []);
    const grid = $('#ph-thumbs');
    grid.innerHTML = '';
    thumbs = [];
    for (const f of files) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(f);
      img.alt = f.name;
      grid.appendChild(img);
    }
    refresh();
    // Mini-aperçus envoyés au PC pendant que la main « tient » les photos.
    thumbs = (await Promise.all(files.slice(0, 4).map(tinyThumb))).filter(Boolean);
  };

  function showGrabbedText() {
    stateEl.textContent = pcCam
      ? '🖐 Pointe vers le PC et ouvre la main devant sa webcam !'
      : '🖐 Pointe vers le PC et ouvre la main !';
    stateEl.className = 'state grabbed';
  }

  function grab() {
    state = 'grabbed';
    navigator.vibrate?.(60);
    $('#ph-thumbs').classList.add('grabbed');
    showGrabbedText();
    conn.send({ t: 'grab', count: files.length, thumbs });
    clearTimeout(grabTimer);
    grabTimer = setTimeout(() => {
      cancelGrab();
      toast('Trop long… les photos ont été reposées.');
    }, GRAB_TIMEOUT_MS);
  }

  function cancelGrab() {
    clearTimeout(grabTimer);
    if (state !== 'grabbed') return;
    state = 'idle';
    $('#ph-thumbs').classList.remove('grabbed');
    if (connected()) conn.send({ t: 'ungrab' });
    refresh();
  }

  async function release() {
    if (state !== 'grabbed' && state !== 'manual') return;
    clearTimeout(grabTimer);
    state = 'sending';
    navigator.vibrate?.([30, 40, 30]);
    const grid = $('#ph-thumbs');
    grid.classList.remove('grabbed');
    grid.classList.add('fly');
    try {
      await sendFiles();
      stateEl.textContent = '✅ Envoyé !';
      stateEl.className = 'state ok';
      toast(`✅ ${files.length} photo${files.length > 1 ? 's' : ''} envoyée${files.length > 1 ? 's' : ''}`);
    } catch (err) {
      stateEl.textContent = `Échec de l’envoi : ${err.message || err}`;
      stateEl.className = 'state bad';
    }
    await sleep(1500);
    grid.classList.remove('fly');
    state = 'idle';
    refresh();
  }

  async function sendFiles() {
    const total = files.length;
    const totalBytes = files.reduce((n, f) => n + f.size, 0) || 1;
    let sent = 0;
    conn.send({ t: 'batch-start', total });
    for (let i = 0; i < total; i++) {
      const f = files[i];
      const id = makeId();
      conn.send({ t: 'file-start', id, name: f.name || `photo-${i + 1}.jpg`, mime: f.type, size: f.size, index: i });
      for (let off = 0; off < f.size; off += CHUNK_SIZE) {
        if (!connected()) throw new Error('connexion perdue');
        const d = await f.slice(off, off + CHUNK_SIZE).arrayBuffer();
        await waitForBuffer();
        conn.send({ t: 'chunk', id, d });
        sent += d.byteLength;
        stateEl.textContent = `📤 Envoi… ${Math.round((sent / totalBytes) * 100)} % (${i + 1}/${total})`;
      }
      conn.send({ t: 'file-end', id });
    }
    conn.send({ t: 'batch-end', total });
    await waitForBuffer(0);
  }

  async function waitForBuffer(limit = 1 << 20) {
    const dc = conn?.dataChannel;
    while (connected() && ((dc && dc.bufferedAmount > limit) || (conn.bufferSize || 0) > (limit ? 16 : 0))) {
      await sleep(20);
    }
  }

  $('#ph-send-btn').onclick = () => {
    if (!files.length || !connected() || state === 'sending') return;
    state = 'manual';
    release();
  };

  async function startCam() {
    const btn = $('#ph-cam-btn');
    btn.disabled = true;
    btn.textContent = 'Chargement du modèle…';
    $('#ph-video-wrap').hidden = false;
    $('#ph-video').classList.toggle('mirror', facing === 'user');
    try {
      cam = await startGestureCamera($('#ph-video'), {
        facingMode: facing,
        onGesture: (g) => {
          $('#ph-gesture').textContent = GESTURE_TEXT[g];
          if (g === 'fist' && state === 'ready') grab();
          else if (g === 'open' && state === 'grabbed' && !pcCam) release();
        },
      });
      btn.textContent = 'Couper la caméra';
      $('#ph-flip-btn').hidden = false;
    } catch (err) {
      $('#ph-video-wrap').hidden = true;
      btn.textContent = 'Activer la caméra';
      toast(cameraError(err));
    } finally {
      btn.disabled = false;
      refresh();
    }
  }

  function stopCam() {
    cam?.stop();
    cam = null;
    cancelGrab();
    $('#ph-video-wrap').hidden = true;
    $('#ph-flip-btn').hidden = true;
    $('#ph-cam-btn').textContent = 'Activer la caméra';
    refresh();
  }

  $('#ph-cam-btn').onclick = () => (cam ? stopCam() : startCam());
  $('#ph-flip-btn').onclick = () => {
    facing = facing === 'user' ? 'environment' : 'user';
    stopCam();
    startCam();
  };

  refresh();
}

function tinyThumb(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 96;
      const scale = size / Math.max(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

/* ------------------------------------------------------------------ */

$('#btn-pc').onclick = startPC;
$('#btn-phone').onclick = () => startPhone();

const joinCode = new URLSearchParams(location.search).get('join');
if (joinCode) startPhone(joinCode);
else show('home');
