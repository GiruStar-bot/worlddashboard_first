const INDEX_BUCKETS = ['countries', 'regions', 'disputed'];
const FEATURE_ID_KEYS = ['feature_id', 'custom_geoid', 'iso_a3', 'ISO_A3', 'adm0_a3', 'ADM0_A3'];

const normaliseId = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
};

const readEntryScore = (entry) => (Number.isFinite(entry?.score) ? entry.score : null);

const readEntryFeatureId = (entry, fallbackId) => (
  normaliseId(entry?.feature_id)
  || normaliseId(entry?.custom_geoid)
  || normaliseId(entry?.iso3)
  || normaliseId(fallbackId)
);

/**
 * `public/*_index.json` の参照層を統一する。
 * countries / regions / disputed のいずれにも対応し、feature_id (ISO3 or custom_geoid) を優先して取り込む。
 */
export const extractIndexScores = (payload) => {
  const byFeatureId = {};

  INDEX_BUCKETS.forEach((bucket) => {
    const collection = payload?.[bucket];
    if (!collection || typeof collection !== 'object') return;

    Object.entries(collection).forEach(([key, entry]) => {
      const score = readEntryScore(entry);
      const featureId = readEntryFeatureId(entry, key);
      if (!featureId || !Number.isFinite(score)) return;
      byFeatureId[featureId] = score;
    });
  });

  return byFeatureId;
};

export const extractFsiScores = (masterData) => {
  const byFeatureId = {};

  if (!masterData?.regions) return byFeatureId;

  Object.values(masterData.regions).forEach((region) => {
    region.forEach((entry) => {
      const score = entry?.canonical?.risk?.fsi_total?.value;
      const featureId = readEntryFeatureId(entry?.master, entry?.master?.iso3);
      if (!featureId || !Number.isFinite(score)) return;
      byFeatureId[featureId] = score;
    });
  });

  return byFeatureId;
};

export const getLayerScoreMaps = ({ masterData, chinaInfluenceData, resourcesData, usInfluenceData }) => ({
  fsi: extractFsiScores(masterData),
  china: extractIndexScores(chinaInfluenceData),
  resources: extractIndexScores(resourcesData),
  us: extractIndexScores(usInfluenceData),
});

export const resolveFeatureIdFromProperties = (properties = {}) => {
  for (const key of FEATURE_ID_KEYS) {
    const value = normaliseId(properties?.[key]);
    if (value) return value;
  }
  return null;
};

export const isDisputedFeature = (properties = {}) => {
  const tokens = [
    properties?.feature_type,
    properties?.feature_class,
    properties?.kind,
    properties?.status,
    properties?.boundary_type,
  ]
    .map((value) => (typeof value === 'string' ? value.toLowerCase() : ''))
    .filter(Boolean);

  return tokens.some((token) => token.includes('disputed'));
};
