/**
 * Generate SVG translation string.
 * @param x
 * @param y
 * @returns {string}
 */
export function translate(x: number, y: number): string {
  return `translate(${x}, ${y})`;
}