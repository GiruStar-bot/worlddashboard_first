const clampScore = (value) => Math.max(0, Math.min(100, value));

export const calculateFsiLayerScore = (fsiTotal, stabilityScore) => {
  if (fsiTotal == null) return null;
  const normalizedFsi = (fsiTotal / 120) * 100;
  const stabilityPenalty = stabilityScore == null ? 0 : 100 - stabilityScore;
  return Number(clampScore(normalizedFsi * 0.85 + stabilityPenalty * 0.15).toFixed(1));
};

export const redefineFsiLayerScores = (masterData) => {
  if (!masterData?.regions) return masterData;

  return {
    ...masterData,
    regions: Object.fromEntries(
      Object.entries(masterData.regions).map(([regionName, entries]) => [
        regionName,
        entries.map((entry) => {
          const value = calculateFsiLayerScore(
            entry.canonical?.risk?.fsi_total?.value,
            entry.ui_view?.scores?.stability_score
          );
          if (value == null) return entry;
          return {
            ...entry,
            canonical: {
              ...entry.canonical,
              risk: {
                ...entry.canonical?.risk,
                fsi_total: {
                  ...entry.canonical?.risk?.fsi_total,
                  value,
                },
              },
            },
          };
        }),
      ])
    ),
  };
};
