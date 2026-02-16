import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { COUNTRY_COORDINATES, DEFAULT_POSITION } from '../constants/countryCoordinates';
import { getLayerScoreMaps } from '../utils/layerScoreUtils';

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
    const packageName = 'maplibre-gl';
    const mod = await import(/* @vite-ignore */ packageName);
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
        const features = map.queryRenderedFeatures(event.point, { layers: [COUNTRY_FILL_LAYER_ID, DISPUTED_FILL_LAYER_ID] });
        const country = pickCountryFeature(features);
        if (!country) return;
        onCountryClick(country.iso);
      });
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

      <div className="absolute bottom-4 right-8 z-20 font-sans select-none animate-in fade-in slide-in-from-bottom-4 duration-700 pointer-events-none">
        <div className="bg-[#0f172a]/90 backdrop-blur-md border border-white/[0.08] rounded-lg p-3 shadow-2xl min-w-[200px]">
          <div className="mb-2">
            <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${legendConfig.colorClass}`}>
              {legendConfig.title}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {legendConfig.subTitle}
            </div>
          </div>

          <div className="h-2 w-full rounded-sm mb-1.5 relative border border-white/10 overflow-hidden" style={{ background: legendConfig.gradient }}>
            <div className="absolute inset-0 flex justify-between px-[1px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-[1px] h-full bg-white/30 backdrop-invert" />
              ))}
            </div>
          </div>

          <div className="flex justify-between text-[9px] text-slate-500 mb-1">
            <span>Low</span>
            <span>High</span>
          </div>

          <div className="flex justify-between text-[9px] text-slate-400 font-mono font-medium">
            {legendConfig.labels.map((label, i) => (
              <span key={i} className={i === 0 ? 'text-left' : i === 4 ? 'text-right' : 'text-center'} style={{ width: '20px' }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MapLibreWorldMap);
