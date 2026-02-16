import { ISO_MAP } from '../constants/isoMap';
import { resolveFeatureIdFromProperties } from './layerScoreUtils';

const PROPERTY_ISO_KEYS = ['iso_a3', 'ISO_A3', 'adm0_a3', 'ADM0_A3'];
const INVALID_ISO_VALUES = new Set(['', '-99', '---', 'N/A', null, undefined]);

const normaliseIso = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (INVALID_ISO_VALUES.has(trimmed)) return null;
  return trimmed.toUpperCase();
};

const isIsoAlpha3 = (value) => typeof value === 'string' && /^[A-Z]{3}$/.test(value);

const pickIsoFromProperties = (properties = {}) => {
  for (const key of PROPERTY_ISO_KEYS) {
    const iso = normaliseIso(properties?.[key]);
    if (iso && isIsoAlpha3(iso)) {
      return { iso, source: `properties.${key}` };
    }
  }

  return null;
};

const pickIsoFromFallbackMap = (geoId) => {
  if (geoId == null) return null;
  const id = String(geoId).trim();
  if (!id) return null;

  const numericIso = ISO_MAP[id] || ISO_MAP[id.padStart(3, '0')];
  if (numericIso && isIsoAlpha3(numericIso)) {
    return { iso: numericIso, source: 'ISO_MAP' };
  }

  return null;
};

/**
 * GeographyオブジェクトからISO3コードを解決する。
 *
 * 優先順位:
 * 1) topo/geojsonの標準属性 (`iso_a3`, `adm0_a3`)
 * 2) 互換のための numeric id -> ISO_MAP 変換（フォールバック）
 *
 * `id` 欠損・ISO解決不可の地物は `clickable: false` として扱う。
 */
export const resolveGeoIso = (geo) => {
  const featureId = resolveFeatureIdFromProperties(geo?.properties);
  const fromProperties = pickIsoFromProperties(geo?.properties);
  if (fromProperties) {
    return {
      ...fromProperties,
      featureId: featureId || fromProperties.iso,
      clickable: true,
      name: geo?.properties?.name || geo?.properties?.NAME || null,
    };
  }

  const fromFallbackMap = pickIsoFromFallbackMap(geo?.id);
  if (fromFallbackMap) {
    return {
      ...fromFallbackMap,
      featureId: featureId || fromFallbackMap.iso,
      clickable: true,
      name: geo?.properties?.name || geo?.properties?.NAME || null,
    };
  }

  return {
    iso: null,
    featureId,
    source: 'unresolved',
    clickable: false,
    name: geo?.properties?.name || geo?.properties?.NAME || null,
  };
};
