// src/utils/gdeltLayerUtils.js
import { COUNTRY_COORDINATES } from '../constants/countryCoordinates';

const GDELT_DATA_URL =
  'https://girustar-bot.github.io/worlddashboard-data/public/data/daily_risk_score.json';

export const GDELT_SOURCE_ID = 'gdelt-risk-source';
export const GDELT_LAYER_ID = 'gdelt-risk-circles';

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
 *   - Only countries with risk_score < -1.0 are rendered (filter excludes the rest).
 *   - risk_score < -5.0  →  deep red  (#dc2626)
 *   - risk_score < -1.0  →  yellow/orange  (#f59e0b)
 *   - Circle radius scales with article count: 3 px (0 articles) → 15 px (500+ articles).
 *   - 1.5 px black stroke ensures visibility on every base-layer colour.
 *
 * @returns {{ type: string, filter: Array, paint: object }}
 */
export function getGdeltLayerStyle() {
  return {
    type: 'circle',
    // Show only countries with a meaningfully negative risk score
    filter: ['<', ['coalesce', ['get', 'risk_score'], 99], -1.0],
    paint: {
      // Scale bubble size by article count (3 px min → 15 px max)
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'count'], 0],
        0, 3,
        100, 8,
        500, 15,
      ],
      // Deep red for high-risk, yellow/orange for moderate risk
      'circle-color': [
        'case',
        ['<', ['coalesce', ['get', 'risk_score'], 0], -5.0], '#dc2626',
        '#f59e0b',
      ],
      'circle-opacity': 0.85,
      // Black stroke so bubbles are readable on any base-layer colour
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#000000',
      'circle-stroke-opacity': 0.7,
    },
  };
}
