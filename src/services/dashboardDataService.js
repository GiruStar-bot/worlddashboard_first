import { REPORT_FILES } from '../constants/isoMap';

const loadJsonFromUrl = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
};

const loadJsonFromStaticFile = (fileName) => (
  loadJsonFromUrl(`${import.meta.env.BASE_URL}${fileName}`)
);

const loadJsonWithFallback = async ({ dynamicUrl, staticFile }) => {
  if (dynamicUrl) {
    try {
      return await loadJsonFromUrl(dynamicUrl);
    } catch (error) {
      console.warn(`[data-fallback] ${dynamicUrl} -> ${staticFile}`, error);
    }
  }
  return loadJsonFromStaticFile(staticFile);
};

export const loadDashboardData = async () => {
  const [
    master,
    china,
    resources,
    us,
    reportGroups,
  ] = await Promise.all([
    loadJsonWithFallback({
      dynamicUrl: import.meta.env.VITE_MASTER_DATA_URL,
      staticFile: 'worlddash_global_master.json',
    }),
    loadJsonWithFallback({
      dynamicUrl: import.meta.env.VITE_CHINA_INFLUENCE_DATA_URL,
      staticFile: 'china_influence_index.json',
    }),
    loadJsonWithFallback({
      dynamicUrl: import.meta.env.VITE_RESOURCE_DATA_URL,
      staticFile: 'natural_resources_index.json',
    }),
    loadJsonWithFallback({
      dynamicUrl: import.meta.env.VITE_US_INFLUENCE_DATA_URL,
      staticFile: 'us_influence_index.json',
    }),
    Promise.all(
      REPORT_FILES.map((reportFile) => loadJsonWithFallback({
        dynamicUrl: import.meta.env.VITE_REPORTS_DATA_BASE_URL
          ? `${import.meta.env.VITE_REPORTS_DATA_BASE_URL.replace(/\/$/, '')}/${reportFile}`
          : '',
        staticFile: reportFile,
      })),
    ),
  ]);

  return { master, china, resources, us, reportGroups };
};
