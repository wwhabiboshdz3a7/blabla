// Détection des gestes de la main (poing fermé / main ouverte) avec MediaPipe.
const VISION_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

const MIN_SCORE = 0.55;
const STABLE_FRAMES = 3; // nombre d'images consécutives pour valider un geste

let recognizerPromise = null;

function getRecognizer() {
  if (!recognizerPromise) {
    recognizerPromise = (async () => {
      const { GestureRecognizer, FilesetResolver } = await import(`${VISION_URL}/vision_bundle.mjs`);
      const fileset = await FilesetResolver.forVisionTasks(`${VISION_URL}/wasm`);
      const options = (delegate) => ({
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: 'VIDEO',
        numHands: 1,
      });
      try {
        return await GestureRecognizer.createFromOptions(fileset, options('GPU'));
      } catch {
        return await GestureRecognizer.createFromOptions(fileset, options('CPU'));
      }
    })();
    recognizerPromise.catch(() => { recognizerPromise = null; });
  }
  return recognizerPromise;
}

function toLabel(category) {
  if (!category || category.score < MIN_SCORE) return 'none';
  if (category.categoryName === 'Closed_Fist') return 'fist';
  if (category.categoryName === 'Open_Palm') return 'open';
  return 'other';
}

/**
 * Ouvre la caméra dans `video` et appelle `onGesture('fist' | 'open' | 'other' | 'none')`
 * à chaque changement de geste stable. Retourne un objet { stop() }.
 */
export async function startGestureCamera(video, { facingMode = 'user', onGesture }) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();

  let recognizer;
  try {
    recognizer = await getRecognizer();
  } catch (err) {
    stream.getTracks().forEach((t) => t.stop());
    throw err;
  }

  let running = true;
  let lastTime = -1;
  let candidate = 'none';
  let count = 0;
  let stable = 'none';

  const loop = () => {
    if (!running) return;
    if (video.readyState >= 2 && video.currentTime !== lastTime) {
      lastTime = video.currentTime;
      const result = recognizer.recognizeForVideo(video, performance.now());
      const label = toLabel(result.gestures?.[0]?.[0]);
      if (label === candidate) count++;
      else { candidate = label; count = 1; }
      if (count >= STABLE_FRAMES && label !== stable) {
        stable = label;
        onGesture(stable);
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  return {
    stop() {
      running = false;
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    },
  };
}

export const GESTURE_TEXT = {
  fist: '✊ Poing fermé',
  open: '🖐 Main ouverte',
  other: '🤚 Main',
  none: '—',
};
