// VICE GRID controller: state, drag-to-swap, pan + zoom, looks, layouts,
// caption editing, PNG export, and the ?shot= modes the screenshots use.
import { LOOKS, gradeFilter, gradeName, visibleSlots, defaultSlots, samplePath, clampGrade } from './cover.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const cover = $('#cover');
const panels = $$('.panel');
const titleInput = $('#titleInput');
const subInput = $('#subInput');
const gradeRange = $('#gradeRange');
const gradeVal = $('#gradeVal');
const sizeSelect = $('#sizeSelect');

const state = {
  slots: defaultSlots(),
  labels: ['Boulevard', 'Pier', 'Pier', 'Boulevard'],
  look: 'sunset',
  grade: 30,
  layout: 'grid',
  title: 'SUNSET HEIST',
  sub: 'LEONIDA · 2026',
  picked: 'boulevard',
  // Per-slot framing: zoom scale + pan offset in px.
  frame: [0, 1, 2, 3].map(() => ({ scale: 1, x: 0, y: 0 })),
};

function applyGrade() {
  const filter = gradeFilter(state.grade, state.look);
  panels.forEach((panel) => {
    panel.querySelector('.panel-img').style.filter = filter;
  });
  gradeVal.textContent = gradeName(state.grade);
  gradeRange.value = String(state.grade);
  cover.dataset.grade = String(state.grade);
}

function applyLook() {
  cover.classList.remove('look-sunset', 'look-neon', 'look-heat');
  cover.classList.add(`look-${state.look}`);
  $$('#lookRow .btn').forEach((b) => b.classList.toggle('is-active', b.dataset.look === state.look));
  applyGrade();
}

function applyLayout() {
  cover.classList.remove('layout-grid', 'layout-hero', 'layout-columns', 'layout-single');
  cover.classList.add(`layout-${state.layout}`);
  $$('#layoutRow .btn').forEach((b) => b.classList.toggle('is-active', b.dataset.layout === state.layout));
}

function applyCaption() {
  $('#coverTitle').textContent = state.title || 'UNTITLED';
  $('#coverSub').textContent = state.sub || '';
}

function applyFrame(slot) {
  const img = panels[slot].querySelector('.panel-img');
  const f = state.frame[slot];
  img.style.transform = `translate(${f.x}px, ${f.y}px) scale(${f.scale})`;
}

function renderSlots() {
  panels.forEach((panel, slot) => {
    const img = panel.querySelector('.panel-img');
    const name = state.slots[slot];
    if (img.dataset.photo !== name) {
      img.src = name.startsWith('data:') ? name : samplePath(name);
      img.dataset.photo = name;
    }
    panel.querySelector('.cap-title').textContent = state.labels[slot];
    applyFrame(slot);
  });
}

function renderAll() {
  renderSlots();
  applyLook();
  applyLayout();
  applyCaption();
}

// --- Drag panels to swap photos -------------------------------------------
let dragSlot = -1;
panels.forEach((panel, slot) => {
  panel.addEventListener('dragstart', (e) => {
    // Only a drag begun on the caption strip swaps panels; a drag begun on
    // the photo itself is a pan (handled by the pointer handlers below).
    if (!e.target.closest('.panel-cap')) { e.preventDefault(); return; }
    dragSlot = slot;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(slot)); } catch { /* noop */ }
  });
  panel.addEventListener('dragover', (e) => {
    if (dragSlot < 0) return;
    e.preventDefault();
    panel.classList.add('drag-over');
  });
  panel.addEventListener('dragleave', () => panel.classList.remove('drag-over'));
  panel.addEventListener('drop', (e) => {
    e.preventDefault();
    panel.classList.remove('drag-over');
    if (dragSlot < 0 || dragSlot === slot) return;
    swapSlots(dragSlot, slot);
    dragSlot = -1;
  });
  panel.addEventListener('dragend', () => {
    dragSlot = -1;
    panels.forEach((p) => p.classList.remove('drag-over'));
  });
  // Click a panel to place the picked photo there.
  panel.addEventListener('click', () => {
    if (state.picked && state.slots[slot] !== state.picked) {
      state.slots[slot] = state.picked;
      state.labels[slot] = labelFor(state.picked);
      state.frame[slot] = { scale: 1, x: 0, y: 0 };
      renderSlots();
    }
  });
});

