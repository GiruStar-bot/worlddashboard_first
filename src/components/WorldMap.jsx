import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

/*
 * WorldMap Component (v2.3 Updated)
 * - Added translateExtent to lock the map area and prevent dragging it off-screen.
 * - Keeps the map centered and prevents "lost map" scenarios.
 */

// Stable CDN for world map topology
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

// Mapping table: UN Numeric Code -> ISO Alpha-3 Code
const ISO_MAP = {
  "004": "AFG", "008": "ALB", "010": "ATA", "012": "DZA", "016": "ASM", "020": "AND", "024": "AGO", 
  "028": "ATG", "031": "AZE", "032": "ARG", "036": "AUS", "040": "AUT", "044": "BHS", "048": "BHR", 
  "050": "BGD", "051": "ARM", "052": "BRB", "056": "BEL", "060": "BMU", "064": "BTN", "068": "BOL", 
  "070": "BIH", "072": "BWA", "074": "BVT", "076": "BRA", "084": "BLZ", "086": "IOT", "090": "SLB", 
  "092": "VGB", "096": "BRN", "100": "BGR", "104": "MMR", "108": "BDI", "112": "BLR", "116": "KHM", 
  "120": "CMR", "124": "CAN", "132": "CPV", "136": "CYP", "140": "CAF", "144": "LKA", "148": "TCD", 
  "152": "CHL", "156": "CHN", "158": "TWN", "162": "CXR", "166": "CCK", "170": "COL", "174": "COM", 
  "175": "MYT", "178": "COG", "180": "COD", "184": "COK", "188": "CRI", "191": "HRV", "192": "CUB", 
  "196": "CYP", "203": "CZE", "204": "BEN", "208": "DNK", "212": "DMA", "214": "DOM", "218": "ECU", 
  "222": "SLV", "226": "GNQ", "231": "ETH", "232": "ERI", "233": "EST", "234": "FRO", "238": "FLK", 
  "239": "SGS", "242": "FJI", "246": "FIN", "248": "ALA", "250": "FRA", "254": "GUF", "258": "PYF", 
  "260": "ATF", "262": "DJI", "266": "GAB", "268": "GEO", "270": "GMB", "275": "PSE", "276": "DEU", 
  "288": "GHA", "292": "GIB", "296": "KIR", "300": "GRC", "304": "GRL", "308": "GRD", "312": "GLP", 
  "316": "GUM", "320": "GTM", "324": "GIN", "328": "GUY", "332": "HTI", "334": "HMD", "336": "VAT", 
  "340": "HND", "344": "HKG", "348": "HUN", "352": "ISL", "356": "IND", "360": "IDN", "364": "IRN", 
  "368": "IRQ", "372": "IRL", "376": "ISR", "380": "ITA", "384": "CIV", "388": "JAM", "392": "JPN", 
  "398": "KAZ", "400": "JOR", "404": "KEN", "408": "PRK", "410": "KOR", "414": "KWT", "417": "KGZ", 
  "418": "LAO", "422": "LBN", "426": "LSO", "428": "LVA", "430": "LBR", "434": "LBY", "438": "LIE", 
  "440": "LTU", "442": "LUX", "446": "MAC", "450": "MDG", "454": "MWI", "458": "MYS", "462": "MDV", 
  "466": "MLI", "470": "MLT", "474": "MTQ", "478": "MRT", "480": "MUS", "484": "MEX", "492": "MCO", 
  "496": "MNG", "498": "MDA", "499": "MNE", "500": "MSR", "504": "MAR", "508": "MOZ", "512": "OMN", 
  "516": "NAM", "520": "NRU", "524": "NPL", "528": "NLD", "531": "CUW", "533": "ABW", "534": "SXM", 
  "535": "BES", "540": "NCL", "548": "VUT", "554": "NZL", "558": "NIC", "562": "NER", "566": "NGA", 
  "570": "NIU", "574": "NFK", "578": "NOR", "580": "MNP", "581": "UMI", "583": "FSM", "584": "MHL", 
  "585": "PLW", "586": "PAK", "591": "PAN", "598": "PNG", "600": "PRY", "604": "PER", "608": "PHL", 
  "612": "PCN", "616": "POL", "620": "PRT", "624": "GNB", "626": "TLS", "630": "PRI", "634": "QAT", 
  "638": "REU", "642": "ROU", "643": "RUS", "646": "RWA", "652": "BLM", "654": "SHN", "659": "KNA", 
  "660": "AIA", "662": "LCA", "663": "MAF", "666": "SPM", "670": "VCT", "674": "SMR", "678": "STP", 
  "682": "SAU", "686": "SEN", "688": "SRB", "690": "SYC", "694": "SLE", "702": "SGP", "703": "SVK", 
  "704": "VNM", "705": "SVN", "706": "SOM", "710": "ZAF", "716": "ZWE", "724": "ESP", "728": "SSD", 
  "729": "SDN", "732": "ESH", "740": "SUR", "744": "SJM", "748": "SWZ", "752": "SWE", "756": "CHE", 
  "760": "SYR", "762": "TJK", "764": "THA", "768": "TGO", "772": "TKL", "776": "TON", "780": "TTO", 
  "784": "ARE", "788": "TUN", "792": "TUR", "795": "TKM", "796": "TCA", "798": "TUV", "800": "UGA", 
  "804": "UKR", "807": "MKD", "818": "EGY", "826": "GBR", "834": "TZA", "840": "USA", "850": "VIR", 
  "854": "BFA", "858": "URY", "860": "UZB", "862": "VEN", "876": "WLF", "882": "WSM", "887": "YEM", 
  "894": "ZMB"
};

