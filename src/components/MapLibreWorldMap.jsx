import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COUNTRY_COORDINATES, DEFAULT_POSITION } from '../constants/countryCoordinates';
import { getLayerScoreMaps } from '../utils/layerScoreUtils';
import {
  fetchAndBuildGdeltGeojson,
  getGdeltLayerStyle,
  getGdeltHaloLayerStyle,
  GDELT_SOURCE_ID,
  GDELT_LAYER_ID,
  GDELT_HALO_LAYER_ID,
} from '../utils/gdeltLayerUtils';
import {
  buildChokePointGeojson,
  getChokePointHaloStyle,
  getChokePointRingStyle,
  getChokePointDiamondStyle,
  getChokePointLabelStyle,
  CHOKE_POINT_SOURCE_ID,
  CHOKE_POINT_HALO_LAYER_ID,
  CHOKE_POINT_RING_LAYER_ID,
  CHOKE_POINT_DIAMOND_LAYER_ID,
  CHOKE_POINT_LABEL_LAYER_ID,
} from '../utils/chokePointLayerUtils';
import { CHOKE_POINTS } from '../constants/chokePoints';
import { calculateDistance } from '../utils/geoMath';
import KodokuPanel from './KodokuPanel';
import {
  buildSeaLaneGeojson,
  getSeaLaneLayerStyle,
  SEA_LANE_SOURCE_ID,
  SEA_LANE_LAYER_ID,
} from '../utils/seaLaneLayerUtils';
import {
  fetchConflictGeojson,
  getConflictIconStyle,
  getConflictHaloStyle,
  getConflictLabelStyle,
  CONFLICT_SOURCE_ID,
  CONFLICT_ICON_LAYER_ID,
  CONFLICT_HALO_LAYER_ID,
  CONFLICT_LABEL_LAYER_ID,
} from '../utils/conflictLayerUtils';

const SEA_LANE_HIGHLIGHT_WIDTH = 4.5;
const SEA_LANE_DEFAULT_WIDTH = 2.0;
const SEA_LANE_HIGHLIGHT_OPACITY = 1.0;
const SEA_LANE_DIMMED_OPACITY = 0.3;
const SEA_LANE_DEFAULT_OPACITY = 0.6;

const MOBILE_DEFAULT_POSITION = {
  coordinates: [10, 35],
  zoom: 2.2,
};
const MOBILE_MEDIA_QUERY = '(max-width: 767px)';
const COUNTRY_SOURCE_ID = 'countries';
const COUNTRY_FILL_LAYER_ID = 'countries-fill';
const COUNTRY_LINE_LAYER_ID = 'countries-line';
const DISPUTED_FILL_LAYER_ID = 'disputed-fill';
const MAPLIBRE_CSS_ID = 'maplibre-gl-css';

const getDefaultPositionForViewport = (isMobileViewport) => (
  isMobileViewport ? MOBILE_DEFAULT_POSITION : DEFAULT_POSITION
);

const getInitialPosition = () => {
  if (typeof window === 'undefined') return DEFAULT_POSITION;
  return getDefaultPositionForViewport(window.matchMedia(MOBILE_MEDIA_QUERY).matches);
};

const layerStyles = {
  fsi: {
    title: 'Fragile States Index (FSI)',
    subTitle: 'Redefined Risk Score (0-100)',
    gradient: 'linear-gradient(to right, #06b6d4, #8b5cf6, #ef4444)',
    labels: ['0', '25', '50', '75', '100'],
    colorClass: 'text-rose-400',
    stops: [[0, '#06b6d4'], [50, '#8b5cf6'], [100, '#ef4444']],
    noData: '#334155',
  },
  us: {
    title: 'US Influence Sphere',
    subTitle: 'Diplomatic & Military Alignment (0-100)',
    gradient: 'linear-gradient(to right, #0f172a, #1e40af, #3b82f6, #93c5fd)',
    labels: ['0', '25', '50', '75', '100'],
    colorClass: 'text-blue-400',
    stops: [[0, '#0f172a'], [35, '#1e40af'], [70, '#3b82f6'], [100, '#93c5fd']],
    noData: '#334155',
  },
  china: {
    title: 'China Influence Sphere',
    subTitle: 'Economic & Political Alignment (0-100)',
    gradient: 'linear-gradient(to right, #6b7280, #fbbf24, #ef4444, #991b1b)',
    labels: ['0', '25', '50', '75', '100'],
    colorClass: 'text-amber-400',
    stops: [[0, '#6b7280'], [35, '#fbbf24'], [70, '#ef4444'], [100, '#991b1b']],
    noData: '#334155',
  },
  resources: {
    title: 'Resource Strategy Index',
    subTitle: 'Critical Minerals & Energy (0-100)',
    gradient: 'linear-gradient(to right, #475569, #50C878, #D4AF37, #CD7F32)',
    labels: ['0', '25', '50', '75', '100'],
    colorClass: 'text-emerald-400',
    stops: [[0, '#475569'], [35, '#50C878'], [70, '#D4AF37'], [100, '#CD7F32']],
    noData: '#334155',
  },
};

