const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector('.hero');
const acquisition = document.querySelector('.acquisition');
let introTimers = [];
let introRun = 0;
function finishIntro() {
  introRun++;
  clearTimeout(window.introSafetyTimer);
  introTimers.forEach(clearTimeout);
  introTimers = [];
  hero.classList.remove('is-acquiring');
  document.documentElement.classList.remove('intro-pending', 'intro-running');
  acquisition.hidden = true;
  try { sessionStorage.setItem('tmttl-fade-seen-v2', 'yes'); } catch {}
}
function startIntro() {
  finishIntro();
  if (reducedMotion.matches) return;
  const run = ++introRun;
  document.documentElement.classList.add('intro-running');
  acquisition.hidden = false;
  // Start the fade when the photograph is ready, with a bounded wait and a
  // cancellation token so Skip or a second replay cannot resurrect an intro.
  const imageReady = hero.querySelector('.hero-image').decode().catch(() => {});
  const boundedWait = new Promise(resolve => introTimers.push(setTimeout(resolve, 1800)));
  Promise.race([imageReady, boundedWait]).then(() => {
    if (run !== introRun) return;
    void hero.offsetWidth;
    hero.classList.add('is-acquiring');
    introTimers.push(setTimeout(finishIntro, 4600));
  });
}
let seen = false;
try { seen = sessionStorage.getItem('tmttl-fade-seen-v2') === 'yes'; } catch {}
if (!seen && !location.hash) startIntro();
document.querySelector('#skip-intro').addEventListener('click', () => {
  finishIntro();
  document.querySelector('.hero-bottom a').focus({ preventScroll: true });
});
document.querySelector('#replay-intro').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'instant' });
  startIntro();
  document.querySelector(reducedMotion.matches ? '.hero-bottom a' : '#skip-intro').focus({ preventScroll: true });
});
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', finishIntro));

// Native audio remains the fallback until each custom control is connected.
const status = document.querySelector('#audio-status');
const rows = [...document.querySelectorAll('.track')];
const audios = rows.map(row => row.querySelector('audio'));
const videos = [...document.querySelectorAll('.videos video')];
const mediaPlayers = [...audios, ...videos];
const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>';
const pauseIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>';
let intendedAudio = null;
const time = value => {
  const seconds = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};
