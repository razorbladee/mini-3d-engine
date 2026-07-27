/**
 * Parses `#rgb`, `#rrggbb` or the same without the hash into linear 0..1 RGB.
 *
 * Hex parsing used to be reimplemented three times - Color.setHex,
 * BasicMaterial.parseColor and WebGLRenderer.color - and none of them validated
 * their input, so a malformed string produced NaN that travelled silently into
 * a uniform (AUDIT-TZ P3-3).
 */
export function parseHexColor(value: string): [number, number, number] {
  const hex = value.startsWith('#') ? value.slice(1) : value;
  const expanded =
    hex.length === 3
      ? hex
          .split('')
          .map((channel) => channel + channel)
          .join('')
      : hex;

  if (expanded.length !== 6 || !/^[0-9a-f]{6}$/i.test(expanded))
    throw new Error(`Invalid hex colour: ${JSON.stringify(value)}`);

  const numeric = parseInt(expanded, 16);
  return [((numeric >> 16) & 255) / 255, ((numeric >> 8) & 255) / 255, (numeric & 255) / 255];
}

export class Color {
  constructor(
    public r = 1,
    public g = 1,
    public b = 1,
  ) {}

  set(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
    return this;
  }

  setHex(value: string) {
    const [r, g, b] = parseHexColor(value);
    return this.set(r, g, b);
  }

  copy(color: Color) {
    return this.set(color.r, color.g, color.b);
  }

  clone() {
    return new Color(this.r, this.g, this.b);
  }

  equals(color: Color) {
    return this.r === color.r && this.g === color.g && this.b === color.b;
  }

  toArray(): [number, number, number] {
    return [this.r, this.g, this.b];
  }
}