const DISPUTED_FILTER = ['any',
  ['==', ['downcase', ['to-string', ['coalesce', ['get', 'feature_type'], '']]], 'disputed'],
  ['==', ['downcase', ['to-string', ['coalesce', ['get', 'feature_class'], '']]], 'disputed'],
  ['==', ['downcase', ['to-string', ['coalesce', ['get', 'kind'], '']]], 'disputed'],
  ['==', ['downcase', ['to-string', ['coalesce', ['get', 'status'], '']]], 'disputed'],
  ['==', ['downcase', ['to-string', ['coalesce', ['get', 'boundary_type'], '']]], 'disputed'],
];

const COUNTRY_FILTER = ['all', ['!=', ['coalesce', ['get', 'iso_a3'], '-99'], '-99'], ['!', DISPUTED_FILTER]];

const FEATURE_ID_EXPR = [
  'upcase',
  ['to-string', ['coalesce', ['get', 'feature_id'], ['get', 'custom_geoid'], ['get', 'iso_a3'], ['get', 'ISO_A3'], ['get', 'adm0_a3'], ['get', 'ADM0_A3'], '']],
];

const ensureMapLibreCss = () => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(MAPLIBRE_CSS_ID)) return;

  const link = document.createElement('link');
  link.id = MAPLIBRE_CSS_ID;
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
  document.head.appendChild(link);
};

const loadMapLibre = async () => {
  if (typeof window !== 'undefined' && window.maplibregl) return window.maplibregl;

  try {
    const mod = await import('maplibre-gl');
    ensureMapLibreCss();
    return mod?.default || mod;
  } catch {
    // ignore and fallback to UMD attempt
  }

  if (typeof window === 'undefined') throw new Error('MapLibre not available in SSR');
  ensureMapLibreCss();

  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-maplibre-cdn="true"]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
    script.async = true;
    script.dataset.maplibreCdn = 'true';
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.body.appendChild(script);
  });

  if (!window.maplibregl) {
    throw new Error('MapLibre CDN loaded but maplibregl is missing on window');
  }

  return window.maplibregl;
};

const pickCountryFeature = (features = []) => {
  const country = features.find((feature) => feature.layer?.id === COUNTRY_FILL_LAYER_ID);
  if (!country) return null;
  const iso = country.properties?.iso_a3;
  if (!iso || iso === '-99') return null;
  return { iso };
};