rows.forEach(row => {
  const audio = row.querySelector('audio');
  const play = row.querySelector('.track-play');
  const seek = row.querySelector('.track-seek');
  const timeline = row.querySelector('.track-timeline');
  const label = row.querySelector('.track-time');
  const title = row.dataset.title;
  const syncProgress = () => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 45;
    seek.max = duration;
    seek.value = audio.currentTime;
    seek.style.setProperty('--played', `${duration > 0 ? audio.currentTime / duration * 100 : 0}%`);
    seek.setAttribute('aria-valuetext', `${time(audio.currentTime)} of ${time(duration)}`);
    label.textContent = `${time(audio.currentTime)} / ${time(duration)}`;
  };
  const syncState = () => {
    const playing = !audio.paused && !audio.ended;
    row.classList.toggle('is-playing', playing);
    play.innerHTML = playing ? pauseIcon : playIcon;
    play.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${title}`);
    play.setAttribute('aria-pressed', String(playing));
  };
  play.addEventListener('click', async () => {
    if (!audio.paused) { intendedAudio = null; audio.pause(); return; }
    intendedAudio = audio;
    mediaPlayers.forEach(other => { if (other !== audio) other.pause(); });
    if (audio.error) audio.load();
    if (audio.ended) audio.currentTime = 0;
    play.disabled = true;
    row.setAttribute('aria-busy', 'true');
    try {
      await audio.play();
      if (intendedAudio !== audio) audio.pause();
    } catch (error) {
      if (intendedAudio === audio && error.name !== 'AbortError') status.textContent = `Could not play ${title}. Please try again.`;
    } finally {
      play.disabled = false;
      row.removeAttribute('aria-busy');
      syncState();
    }
  });
  audio.addEventListener('play', () => {
    if (intendedAudio !== audio) { audio.pause(); return; }
    mediaPlayers.forEach(other => { if (other !== audio) other.pause(); });
    status.textContent = `Now playing / ${title}`;
    syncState();
  });
  audio.addEventListener('pause', () => {
    syncState();
    if (intendedAudio === audio || intendedAudio === null) status.textContent = `Paused / ${title}`;
  });
  audio.addEventListener('ended', () => {
    syncState();
    status.textContent = `Excerpt complete / ${title}`;
  });
  audio.addEventListener('error', () => { status.textContent = `The ${title} excerpt could not load. Please try again.`; });
  audio.addEventListener('loadedmetadata', () => { seek.disabled = false; syncProgress(); });
  audio.addEventListener('timeupdate', syncProgress);
  seek.addEventListener('input', () => { audio.currentTime = Number(seek.value); syncProgress(); });
  play.hidden = false;
  timeline.hidden = false;
  audio.controls = false;
  row.classList.add('is-enhanced');
  syncProgress();
});

// Videos use native controls. Only a visitor's play action starts playback.
videos.forEach(video => {
  const errorNote = video.closest('.video-work').querySelector('.video-error');
  video.addEventListener('play', () => {
    intendedAudio = null;
    mediaPlayers.forEach(other => { if (other !== video) other.pause(); });
  });
  video.addEventListener('loadeddata', () => { errorNote.hidden = true; });
  const showError = () => { errorNote.hidden = false; };
  video.addEventListener('error', showError);
  video.querySelector('source').addEventListener('error', showError);
});

// A quiet photographic sequence. Rotation stops outside the viewport,
// in background tabs, on hover, and when a visitor uses its controls.
const photographs = [
  ['visual', 'AVZ-121', 'Black fabric suspended in the air against the sunset.', 'landscape'],
  ['avz-6', 'AVZ-6', 'A figure draws black fabric through the air against sunlit desert rocks.', 'landscape'],
  ['veil', 'AVZ-45', 'A black veil catches the sunlight around a figure with raised arms.', 'portrait'],
  ['light', 'AVZ-44', 'A veiled figure dissolves into the golden light of the landscape.', 'landscape'],
  ['portrait', 'AVZ-70', 'A portrait through translucent black fabric.', 'portrait'],
  ['ritual', 'AVZ-120', 'A figure holds black fabric above their head in the desert.', 'landscape'],
  ['hero', 'AVZ-122', 'A silhouetted figure raises a black veil at sunset.', 'landscape'],
  ['avz-115', 'AVZ-115', 'A figure faces the sunset with a black veil spread from outstretched arms.', 'landscape']
];
const sequence = document.querySelector('.image-sequence');
const stage = sequence.querySelector('.sequence-stage');
const imageContainer = document.querySelector('#sequence-images');
const dotsContainer = document.querySelector('#sequence-dots');
const rotation = document.querySelector('#pause-images');
const imageStatus = document.querySelector('#image-status');
const firstImage = imageContainer.querySelector('img');
let currentImage = 0;
let userPaused = reducedMotion.matches;
let visible = false;
let hovered = false;
let rotationTimer;
let imageRequest = 0;
const images = [], dots = [];
function syncRotation() {
  clearTimeout(rotationTimer);
  const running = !userPaused && visible && !hovered && !document.hidden;
  stage.classList.toggle('is-moving', running && !reducedMotion.matches);
  rotation.textContent = userPaused ? 'Play motion' : 'Pause motion';
  rotation.setAttribute('aria-label', userPaused ? 'Start automatic photograph sequence' : 'Pause automatic photograph sequence');
  if (running) rotationTimer = setTimeout(() => showImage(currentImage + 1), 8500);
}
async function showImage(index, manual = false) {
  clearTimeout(rotationTimer);
  const request = ++imageRequest;
  const next = (index + images.length) % images.length;
  const image = images[next];
  if (manual) userPaused = true;
  image.loading = 'eager';
  try {
    await image.decode();
    if (request !== imageRequest) return;
    images.forEach((photo, i) => { photo.classList.toggle('is-active', i === next); photo.setAttribute('aria-hidden', String(i !== next)); });
    dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === next)));
    currentImage = next;
    document.querySelector('#image-count').textContent = `${String(next + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
    if (manual) imageStatus.textContent = `Photograph ${next + 1} of ${images.length}. ${photographs[next][2]}`;
    images[(next + 1) % images.length].loading = 'eager';
  } catch {
    imageStatus.textContent = 'This photograph could not load. Please select another.';
  }
  if (request === imageRequest) syncRotation();
}
photographs.forEach(([slug, id, description, format], index) => {
  const photo = index === 0 ? firstImage : document.createElement('img');
  if (index !== 0) {
    photo.src = `assets/images/${slug}.webp`;
    photo.alt = description;
    photo.className = 'sequence-image';
    photo.loading = 'lazy';
    photo.width = format === 'portrait' ? 1467 : 2200;
    photo.height = format === 'portrait' ? 2200 : 1467;
    imageContainer.append(photo);
  }
  photo.dataset.format = format;
  photo.setAttribute('aria-hidden', String(index !== 0));
  images.push(photo);
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('aria-label', `Show photograph ${index + 1}: ${id}`);
  dot.setAttribute('aria-pressed', String(index === 0));
  dot.addEventListener('click', () => showImage(index, true));
  dotsContainer.append(dot);
  dots.push(dot);
});
sequence.querySelector('.sequence-bottom').hidden = false;
document.querySelector('#image-count').textContent = `01 / ${String(images.length).padStart(2, '0')}`;
document.querySelector('#previous-image').addEventListener('click', () => showImage(currentImage - 1, true));
document.querySelector('#next-image').addEventListener('click', () => showImage(currentImage + 1, true));
rotation.addEventListener('click', () => { userPaused = !userPaused; syncRotation(); });
sequence.addEventListener('focusin', event => { if (event.target !== rotation) { userPaused = true; syncRotation(); } });
sequence.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; syncRotation(); } });
sequence.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovered = false; syncRotation(); } });
document.addEventListener('visibilitychange', syncRotation);
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncRotation(); }, { threshold: 0.2 });
  observer.observe(sequence);
} else { visible = true; syncRotation(); }

// Subtle depth follows ordinary scrolling; there is no scroll interception.
let scrollFrame = 0;
function updateScroll() {
  scrollFrame = 0;
  const max = document.documentElement.scrollHeight - innerHeight;
  document.documentElement.style.setProperty('--read', max > 0 ? Math.min(1, scrollY / max) : 0);
  hero.style.setProperty('--hero-shift', `${reducedMotion.matches ? 0 : Math.min(scrollY * 0.045, 24)}px`);
}
addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); }, { passive: true });
addEventListener('resize', updateScroll);
updateScroll();
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); reveal.unobserve(entry.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('[data-reveal]').forEach(element => { element.classList.add('reveal-ready'); reveal.observe(element); });
}
reducedMotion.addEventListener('change', () => {
  finishIntro();
  userPaused = reducedMotion.matches || userPaused;
  syncRotation();
  updateScroll();
  document.querySelectorAll('.reveal-ready').forEach(element => element.classList.add('is-revealed'));
});