// --- Color Utility Functions ---
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function mixColours(a, b, t) {
  return rgbToHex({
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  });
}

// Colors: Low Risk (Cyan) -> Mid Risk (Purple) -> High Risk (Red)
const COLOUR_LOW = hexToRgb('#06b6d4');
const COLOUR_MID = hexToRgb('#8b5cf6');
const COLOUR_HIGH = hexToRgb('#ef4444');

export default function WorldMap({ data, onCountryClick, onHover, selectedIso }) {
  // 1. Build a lookup for Risk scores (keyed by ISO3)
  const riskByIso = useMemo(() => {
    const map = {};
    if (data && data.regions) {
      Object.values(data.regions).forEach((region) => {
        region.forEach((entry) => {
          const iso = entry.master.iso3;
          const risk = entry.canonical?.risk?.fsi_total?.value;
          map[iso] = risk; 
        });
      });
    }
    return map;
  }, [data]);

  // 2. Determine min/max for color scaling
  const [minRisk, maxRisk] = useMemo(() => {
    const values = Object.values(riskByIso).filter((v) => v != null);
    if (!values.length) return [0, 120];
    return [Math.min(...values), Math.max(...values)];
  }, [riskByIso]);

  // 3. Color generation function
  const getColour = (risk) => {
    if (risk == null) return '#1e293b'; 
    const t = (risk - minRisk) / (maxRisk - minRisk);
    if (t < 0.5) return mixColours(COLOUR_LOW, COLOUR_MID, t / 0.5);
    return mixColours(COLOUR_MID, COLOUR_HIGH, (t - 0.5) / 0.5);
  };

  return (
    <div className="w-full h-full bg-slate-950">
      <ComposableMap 
        projectionConfig={{ scale: 220 }} 
        className="w-full h-full"
      >
        <ZoomableGroup 
          center={[0, 0]} 
          zoom={1} 
          minZoom={1} 
          maxZoom={8}
          // Restrict panning so the map doesn't float away.
          // Setting translateExtent to [[0, 0], [800, 600]] locks the map to the viewbox.
          translateExtent={[
            [0, 0],
            [800, 600]
          ]}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isoNumeric = geo.id; 
                const isoAlpha3 = ISO_MAP[isoNumeric];
                const iso = isoAlpha3 || isoNumeric;
                const risk = riskByIso[iso];
                const fill = getColour(risk);
                const isSelected = iso === selectedIso;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#334155"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none', transition: 'fill 0.3s ease' },
                      hover: { fill: '#f472b6', cursor: 'pointer', outline: 'none' },
                      pressed: { fill: '#ec4899', outline: 'none' },
                    }}
                    onMouseEnter={(evt) => {
                      const { clientX: x, clientY: y } = evt;
                      onHover(iso, { x, y });
                    }}
                    onMouseLeave={() => onHover(null)}
                    onClick={() => {
                      if (isoAlpha3) onCountryClick(iso);
                    }}
                    filter={isSelected ? 'url(#country-glow)' : undefined}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
        <defs>
          <filter id="country-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </ComposableMap>
    </div>
  );
}
