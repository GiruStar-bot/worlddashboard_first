// src/utils/gdeltLayerUtils.js
import { COUNTRY_COORDINATES } from '../constants/countryCoordinates';

const GDELT_DATA_URL =
  'https://girustar-bot.github.io/worlddashboard-data/public/data/daily_risk_score.json';

export const GDELT_SOURCE_ID = 'gdelt-risk-source';
export const GDELT_LAYER_ID = 'gdelt-risk-circles';
export const GDELT_HALO_LAYER_ID = 'gdelt-risk-halo';
/**
 * Fetches GDELT daily risk scores and joins them with country coordinates,
 * returning a GeoJSON FeatureCollection of Point features.
 *
 * Each feature's properties include:
 *   - iso3       {string}       ISO 3166-1 alpha-3 country code
 *   - risk_score {number|null}  GDELT-derived risk score (negative = higher risk)
 *   - count      {number}       Number of articles contributing to the score
 *   - top_news   {string|null}  URL of the top news article for the country
 *
 * Countries without a matching entry in COUNTRY_COORDINATES are skipped.
 *
 * @returns {Promise<{type: 'FeatureCollection', features: Array}>}
 */
export async function fetchAndBuildGdeltGeojson() {
  const response = await fetch(GDELT_DATA_URL);
  if (!response.ok) {
    throw new Error(`GDELT fetch failed: ${response.status} ${response.statusText}`);
  }

  const riskData = await response.json();
  const features = [];

  for (const [iso3, entry] of Object.entries(riskData)) {
    const coordEntry = COUNTRY_COORDINATES[iso3];
    if (!coordEntry) continue; // skip countries with no coordinate data

    const riskScore = entry.risk_score != null ? Number(entry.risk_score) : null;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coordEntry.coordinates, // [longitude, latitude]
      },
      properties: {
        iso3,
        risk_score: riskScore,
        count: entry.count ?? 0,
        top_news: entry.top_news ?? null,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

/**
 * Returns the MapLibre layer config (type, filter, paint) for GDELT risk bubbles.
 *
 * Rendering rules:
 *   - Only countries with risk_score > 0 are rendered.
 *   - Score > 20.0  →  deep red   (#dc2626)  Extreme
 *   - Score > 10.0  →  red        (#ef4444)  High
 *   - Score > 5.0   →  orange     (#f59e0b)  Medium
 *   - Otherwise     →  yellow     (#fcd34d)  Low
 *   - Circle radius scales with risk_score: 2 → 4 px, 20 → 12 px, 50 → 25 px.
 *   - White stroke ensures visibility on every base-layer colour.
 *
 * @returns {{ type: string, filter: Array, paint: object }}
 */
export function getGdeltLayerStyle() {
  return {
    type: 'circle',
    // Show only countries with a positive risk score
    filter: ['>', ['coalesce', ['get', 'risk_score'], 0], 0],
    paint: {
      // Scale bubble size by risk_score
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'risk_score'], 0],
        2, 4,
        20, 12,
        50, 25,
      ],
      // Colour by intensity: Extreme → High → Medium → Low
      'circle-color': [
        'case',
        ['>', ['coalesce', ['get', 'risk_score'], 0], 20.0], '#dc2626',
        ['>', ['coalesce', ['get', 'risk_score'], 0], 10.0], '#ef4444',
        ['>', ['coalesce', ['get', 'risk_score'], 0], 5.0], '#f59e0b',
        '#fcd34d',
      ],
      'circle-opacity': 0.6,
      // White stroke so bubbles are readable on any base-layer colour
      'circle-stroke-width': 1.0,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-opacity': 0.5,
    },
  };
}

/**
 * Returns the MapLibre layer config for the GDELT halo (glow) layer.
 *
 * The halo is a larger, blurred circle rendered behind the main marker.
 * Its opacity starts at 0 and is controlled by a requestAnimationFrame
 * animation loop in the map component.
 *
 * @returns {{ type: string, filter: Array, paint: object }}
 */
export function getGdeltHaloLayerStyle() {
  return {
    type: 'circle',
    filter: ['>', ['coalesce', ['get', 'risk_score'], 0], 0],
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'risk_score'], 0],
        2, 10,
        20, 30,
        50, 60,
      ],
      'circle-color': [
        'case',
        ['>', ['coalesce', ['get', 'risk_score'], 0], 20.0], '#dc2626',
        ['>', ['coalesce', ['get', 'risk_score'], 0], 10.0], '#ef4444',
        ['>', ['coalesce', ['get', 'risk_score'], 0], 5.0], '#f59e0b',
        '#fcd34d',
      ],
      'circle-opacity': 0.0,
      'circle-blur': 0.5,
    },
  };
}
