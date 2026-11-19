// VICE GRID cover model: pure helpers for the grade, the looks and the layouts.
// The grade runs 0 (golden hour) to 100 (neon night); a look picks a grade
// starting point plus its own tint, and the layout picks how the four panel
// slots are arranged on the square cover.

export const LOOKS = {
  sunset: { label: 'Sunset Strip', grade: 20, tint: 'warm' },
  neon: { label: 'Neon Night', grade: 85, tint: 'cool' },
  heat: { label: 'Heat Wave', grade: 48, tint: 'hot' },
};

export const LAYOUTS = {
  grid: '2 × 2 Grid',
  hero: 'Hero + 3',
  columns: 'Columns',
  single: 'Single',
};

// Blend two numbers by t in [0, 1].
function mix(a, b, t) {
  return a + (b - a) * t;
}

// Grade 0 is a warm golden-hour wash; grade 100 is a cold neon-night wash.
// Both ends are expressed as a CSS filter string so the staged <img> and the
// export canvas can share exactly the same grade.
export function gradeFilter(grade, lookName = 'sunset') {
  const t = Math.max(0, Math.min(100, grade)) / 100;
  const look = LOOKS[lookName] ?? LOOKS.sunset;
  const hue = mix(-10, 32, t) + (look.tint === 'hot' ? 6 : look.tint === 'cool' ? 10 : 0);
  const sat = mix(1.22, 1.62, t) + (look.tint === 'hot' ? 0.22 : 0);
  const bright = mix(1.06, 0.84, t);
  const contrast = mix(1.04, 1.16, t) + (look.tint === 'hot' ? 0.06 : 0);
  const sepia = mix(0.28, 0.0, t);
  return `sepia(${sepia.toFixed(2)}) saturate(${sat.toFixed(2)}) hue-rotate(${hue.toFixed(1)}deg) brightness(${bright.toFixed(2)}) contrast(${contrast.toFixed(2)})`;
}

export function gradeName(grade) {
  if (grade <= 20) return 'Golden hour';
  if (grade <= 45) return 'Late sunset';
  if (grade <= 70) return 'Blue hour';
  if (grade <= 88) return 'Neon dusk';
  return 'Neon night';
}

// How many panel slots a layout actually shows on the cover.
export function visibleSlots(layout) {
  if (layout === 'columns') return 3;
  if (layout === 'single') return 1;
  return 4;
}

// The cover's default slot assignment mixes the two sample photos so the
// first render already shows both: boulevard, pier, pier, boulevard.
export function defaultSlots() {
  return ['boulevard', 'pier', 'pier', 'boulevard'];
}

export function samplePath(name) {
  return `samples/${name}.jpg`;
}

export function clampGrade(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 30;
  return Math.max(0, Math.min(100, Math.round(n)));
}
