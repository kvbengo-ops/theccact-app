import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Every theme must keep text readable (WCAG AA, 4.5:1).
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('learning themes keep text contrast at AA on cards and page background', () => {
  const css = readFileSync('src/styles/learn-themes.css', 'utf8');
  const blocks = [...css.matchAll(/html\[data-theme='(\w+)'\] body\.learn-body \{([^}]*)\}/g)];
  assert.equal(blocks.length, 5);
  for (const [, name, body] of blocks) {
    const vars = Object.fromEntries([...body.matchAll(/--([\w-]+): (#[0-9a-f]{6});/g)].map((m) => [m[1], m[2]]));
    for (const fg of ['ink', 'color-text', 'color-text-muted', 'color-success', 'color-error', 'color-gold-dark']) {
      if (!vars[fg]) continue; // inherits the light theme value
      for (const bg of ['surface', 'color-cream', 'color-sand']) {
        const got = ratio(vars[fg], vars[bg]);
        assert.ok(got >= 4.5, `${name}: ${fg} on ${bg} is ${got.toFixed(2)}`);
      }
    }
  }
});

test('the theme menu lists exactly the themes that have styles', () => {
  const css = readFileSync('src/styles/learn-themes.css', 'utf8');
  const picker = readFileSync('src/components/LearnThemePicker.astro', 'utf8');
  const listed = [...picker.matchAll(/^\s+\['(\w+)', '/gm)].map((m) => m[1]);
  const styled = [...css.matchAll(/html\[data-theme='(\w+)'\]/g)].map((m) => m[1]);
  assert.deepEqual(listed.sort(), ['light', ...styled].sort());
});
