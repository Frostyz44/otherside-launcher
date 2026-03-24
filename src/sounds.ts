const cache: Record<string, AudioBuffer> = {};
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

async function load(path: string): Promise<AudioBuffer | null> {
  if (cache[path]) return cache[path];
  try {
    const res = await fetch(path);
    const arr = await res.arrayBuffer();
    const buf = await getCtx().decodeAudioData(arr);
    cache[path] = buf;
    return buf;
  } catch {
    return null;
  }
}

function play(buf: AudioBuffer, volume = 1.0, duration?: number, offset = 0) {
  const c = getCtx();
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = volume;
  src.buffer = buf;
  src.connect(g);
  g.connect(c.destination);
  const dur = duration ?? (buf.duration - offset);
  g.gain.setValueAtTime(volume, c.currentTime + Math.max(0, dur - 0.08));
  g.gain.linearRampToValueAtTime(0, c.currentTime + dur);
  src.start(c.currentTime, offset, dur);
}

// Preload all sounds on first import
const SOUNDS = {
  click:     '/sounds/click.mp3',
  launch:    '/sounds/launch_v2.mp3',
  slide:     '/sounds/slide.mp3',
  hoverPlay: '/sounds/hover-play.mp3',
};

export function preloadSounds() {
  Object.values(SOUNDS).forEach(path => load(path));
}

let lastHoverPlay = 0;
export async function sfxHoverPlay() {
  const now = Date.now();
  if (now - lastHoverPlay < 800) return;
  lastHoverPlay = now;
  const buf = await load(SOUNDS.hoverPlay);
  if (buf) play(buf, 0.3);
}

let lastHover = 0;
export function sfxHover() {
  const now = Date.now();
  if (now - lastHover < 80) return; // throttle — max once per 80ms
  lastHover = now;
  const c = getCtx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = 1200;
  g.gain.setValueAtTime(0.015, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  osc.connect(g); g.connect(c.destination);
  osc.start(t); osc.stop(t + 0.04);
}

export async function sfxClick() {
  const buf = await load(SOUNDS.click);
  if (buf) play(buf, 0.1);
}

export async function sfxNavigate() {
  const buf = await load(SOUNDS.click);
  if (buf) play(buf, 0.15);
}

export async function sfxLaunch() {
  const buf = await load(SOUNDS.launch);
  if (buf) play(buf, 0.25, 1.5);
}

export async function sfxSlide() {
  const buf = await load(SOUNDS.slide);
  if (buf) play(buf, 0.15, 0.4, 0);
}
