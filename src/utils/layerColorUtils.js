// --- China Influence Layer Color Utility ---
import { hexToRgb, mixColours } from './colorUtils';

const CHINA_LOW  = hexToRgb('#6b7280'); // Slate-gray  (low influence)
const CHINA_MID  = hexToRgb('#fbbf24'); // Amber       (mid influence)
const CHINA_HIGH = hexToRgb('#dc2626'); // Crimson     (high influence)

/**
 * Returns a hex color for a China Influence score (0–100).
 * Gradient: slate-gray → amber → crimson.
 * Returns dark slate for null/undefined scores.
 */
export function getChinaColour(score) {
  if (!Number.isFinite(score)) return '#1e293b';
  const t = Math.max(0, Math.min(1, score / 100));
  if (t < 0.5) return mixColours(CHINA_LOW, CHINA_MID, t / 0.5);
  return mixColours(CHINA_MID, CHINA_HIGH, (t - 0.5) / 0.5);
}
