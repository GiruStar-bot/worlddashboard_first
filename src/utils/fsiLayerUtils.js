const clampScore = (value) => Math.max(0, Math.min(100, value));

export const getFsiLayerBreakdown = (fsiTotal, stabilityScore) => {
  if (fsiTotal == null) return null;

  const normalizedFsi = (fsiTotal / 120) * 100;
  const stabilityPenalty = stabilityScore == null ? 0 : 100 - stabilityScore;
  const weightedFsi = normalizedFsi * 0.85;
  const weightedPenalty = stabilityPenalty * 0.15;
  const finalScore = Number(clampScore(weightedFsi + weightedPenalty).toFixed(1));

  return {
    raw_fsi_total: Number(fsiTotal.toFixed(1)),
    normalized_fsi: Number(normalizedFsi.toFixed(1)),
    stability_penalty: Number(stabilityPenalty.toFixed(1)),
    weighted_fsi: Number(weightedFsi.toFixed(1)),
    weighted_stability_penalty: Number(weightedPenalty.toFixed(1)),
    final_score: finalScore,
    weights: {
      normalized_fsi: 0.85,
      stability_penalty: 0.15,
    },
    normalization: {
      fsi_total: 'normalized_fsi = (fsi_total / 120) * 100',
      stability_score: 'stability_penalty = 100 - stability_score',
    },
    missing_data_policy: {
      stability_score: 'if null then stability_penalty = 0',
    },
  };
};

export const calculateFsiLayerScore = (fsiTotal, stabilityScore) => {
  const breakdown = getFsiLayerBreakdown(fsiTotal, stabilityScore);
  return breakdown?.final_score ?? null;
};

export const redefineFsiLayerScores = (masterData) => {
  if (!masterData?.regions) return masterData;

  return {
    ...masterData,
    regions: Object.fromEntries(
      Object.entries(masterData.regions).map(([regionName, entries]) => [
        regionName,
        entries.map((entry) => {
          const breakdown = getFsiLayerBreakdown(
            entry.canonical?.risk?.fsi_total?.value,
            entry.ui_view?.scores?.stability_score
          );
          if (!breakdown) return entry;
          return {
            ...entry,
            canonical: {
              ...entry.canonical,
              risk: {
                ...entry.canonical?.risk,
                fsi_total: {
                  ...entry.canonical?.risk?.fsi_total,
                  value: breakdown.final_score,
                },
              },
            },
            ui_view: {
              ...entry.ui_view,
              score_breakdown: {
                ...entry.ui_view?.score_breakdown,
                fsi: breakdown,
              },
            },
          };
        }),
      ])
    ),
  };
};
