// --- US Influence Layer Color Utility ---
import { hexToRgb, mixColours } from './colorUtils';

// ── US Influence palette (navy → blue → white) ──────────
const US_LOW  = hexToRgb('#0f172a'); // Dark navy   (low influence)
const US_MID  = hexToRgb('#2563eb'); // Royal blue  (mid influence)
const US_HIGH = hexToRgb('#dbeafe'); // Light blue  (high influence)

/**
 * Returns a hex color for a US Influence score (0–100).
 * Gradient: dark navy → royal blue → light blue/white.
 * Returns dark slate (#1e293b) for null/undefined scores.
 */
export function getUSColour(score) {
  if (score == null) return '#1e293b';
  const t = Math.max(0, Math.min(1, score / 100));
  if (t < 0.5) return mixColours(US_LOW, US_MID, t / 0.5);
  return mixColours(US_MID, US_HIGH, (t - 0.5) / 0.5);
}
