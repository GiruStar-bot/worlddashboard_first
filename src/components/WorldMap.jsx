import React from 'react';
import LegacyWorldMap from './LegacyWorldMap';
import MapLibreWorldMap from './MapLibreWorldMap';

const WorldMap = (props) => {
  const { useMapLibre = true } = props;
  if (useMapLibre) return <MapLibreWorldMap {...props} />;
  return <LegacyWorldMap {...props} />;
};

export default WorldMap;
