# Coding Standards & Conventions

This document specifies the style guide, code organization conventions, and engine safety rules for modifying or extending the 2D Auto-Battle Arena project.

---

## 1. Modular Style (ES Modules)

- **Strict native ES Modules**: Always use `import` and `export` statements. Do not use CommonJS `require()` or `module.exports`.
- **Explicit file extensions**: When importing local modules, always include the `.js` suffix.
  - *Correct*: `import { utils } from './utils.js';`
  - *Incorrect*: `import { utils } from './utils';`
- **Zero NPM imports at runtime**: Do not introduce third-party libraries (e.g. lodash, three.js, pixi.js) into the game loop code. Keep it purely native.

---

## 2. Mathematical Safety & Precision

Since automatic battles can run for long periods and involve division/trigonometry:
- **Avoid division by zero**: When normalizing direction vectors, never divide coordinates by distance directly without protecting against `dist === 0`.
- **NaN Defense**: Use the `safeFinite(value, fallback)` function from `utils.js` on entity positions, speeds, and calculations:
  ```javascript
  this.x = safeFinite(this.x, fallbackX);
  ```
- **Angle Normalization**: Keep angles between `0` and `2 * Math.PI` using `normaliseAngle(angle)`.

---

## 3. HTML5 Canvas Drawing Guidelines

When extending or customizing character decoration drawings (`drawDecorations`):
- **State Isolation**: Always wrap drawing logic in `ctx.save()` and `ctx.restore()`. This ensures transformations (translation, rotation, fillStyle) do not leak into downstream drawing loops.
- **Dynamic Rotation**: Center drawings at local origin `(0, 0)` by applying `ctx.translate(x, y)` and `ctx.rotate(angle)` on the canvas context first.
- **Performance**: Minimize canvas path resets. Prefer using simple geometric rects, arcs, and lines. Avoid complex canvas clipping operations inside high-frequency updates.

---

## 4. Web Audio Synthesis Safety

When generating sounds via oscillators:
- **Prevent volume pops**: Never cut off an oscillator gain node abruptly to 0. It causes high-frequency clipping pops.
- **Ramp Envelopes**: Always apply an exponential envelope decay towards `0.001` or `0.0001` before terminating nodes:
  ```javascript
  gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  ```
- **Node Disposal**: Ensure all created oscillator and buffer nodes are disconnected and stopped after their envelope duration to prevent browser memory leaks.

---

## 5. UI & CSS Guidelines

- **Vanilla CSS styling**: All styling belongs in `style.css` using custom properties (CSS variables).
- **Glassmorphism Theme**: Keep styling compliant with the frosted glass aesthetics:
  ```css
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  ```
- **Semantic IDs**: Assign unique, descriptive IDs to all button states, control panels, and selects to ensure Puppeteer tests can locate and click elements.