const MapLibreWorldMap = ({
  data,
  activeLayer,
  chinaInfluenceData,
  resourcesData,
  usInfluenceData,
  onCountryClick,
  onHover,
  selectedIso,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const hoveredIsoRef = useRef(null);
  const selectedIsoRef = useRef(null);
  const [maplibre, setMaplibre] = useState(null);
  const [maplibreError, setMaplibreError] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showRiskOverlay, setShowRiskOverlay] = useState(true);
  const [gdeltGeojson, setGdeltGeojson] = useState(null);
  const gdeltPopupRef = useRef(null);
  const [showChokePoints, setShowChokePoints] = useState(true);
  const chokePopupRef = useRef(null);
  const [showKodokuPanel, setShowKodokuPanel] = useState(false);
  const [kodokuRouteId, setKodokuRouteId] = useState(null);
  const [conflictGeojson, setConflictGeojson] = useState(null);
  const [showConflicts, setShowConflicts] = useState(true);
  const conflictPopupRef = useRef(null);

  const legendConfig = useMemo(() => layerStyles[activeLayer] || layerStyles.fsi, [activeLayer]);
  const scoreMaps = useMemo(
    () => getLayerScoreMaps({
      masterData: data,
      chinaInfluenceData,
      resourcesData,
      usInfluenceData,
    }),
    [data, chinaInfluenceData, resourcesData, usInfluenceData],
  );

  // ── Dynamic choke-point risk: promote to 'critical' when nearby GDELT
  //    country has risk_score > 10 within 1500 km ──────────────────────────
  const dynamicChokePoints = useMemo(() => {
    if (!gdeltGeojson || !gdeltGeojson.features) return CHOKE_POINTS;

    // Collect high-risk country coordinates from GDELT data
    const highRiskCoords = [];
    for (const feature of gdeltGeojson.features) {
      const score = feature.properties?.risk_score;
      if (score != null && score > 10.0) {
        const iso3 = feature.properties.iso3;
        const coordEntry = COUNTRY_COORDINATES[iso3];
        if (coordEntry) {
          highRiskCoords.push(coordEntry.coordinates);
        }
      }
    }

    if (highRiskCoords.length === 0) return CHOKE_POINTS;

    return CHOKE_POINTS.map((cp) => {
      const isNearHighRisk = highRiskCoords.some(
        (countryCoord) => calculateDistance(cp.coordinates, countryCoord) <= 1500
      );
      if (isNearHighRisk) {
        return { ...cp, riskLevel: 'critical' };
      }
      return cp;
    });
  }, [gdeltGeojson]);

  const updateSelectedFeatureState = useCallback((nextSelectedIso) => {
    const map = mapRef.current;
    if (!map || !map.getSource(COUNTRY_SOURCE_ID)) return;

    if (selectedIsoRef.current) {
      map.setFeatureState({ source: COUNTRY_SOURCE_ID, id: selectedIsoRef.current }, { selected: false });
    }

    if (nextSelectedIso) {
      map.setFeatureState({ source: COUNTRY_SOURCE_ID, id: nextSelectedIso }, { selected: true });
    }

    selectedIsoRef.current = nextSelectedIso || null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadMapLibre()
      .then((lib) => {
        if (cancelled) return;
        setMaplibre(() => lib);
        setMaplibreError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setMaplibreError('MapLibre runtime could not be loaded.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !maplibre) return;

    const initialPosition = getInitialPosition();

    const map = new maplibre.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [{
          id: 'background',
          type: 'background',
          paint: { 'background-color': '#020617' },
        }],
      },
      center: initialPosition.coordinates,
      zoom: initialPosition.zoom,
      minZoom: 1,
      maxZoom: 8,
      attributionControl: false,
      renderWorldCopies: false,
    });

    mapRef.current = map;

    let sourceReady = false;
    const sourceTimeoutId = window.setTimeout(() => {
      if (!sourceReady) {
        console.warn('MapLibre source loading timed out. Falling back to legacy map renderer.');
        setMaplibreError('MapLibre runtime could not be loaded.');
      }
    }, 6000);

    const handleSourceData = (event) => {
      if (event.sourceId === COUNTRY_SOURCE_ID && event.isSourceLoaded) {
        sourceReady = true;
        setIsMapReady(true);
        window.clearTimeout(sourceTimeoutId);
      }
    };

    const handleMapError = (event) => {
      const errorMessage = String(event?.error?.message || event?.error || '');
      const shouldFallback = errorMessage.toLowerCase().includes('webgl')
        || errorMessage.toLowerCase().includes('failed to load')
        || errorMessage.toLowerCase().includes('context lost');

      if (shouldFallback) {
        console.warn('MapLibre runtime issue detected, falling back to legacy renderer:', errorMessage);
        setMaplibreError('MapLibre runtime could not be loaded.');
      }
    };

    map.on('sourcedata', handleSourceData);
    map.on('error', handleMapError);

    map.on('load', () => {
      map.addSource(COUNTRY_SOURCE_ID, {
        type: 'geojson',
        data: `${import.meta.env.BASE_URL}admin0-countries-iso-a3-antimeridian-fix.geojson`,
        promoteId: 'iso_a3',
      });

      // 仕様: 国ポリゴン > 係争地オーバーレイ（係争地は下層で描画し、イベントも国を優先）
      map.addLayer({
        id: DISPUTED_FILL_LAYER_ID,
        type: 'fill',
        source: COUNTRY_SOURCE_ID,
        filter: DISPUTED_FILTER,
        paint: {
          'fill-color': '#6b7280',
          'fill-opacity': 0.35,
        },
      });

      map.addLayer({
        id: COUNTRY_FILL_LAYER_ID,
        type: 'fill',
        source: COUNTRY_SOURCE_ID,
        filter: COUNTRY_FILTER,
        paint: {
          'fill-color': '#334155',
          'fill-opacity': 1,
        },
      });

      map.addLayer({
        id: COUNTRY_LINE_LAYER_ID,
        type: 'line',
        source: COUNTRY_SOURCE_ID,
        filter: COUNTRY_FILTER,
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], '#ffffff',
            ['boolean', ['feature-state', 'hover'], false], '#e2e8f0',
            'rgba(148, 163, 184, 0.35)',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false], 1.6,
            ['boolean', ['feature-state', 'hover'], false], 1.2,
            0.6,
          ],
        },
      });

      map.on('mousemove', (event) => {
        const features = map.queryRenderedFeatures(event.point, { layers: [COUNTRY_FILL_LAYER_ID, DISPUTED_FILL_LAYER_ID] });
        const country = pickCountryFeature(features);

        if (!country) {
          if (hoveredIsoRef.current) {
            map.setFeatureState({ source: COUNTRY_SOURCE_ID, id: hoveredIsoRef.current }, { hover: false });
            hoveredIsoRef.current = null;
          }
          onHover(null);
          return;
        }

        if (hoveredIsoRef.current && hoveredIsoRef.current !== country.iso) {
          map.setFeatureState({ source: COUNTRY_SOURCE_ID, id: hoveredIsoRef.current }, { hover: false });
        }

        hoveredIsoRef.current = country.iso;
        map.setFeatureState({ source: COUNTRY_SOURCE_ID, id: country.iso }, { hover: true });
        onHover(country.iso, { x: event.originalEvent.clientX, y: event.originalEvent.clientY });
      });

      map.on('mouseout', () => {
        if (hoveredIsoRef.current) {
          map.setFeatureState({ source: COUNTRY_SOURCE_ID, id: hoveredIsoRef.current }, { hover: false });
          hoveredIsoRef.current = null;
        }
        onHover(null);
      });

      map.on('click', (event) => {
        // If the user clicked a GDELT risk bubble, skip country selection —
        // the layer-specific click handler (added later) will handle the popup.
        const gdeltHits = map.queryRenderedFeatures(event.point, { layers: [GDELT_LAYER_ID] });
        if (gdeltHits.length > 0) return;

        // Skip country selection when clicking a conflict marker
        const conflictHits = map.queryRenderedFeatures(event.point, { layers: [CONFLICT_ICON_LAYER_ID] });
        if (conflictHits.length > 0) return;

        const features = map.queryRenderedFeatures(event.point, { layers: [COUNTRY_FILL_LAYER_ID, DISPUTED_FILL_LAYER_ID] });
        const country = pickCountryFeature(features);
        if (!country) return;
        onCountryClick(country.iso);
      });

      // ── Sea Lanes: add source and line layer (below choke points) ──────
      const slGeojson = buildSeaLaneGeojson();
      map.addSource(SEA_LANE_SOURCE_ID, { type: 'geojson', data: slGeojson });

      const slStyle = getSeaLaneLayerStyle();
      map.addLayer({
        id: SEA_LANE_LAYER_ID,
        source: SEA_LANE_SOURCE_ID,
        type: slStyle.type,
        paint: slStyle.paint,
      });

      // ── Chokepoints: add source and layers (above sea lanes) ──────────
      const cpGeojson = buildChokePointGeojson(dynamicChokePoints);
      map.addSource(CHOKE_POINT_SOURCE_ID, { type: 'geojson', data: cpGeojson });

      const halo = getChokePointHaloStyle();
      map.addLayer({ id: CHOKE_POINT_HALO_LAYER_ID, source: CHOKE_POINT_SOURCE_ID, ...halo });

      const ring = getChokePointRingStyle();
      map.addLayer({ id: CHOKE_POINT_RING_LAYER_ID, source: CHOKE_POINT_SOURCE_ID, ...ring });

      const diamond = getChokePointDiamondStyle();
      map.addLayer({ id: CHOKE_POINT_DIAMOND_LAYER_ID, source: CHOKE_POINT_SOURCE_ID, ...diamond });

      const label = getChokePointLabelStyle();
      map.addLayer({ id: CHOKE_POINT_LABEL_LAYER_ID, source: CHOKE_POINT_SOURCE_ID, ...label });
    });

    return () => {
      window.clearTimeout(sourceTimeoutId);
      map.off('sourcedata', handleSourceData);
      map.off('error', handleMapError);
      map.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, [maplibre, onCountryClick, onHover]);

  useEffect(() => {
    if (typeof window === 'undefined') return () => {};
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handleViewportChange = (event) => {
      if (selectedIso) return;
      const nextPosition = getDefaultPositionForViewport(event.matches);
      mapRef.current?.easeTo({ center: nextPosition.coordinates, zoom: nextPosition.zoom, duration: 600 });
    };
    mediaQuery.addEventListener('change', handleViewportChange);
    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, [selectedIso]);

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !map.getLayer(COUNTRY_FILL_LAYER_ID) || !map.getSource(COUNTRY_SOURCE_ID)) return;

    const layerKey = layerStyles[activeLayer] ? activeLayer : 'fsi';
    const activeScores = scoreMaps[layerKey] || {};

    const stops = (layerStyles[layerKey] || layerStyles.fsi).stops;
    const noData = (layerStyles[layerKey] || layerStyles.fsi).noData;
    const scoreMatch = ['match', FEATURE_ID_EXPR];

    Object.entries(activeScores).forEach(([featureId, score]) => {
      if (Number.isFinite(score)) {
        scoreMatch.push(featureId, score);
      }
    });

    scoreMatch.push(-1);

    map.setPaintProperty(COUNTRY_FILL_LAYER_ID, 'fill-color', [
      'let',
      'score',
      scoreMatch,
      [
        'case',
        ['<', ['var', 'score'], 0],
        noData,
        ['interpolate', ['linear'], ['var', 'score'], ...stops.flat()],
      ],
    ]);
  }, [activeLayer, isMapReady, scoreMaps]);

  useEffect(() => {
    updateSelectedFeatureState(selectedIso);

    if (!selectedIso || !COUNTRY_COORDINATES[selectedIso]) return;
    const target = COUNTRY_COORDINATES[selectedIso];
    mapRef.current?.easeTo({
      center: target.coordinates,
      zoom: target.zoom,
      duration: 1500,
      easing: (x) => 1 - ((1 - x) ** 3),
    });
  }, [selectedIso, updateSelectedFeatureState]);

  // ── GDELT: fetch daily risk data once on mount ───────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetchAndBuildGdeltGeojson()
      .then((geojson) => {
        if (!cancelled) setGdeltGeojson(geojson);
      })
      .catch((err) => {
        console.warn('GDELT data fetch failed:', err);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Conflict Ledger: fetch once on mount ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetchConflictGeojson()
      .then((geojson) => {
        if (!cancelled) setConflictGeojson(geojson);
      })
      .catch((err) => {
        console.warn('Conflict ledger fetch failed:', err);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Chokepoints: update source when dynamic risk levels change ──────────
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !map.getSource(CHOKE_POINT_SOURCE_ID)) return;
    const cpGeojson = buildChokePointGeojson(dynamicChokePoints);
    map.getSource(CHOKE_POINT_SOURCE_ID).setData(cpGeojson);
  }, [isMapReady, dynamicChokePoints]);

  // ── GDELT: add/update the bubble layer once both map and data are ready ──
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !gdeltGeojson || !maplibre) return;

    // If the source already exists, just refresh the data
    if (map.getSource(GDELT_SOURCE_ID)) {
      map.getSource(GDELT_SOURCE_ID).setData(gdeltGeojson);
      return;
    }

    map.addSource(GDELT_SOURCE_ID, { type: 'geojson', data: gdeltGeojson });

    const haloStyle = getGdeltHaloLayerStyle();
    map.addLayer({
      id: GDELT_HALO_LAYER_ID,
      source: GDELT_SOURCE_ID,
      type: haloStyle.type,
      filter: haloStyle.filter,
      paint: haloStyle.paint,
    });

    const style = getGdeltLayerStyle();
    map.addLayer({
      id: GDELT_LAYER_ID,
      source: GDELT_SOURCE_ID,
      type: style.type,
      filter: style.filter,
      paint: style.paint,
    });

    // Popup on bubble click
    map.on('click', GDELT_LAYER_ID, (event) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const { iso3, risk_score, count, top_news } = feature.properties;
      const coordinates = feature.geometry.coordinates.slice();

      if (gdeltPopupRef.current) {
        gdeltPopupRef.current.remove();
        gdeltPopupRef.current = null;
      }

      const scoreNum = risk_score != null ? Number(risk_score) : null;
      const scoreText = scoreNum != null ? scoreNum.toFixed(2) : 'N/A';
      const scoreColor = scoreNum != null && scoreNum < -5 ? '#dc2626' : '#d97706';

      const newsHtml = (() => {
        if (!top_news) return '';
        const url = typeof top_news === 'string'
          ? top_news
          : (Array.isArray(top_news) ? (top_news[0]?.url ?? top_news[0]) : null);
        if (!url) return '';
        const safeUrl = String(url).replace(/"/g, '%22');
        return `<div style="margin-top:6px;font-size:11px;"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;">Top News ↗</a></div>`;
      })();

      const popup = new maplibre.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' })
        .setLngLat(coordinates)
        .setHTML(`
          <div style="font-family:sans-serif;padding:4px 2px;">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${iso3}</div>
            <div style="font-size:12px;margin-bottom:2px;">
              Risk Score: <strong style="color:${scoreColor}">${scoreText}</strong>
            </div>
            <div style="font-size:12px;">Articles: <strong>${count}</strong></div>
            ${newsHtml}
          </div>
        `)
        .addTo(map);

      gdeltPopupRef.current = popup;
    });

    // Change cursor when hovering over a bubble
    map.on('mouseenter', GDELT_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', GDELT_LAYER_ID, () => {
      map.getCanvas().style.cursor = '';
    });
  }, [isMapReady, gdeltGeojson, maplibre]);

  // ── Conflict Ledger: add/update layers (topmost) ────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !conflictGeojson || !maplibre) return;

    // If the source already exists, just refresh the data
    if (map.getSource(CONFLICT_SOURCE_ID)) {
      map.getSource(CONFLICT_SOURCE_ID).setData(conflictGeojson);
      return;
    }

    map.addSource(CONFLICT_SOURCE_ID, { type: 'geojson', data: conflictGeojson });

    const halo = getConflictHaloStyle();
    map.addLayer({
      id: CONFLICT_HALO_LAYER_ID,
      source: CONFLICT_SOURCE_ID,
      type: halo.type,
      filter: halo.filter,
      paint: halo.paint,
    });

    const icon = getConflictIconStyle();
    map.addLayer({
      id: CONFLICT_ICON_LAYER_ID,
      source: CONFLICT_SOURCE_ID,
      type: icon.type,
      layout: icon.layout,
      paint: icon.paint,
    });

    const label = getConflictLabelStyle();
    map.addLayer({
      id: CONFLICT_LABEL_LAYER_ID,
      source: CONFLICT_SOURCE_ID,
      type: label.type,
      minzoom: label.minzoom,
      layout: label.layout,
      paint: label.paint,
    });

    // Popup on icon click
    map.on('click', CONFLICT_ICON_LAYER_ID, (event) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const { name, status, description } = feature.properties;
      const coordinates = feature.geometry.coordinates.slice();

      if (conflictPopupRef.current) {
        conflictPopupRef.current.remove();
        conflictPopupRef.current = null;
      }

      const isActive = status === 'active';
      const borderColor = isActive ? '#ef4444' : '#eab308';
      const statusLabel = isActive ? 'ACTIVE' : 'CEASEFIRE';
      const statusIcon = isActive ? '⚔️' : '⛔';

      const popup = new maplibre.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' })
        .setLngLat(coordinates)
        .setHTML(`
          <div style="font-family:monospace;padding:4px 2px;background:#0f172a;color:#e2e8f0;border:1px solid ${borderColor};border-radius:4px;">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:${borderColor};">${statusIcon} ${name}</div>
            <div style="font-size:11px;margin-bottom:2px;">Status: <strong style="color:${borderColor}">${statusLabel}</strong></div>
            <div style="font-size:11px;margin-top:4px;">${description}</div>
          </div>
        `)
        .addTo(map);

      conflictPopupRef.current = popup;
    });

    map.on('mouseenter', CONFLICT_ICON_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', CONFLICT_ICON_LAYER_ID, () => {
      map.getCanvas().style.cursor = '';
    });
  }, [isMapReady, conflictGeojson, maplibre]);

  // ── Conflict Ledger: toggle layer visibility ────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !map.getLayer(CONFLICT_ICON_LAYER_ID)) return;

    const vis = showConflicts ? 'visible' : 'none';
    [CONFLICT_HALO_LAYER_ID, CONFLICT_ICON_LAYER_ID, CONFLICT_LABEL_LAYER_ID].forEach((layerId) => {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', vis);
    });

    if (!showConflicts && conflictPopupRef.current) {
      conflictPopupRef.current.remove();
      conflictPopupRef.current = null;
    }
  }, [isMapReady, showConflicts]);

  // ── Conflict Ledger: halo pulsing animation (active markers only) ───────
  useEffect(() => {
    if (!isMapReady) return;

    let rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const map = mapRef.current;
      if (!map || !map.getLayer(CONFLICT_HALO_LAYER_ID)) return;

      const opacity = (Math.sin(performance.now() / 700) + 1) / 2 * 0.45 + 0.1;
      map.setPaintProperty(CONFLICT_HALO_LAYER_ID, 'circle-opacity', opacity);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isMapReady]);

  // ── GDELT: toggle layer visibility when showRiskOverlay changes ──────────
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !map.getLayer(GDELT_LAYER_ID)) return;

    const vis = showRiskOverlay ? 'visible' : 'none';
    map.setLayoutProperty(GDELT_LAYER_ID, 'visibility', vis);
    if (map.getLayer(GDELT_HALO_LAYER_ID)) {
      map.setLayoutProperty(GDELT_HALO_LAYER_ID, 'visibility', vis);
    }

    if (!showRiskOverlay && gdeltPopupRef.current) {
      gdeltPopupRef.current.remove();
      gdeltPopupRef.current = null;
    }
  }, [isMapReady, showRiskOverlay]);

  // ── GDELT: persistent halo pulsing animation loop ───────────────────────
  useEffect(() => {
    if (!isMapReady) return;

    let rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);

      const map = mapRef.current;
      if (!map || !map.getLayer(GDELT_HALO_LAYER_ID)) return;

      const opacity = (Math.sin(performance.now() / 600) + 1) / 2 * 0.5 + 0.1;
      map.setPaintProperty(GDELT_HALO_LAYER_ID, 'circle-opacity', opacity);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isMapReady]);

  // ── Chokepoints & Sea Lanes: toggle layer visibility ─────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !map.getLayer(CHOKE_POINT_RING_LAYER_ID)) return;

    const vis = showChokePoints ? 'visible' : 'none';
    [CHOKE_POINT_HALO_LAYER_ID, CHOKE_POINT_RING_LAYER_ID, CHOKE_POINT_DIAMOND_LAYER_ID, CHOKE_POINT_LABEL_LAYER_ID, SEA_LANE_LAYER_ID].forEach((layerId) => {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', vis);
    });

    if (!showChokePoints && chokePopupRef.current) {
      chokePopupRef.current.remove();
      chokePopupRef.current = null;
    }
  }, [isMapReady, showChokePoints]);

  // ── KODOKU: highlight selected route on sea lane layer ───────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !map.getLayer(SEA_LANE_LAYER_ID)) return;

    if (kodokuRouteId && showKodokuPanel) {
      map.setPaintProperty(SEA_LANE_LAYER_ID, 'line-width', [
        'case', ['==', ['get', 'id'], kodokuRouteId], SEA_LANE_HIGHLIGHT_WIDTH, SEA_LANE_DEFAULT_WIDTH,
      ]);
      map.setPaintProperty(SEA_LANE_LAYER_ID, 'line-opacity', [
        'case', ['==', ['get', 'id'], kodokuRouteId], SEA_LANE_HIGHLIGHT_OPACITY, SEA_LANE_DIMMED_OPACITY,
      ]);
    } else {
      map.setPaintProperty(SEA_LANE_LAYER_ID, 'line-width', SEA_LANE_DEFAULT_WIDTH);
      map.setPaintProperty(SEA_LANE_LAYER_ID, 'line-opacity', SEA_LANE_DEFAULT_OPACITY);
    }
  }, [isMapReady, kodokuRouteId, showKodokuPanel]);

  // ── Chokepoints: halo pulsing animation ─────────────────────────────────
  useEffect(() => {
    if (!isMapReady) return;

    let rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const map = mapRef.current;
      if (!map || !map.getLayer(CHOKE_POINT_HALO_LAYER_ID)) return;

      const opacity = (Math.sin(performance.now() / 800) + 1) / 2 * 0.35 + 0.08;
      map.setPaintProperty(CHOKE_POINT_HALO_LAYER_ID, 'circle-opacity', opacity);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [isMapReady]);

  // ── Chokepoints: popup on click ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map || !maplibre || !map.getLayer(CHOKE_POINT_DIAMOND_LAYER_ID)) return;

    const handleClick = (event) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const { name, type: cpType, riskLevel } = feature.properties;
      const coordinates = feature.geometry.coordinates.slice();

      if (chokePopupRef.current) {
        chokePopupRef.current.remove();
        chokePopupRef.current = null;
      }

      const riskColors = { critical: '#ef4444', high: '#f97316', medium: '#06b6d4', low: '#22d3ee' };
      const riskColor = riskColors[riskLevel] || '#06b6d4';
      const typeLabel = cpType === 'energy' ? 'Energy Route' : 'Trade Route';

      const popup = new maplibre.Popup({ closeButton: true, closeOnClick: true, maxWidth: '240px' })
        .setLngLat(coordinates)
        .setHTML(`
          <div style="font-family:monospace;padding:4px 2px;background:#0f172a;color:#e2e8f0;border:1px solid ${riskColor};border-radius:4px;">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:${riskColor};">${name}</div>
            <div style="font-size:11px;margin-bottom:2px;">Type: <strong>${typeLabel}</strong></div>
            <div style="font-size:11px;">Risk: <strong style="color:${riskColor}">${riskLevel.toUpperCase()}</strong></div>
          </div>
        `)
        .addTo(map);

      chokePopupRef.current = popup;
    };

    map.on('click', CHOKE_POINT_DIAMOND_LAYER_ID, handleClick);
    map.on('mouseenter', CHOKE_POINT_DIAMOND_LAYER_ID, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', CHOKE_POINT_DIAMOND_LAYER_ID, () => { map.getCanvas().style.cursor = ''; });

    return () => {
      map.off('click', CHOKE_POINT_DIAMOND_LAYER_ID, handleClick);
    };
  }, [isMapReady, maplibre]);

  return (
    <div data-testid="world-map" className="w-full h-full bg-[#020617] relative">
      <div ref={mapContainerRef} className="w-full h-full" />

      {!isMapReady && (
        <div className="absolute top-20 right-4 z-20 text-[10px] px-2 py-1 rounded bg-slate-900/80 border border-white/10 text-slate-300">
          Loading MapLibre engine...
        </div>
      )}

      {maplibreError && (
        <div className="absolute top-28 right-4 z-20 max-w-[280px] text-[10px] px-2 py-1 rounded bg-rose-950/80 border border-rose-400/30 text-rose-200">
          Map render warning: {maplibreError}
        </div>
      )}

      {/* GDELT risk overlay toggle — micro UI size */}
      {gdeltGeojson && (
        <button
          type="button"
          onClick={() => setShowRiskOverlay((prev) => !prev)}
          className={`absolute top-[72px] left-4 z-[9999] flex items-center gap-1.5 px-2 py-0.5 rounded-full border shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 font-bold tracking-wider text-[10px] cursor-pointer ${
            showRiskOverlay
              ? 'bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'
              : 'bg-slate-900/90 border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-400'
          }`}
        >
          <span className={showRiskOverlay ? 'text-red-500' : 'text-slate-400'}>●</span>
          <span>LIVE RISK MONITOR</span>
        </button>
      )}

      {/* Chokepoint & Sea Lane overlay toggle */}
      <button
        type="button"
        onClick={() => setShowChokePoints((prev) => !prev)}
        className={`absolute top-[100px] left-4 z-[9999] flex items-center gap-1.5 px-2 py-0.5 rounded-full border shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 font-bold tracking-wider text-[10px] cursor-pointer ${
          showChokePoints
            ? 'bg-cyan-950/90 border-cyan-500 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
            : 'bg-slate-900/90 border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-400'
        }`}
      >
        <span className={showChokePoints ? 'text-cyan-400' : 'text-slate-400'}>◆</span>
        <span>SEA LANES</span>
      </button>

      {/* KODOKU ENGINE toggle */}
      <button
        type="button"
        onClick={() => setShowKodokuPanel((prev) => !prev)}
        className={`absolute top-[128px] left-4 z-[9999] flex items-center gap-1.5 px-2 py-0.5 rounded-full border shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 font-bold tracking-wider text-[10px] cursor-pointer ${
          showKodokuPanel
            ? 'bg-red-950/90 border-red-700 text-red-200 shadow-[0_0_15px_rgba(127,29,29,0.6)]'
            : 'bg-slate-900/90 border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-400'
        }`}
      >
        <span className={showKodokuPanel ? 'text-red-500' : 'text-slate-400'}>⬡</span>
        <span>KODOKU ENGINE</span>
      </button>

      {/* Conflict Ledger toggle */}
      {conflictGeojson && (
        <button
          type="button"
          onClick={() => setShowConflicts((prev) => !prev)}
          className={`absolute top-[156px] left-4 z-[9999] flex items-center gap-1.5 px-2 py-0.5 rounded-full border shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 font-bold tracking-wider text-[10px] cursor-pointer ${
            showConflicts
              ? 'bg-red-950/90 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
              : 'bg-slate-900/90 border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-400'
          }`}
        >
          <span className={showConflicts ? 'text-red-400' : 'text-slate-400'}>⚔</span>
          <span>CONFLICT MONITOR</span>
        </button>
      )}

      {/* KODOKU Panel overlay */}
      {showKodokuPanel && (
        <div className="absolute bottom-12 left-4 z-[9998]">
          <KodokuPanel onRouteSelect={setKodokuRouteId} />
        </div>
      )}

      <div className="absolute bottom-2 right-8 z-50 w-48 pointer-events-none">
        <div
          className="h-2 w-full relative border border-black/90 shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
          style={{ background: legendConfig.gradient }}
        >
          {[0, 20, 40, 60, 80, 100].map((pos) => (
            <span
              key={pos}
              aria-hidden="true"
              className="absolute top-0 h-3 w-[1px] bg-white/70"
              style={{ left: `${pos}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1" aria-label="Legend scale from 0 to 100">
          <span className="text-white text-[10px] font-mono opacity-90">0</span>
          <span className="text-white text-[10px] font-mono opacity-90">100</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MapLibreWorldMap);
