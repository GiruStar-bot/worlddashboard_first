// --- Layer Color Utilities ---
import { hexToRgb, mixColours } from './colorUtils';

// ── China Influence palette ──────────────────────────────
const CHINA_LOW  = hexToRgb('#6b7280'); // Slate-gray  (low influence)
const CHINA_MID  = hexToRgb('#fbbf24'); // Amber       (mid influence)
const CHINA_HIGH = hexToRgb('#dc2626'); // Crimson     (high influence)

/**
 * Returns a hex color for a China Influence score (0–100).
 * Gradient: slate-gray → amber → crimson.
 * Returns dark slate for null/undefined scores.
 */
export function getChinaColour(score) {
  if (score == null) return '#1e293b';
  const t = Math.max(0, Math.min(1, score / 100));
  if (t < 0.5) return mixColours(CHINA_LOW, CHINA_MID, t / 0.5);
  return mixColours(CHINA_MID, CHINA_HIGH, (t - 0.5) / 0.5);
}

// ── Natural Resources (GNR-PRI) palette ──────────────────
const RES_LOW  = hexToRgb('#475569'); // Slate Grey   (low / consumer nations)
const RES_MID1 = hexToRgb('#50C878'); // Emerald Green (efficiency / renewables)
const RES_MID2 = hexToRgb('#D4AF37'); // Metallic Gold (mid-range producers)
const RES_HIGH = hexToRgb('#CD7F32'); // Deep Bronze   (resource superpowers)

/**
 * Returns a hex color for a GNR-PRI score (0–100).
 * 3-stop gradient: Slate → Emerald → Gold → Bronze.
 * Returns explicit dark gray (#3E3E42) for null/undefined.
 */
export function getNaturalResourceColour(score) {
  if (score == null) return '#3E3E42';
  const t = Math.max(0, Math.min(1, score / 100));
  if (t < 0.33) return mixColours(RES_LOW, RES_MID1, t / 0.33);
  if (t < 0.66) return mixColours(RES_MID1, RES_MID2, (t - 0.33) / 0.33);
  return mixColours(RES_MID2, RES_HIGH, (t - 0.66) / 0.34);
}
