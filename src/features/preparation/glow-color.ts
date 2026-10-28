/**
 * The original Border Glow takes its glow as an `"H S L"` string (it parses three numbers).
 * Theme tokens are hex, so this converts `#rrggbb` / `#rgb` to that form. Anything else
 * returns null and the caller keeps the component's default.
 */
export function hexToHslTriplet(hex: string): string | null {
  const value = hex.trim().replace(/^#/, '');
  if (!/^([\da-f]{3}|[\da-f]{6})$/i.test(value)) return null;
  const full = value.length === 3 ? value.replace(/./g, '$&$&') : value;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const round = (n: number) => Math.round(n * 10) / 10;
  return `${round(h)} ${round(s * 100)} ${round(l * 100)}`;
}