function swapSlots(a, b) {
  [state.slots[a], state.slots[b]] = [state.slots[b], state.slots[a]];
  [state.labels[a], state.labels[b]] = [state.labels[b], state.labels[a]];
  [state.frame[a], state.frame[b]] = [state.frame[b], state.frame[a]];
  renderSlots();
}

function labelFor(name) {
  if (name === 'boulevard') return 'Boulevard';
  if (name === 'pier') return 'Pier';
  return 'Your photo';
}

// --- Pan (drag the photo) + zoom (scroll over a panel) --------------------
panels.forEach((panel, slot) => {
  const img = panel.querySelector('.panel-img');
  let panning = null;
  img.addEventListener('pointerdown', (e) => {
    panning = { x: e.clientX, y: e.clientY };
    img.setPointerCapture(e.pointerId);
    panel.classList.add('is-pan');
  });
  img.addEventListener('pointermove', (e) => {
    if (!panning) return;
    const f = state.frame[slot];
    f.x += e.clientX - panning.x;
    f.y += e.clientY - panning.y;
    panning = { x: e.clientX, y: e.clientY };
    const limit = 90 * f.scale;
    f.x = Math.max(-limit, Math.min(limit, f.x));
    f.y = Math.max(-limit, Math.min(limit, f.y));
    applyFrame(slot);
  });
  const stopPan = () => { panning = null; panel.classList.remove('is-pan'); };
  img.addEventListener('pointerup', stopPan);
  img.addEventListener('pointercancel', stopPan);
  panel.addEventListener('wheel', (e) => {
    e.preventDefault();
    const f = state.frame[slot];
    f.scale = Math.max(1, Math.min(3, f.scale * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
    if (f.scale === 1) { f.x = 0; f.y = 0; }
    applyFrame(slot);
  }, { passive: false });
});

// --- Filmstrip: pick a photo, upload your own ------------------------------
$('#filmstrip').addEventListener('click', (e) => {
  const thumb = e.target.closest('.thumb');
  if (!thumb) return;
  state.picked = thumb.dataset.photo;
  $$('#filmstrip .thumb').forEach((t) => t.classList.toggle('is-active', t === thumb));
});

$('#uploadInput').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const url = String(reader.result);
    const strip = $('#filmstrip');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.dataset.photo = url;
    const thumb = document.createElement('img');
    thumb.src = url;
    thumb.alt = file.name;
    const tag = document.createElement('span');
    tag.textContent = 'Your photo';
    btn.append(thumb, tag);
    strip.append(btn);
    state.picked = url;
    $$('#filmstrip .thumb').forEach((t) => t.classList.toggle('is-active', t === btn));
  };
  reader.readAsDataURL(file);
});

// --- Looks, grade, layout, caption -----------------------------------------
$('#lookRow').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-look]');
  if (!btn) return;
  state.look = btn.dataset.look;
  state.grade = LOOKS[state.look].grade;
  applyLook();
});

gradeRange.addEventListener('input', () => {
  state.grade = clampGrade(gradeRange.value);
  applyGrade();
});

$('#layoutRow').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-layout]');
  if (!btn) return;
  state.layout = btn.dataset.layout;
  applyLayout();
});

titleInput.addEventListener('input', () => { state.title = titleInput.value.toUpperCase(); applyCaption(); });
subInput.addEventListener('input', () => { state.sub = subInput.value; applyCaption(); });

// --- Export PNG -------------------------------------------------------------
function slotRect(slot, side) {
  // Panel bounds inside the square cover, matching the CSS grid (6px gaps).
  const gap = 6;
  if (state.layout === 'grid') {
    const half = (side - gap) / 2;
    return { x: (slot % 2) * (half + gap), y: Math.floor(slot / 2) * (half + gap), w: half, h: half };
  }
  if (state.layout === 'hero') {
    if (slot === 0) return { x: 0, y: 0, w: (side - gap) * 2 / 3, h: side };
    const small = (side - gap) / 3;
    const x0 = (side - gap) * 2 / 3 + gap;
    return { x: x0, y: (slot - 1) * (small + gap), w: small, h: small };
  }
  if (state.layout === 'columns') {
    const w = (side - gap * 2) / 3;
    return { x: slot * (w + gap), y: 0, w, h: side };
  }
  return { x: 0, y: 0, w: side, h: side };
}

