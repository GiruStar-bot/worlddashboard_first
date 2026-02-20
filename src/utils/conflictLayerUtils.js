// src/utils/conflictLayerUtils.js

const CONFLICT_DATA_URL =
  'https://girustar-bot.github.io/worlddashboard-data/public/data/active_conflicts.json';

export const CONFLICT_SOURCE_ID = 'conflict-ledger-source';
export const CONFLICT_ICON_LAYER_ID = 'conflict-icon';
export const CONFLICT_HALO_LAYER_ID = 'conflict-halo';
export const CONFLICT_LABEL_LAYER_ID = 'conflict-label';

/**
 * Fetches the active-conflicts ledger and converts it into a GeoJSON
 * FeatureCollection of Point features.
 *
 * A cache-busting query parameter `?t=<timestamp>` is appended to
 * avoid stale browser caches.
 *
 * @returns {Promise<{type: 'FeatureCollection', features: Array}>}
 */
export async function fetchConflictGeojson() {
  const url = `${CONFLICT_DATA_URL}?t=${Date.now()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Conflict data fetch failed: ${response.status} ${response.statusText}`);
  }

  const conflicts = await response.json();

  const features = conflicts.map((c) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: c.coordinates, // [longitude, latitude]
    },
    properties: {
      id: c.id,
      name: c.name,
      status: c.status,
      description: c.description,
    },
  }));

  return { type: 'FeatureCollection', features };
}

/**
 * Icon layer — renders emoji markers.
 *   active    → ⚔️  (red #ef4444)
 *   ceasefire → ⛔  (yellow #eab308)
 */
export function getConflictIconStyle() {
  return {
    type: 'symbol',
    layout: {
      'text-field': [
        'case',
        ['==', ['get', 'status'], 'active'], '⚔️',
        '⛔',
      ],
      'text-size': 22,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': [
        'case',
        ['==', ['get', 'status'], 'active'], '#ef4444',
        '#eab308',
      ],
      'text-halo-color': '#020617',
      'text-halo-width': 1.5,
    },
  };
}

/**
 * Halo layer — pulsing glow behind active conflict markers only.
 * Opacity is driven by a requestAnimationFrame loop in the map component.
 */
export function getConflictHaloStyle() {
  return {
    type: 'circle',
    filter: ['==', ['get', 'status'], 'active'],
    paint: {
      'circle-radius': 22,
      'circle-color': '#ef4444',
      'circle-opacity': 0.0,
      'circle-blur': 0.6,
    },
  };
}

/**
 * Label layer — displays the conflict name when zoomed in.
 */
export function getConflictLabelStyle() {
  return {
    type: 'symbol',
    minzoom: 3,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
      'text-size': 11,
      'text-offset': [0, 1.8],
      'text-anchor': 'top',
      'text-allow-overlap': false,
      'text-optional': true,
      'text-letter-spacing': 0.05,
    },
    paint: {
      'text-color': [
        'case',
        ['==', ['get', 'status'], 'active'], '#ef4444',
        '#eab308',
      ],
      'text-halo-color': '#020617',
      'text-halo-width': 1.5,
      'text-opacity': 0.9,
    },
  };
}