function drawCover(ctx, side) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, side, side);
  const shown = visibleSlots(state.layout);
  for (let slot = 0; slot < shown; slot++) {
    const img = panels[slot].querySelector('.panel-img');
    if (!img.complete || !img.naturalWidth) continue;
    const r = slotRect(slot, side);
    const f = state.frame[slot];
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    ctx.filter = gradeFilter(state.grade, state.look);
    const base = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight) * f.scale;
    const dw = img.naturalWidth * base;
    const dh = img.naturalHeight * base;
    ctx.drawImage(img, r.x + (r.w - dw) / 2 + f.x * (side / 720), r.y + (r.h - dh) / 2 + f.y * (side / 720), dw, dh);
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(r.x, r.y + r.h - 34 * (side / 1080), r.w, 34 * (side / 1080));
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${Math.round(15 * side / 1080)}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillText(state.labels[slot].toUpperCase(), r.x + 10, r.y + r.h - 12 * (side / 1080));
  }
  // Title block.
  const grad = ctx.createLinearGradient(0, 0, 0, 150 * (side / 1080));
  grad.addColorStop(0, 'rgba(0,0,0,0.65)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, side, 150 * (side / 1080));
  ctx.fillStyle = '#ff2e88';
  ctx.font = `900 ${Math.round(54 * side / 1080)}px "Arial Black", "Segoe UI", sans-serif`;
  ctx.fillText(state.title || 'UNTITLED', 22 * (side / 1080), 68 * (side / 1080));
  ctx.fillStyle = '#ffb347';
  ctx.font = `700 ${Math.round(15 * side / 1080)}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillText((state.sub || '').toUpperCase(), 24 * (side / 1080), 96 * (side / 1080));
}

function exportPNG() {
  const [w, h] = sizeSelect.value.split('x').map(Number);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const side = Math.min(w, h);
  const off = document.createElement('canvas');
  off.width = side;
  off.height = side;
  drawCover(off.getContext('2d'), side);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(off, (w - side) / 2, (h - side) / 2);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-grid-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

$('#exportBtn').addEventListener('click', exportPNG);

// --- Keyboard shortcuts -----------------------------------------------------
// Keys 1-4 switch layouts, L cycles the looks, E exports the PNG.
const LAYOUT_ORDER = ['grid', 'hero', 'columns', 'single'];
const LOOK_ORDER = ['sunset', 'neon', 'heat'];
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, select, textarea')) return;
  const key = e.key.toLowerCase();
  if (key >= '1' && key <= '4') {
    state.layout = LAYOUT_ORDER[Number(key) - 1];
    applyLayout();
  } else if (key === 'l') {
    const nextLook = LOOK_ORDER[(LOOK_ORDER.indexOf(state.look) + 1) % LOOK_ORDER.length];
    state.look = nextLook;
    state.grade = LOOKS[nextLook].grade;
    applyLook();
  } else if (key === 'e') {
    exportPNG();
  }
});

// --- Screenshot modes (?shot=cover|editor) -----------------------------------
function applyShotParams() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (!shot) return false;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = q.get('photo');
  if (photo) {
    state.picked = photo;
    state.slots = [photo, photo === 'boulevard' ? 'pier' : 'boulevard', photo === 'boulevard' ? 'pier' : 'boulevard', photo];
    state.labels = state.slots.map((s) => labelFor(s));
  }
  const caption = q.get('caption');
  if (caption) { state.title = caption.toUpperCase(); titleInput.value = state.title; }
  const look = q.get('look');
  if (look && LOOKS[look]) { state.look = look; state.grade = LOOKS[look].grade; }
  const grade = q.get('grade');
  if (grade !== null) state.grade = clampGrade(grade);
  const layout = q.get('layout');
  if (layout) state.layout = layout;
  renderAll();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
  return true;
}

renderAll();
applyShotParams();
