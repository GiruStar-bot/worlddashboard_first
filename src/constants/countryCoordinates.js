// src/constants/countryCoordinates.js
// 各国の中心座標 [longitude, latitude] と最適なズームレベルを定義
// ISO 3166-1 alpha-3 コードを使用
// src/constants/isoMap.js に準拠

export const DEFAULT_POSITION = {
  coordinates: [10, 15],
  zoom: 1.5
};

export const COUNTRY_COORDINATES = {
  // ── East Asia ─────────────────────────────
  CHN: { coordinates: [104.195, 35.861], zoom: 3 },    // China
  HKG: { coordinates: [114.169, 22.319], zoom: 9 },    // Hong Kong
  JPN: { coordinates: [138.252, 36.204], zoom: 5 },    // Japan
  KOR: { coordinates: [127.766, 35.907], zoom: 6 },    // South Korea
  PRK: { coordinates: [127.510, 40.339], zoom: 6 },    // North Korea
  TWN: { coordinates: [120.960, 23.697], zoom: 7 },    // Taiwan
  MNG: { coordinates: [103.846, 46.862], zoom: 4 },    // Mongolia
  MAC: { coordinates: [113.543, 22.198], zoom: 10 },   // Macao

  // ── Southeast Asia ────────────────────────
  IDN: { coordinates: [113.921, -0.789], zoom: 4 },    // Indonesia
  VNM: { coordinates: [108.277, 14.058], zoom: 5 },    // Vietnam
  THA: { coordinates: [100.992, 15.870], zoom: 5 },    // Thailand
  MYS: { coordinates: [101.975, 4.210], zoom: 5 },     // Malaysia
  PHL: { coordinates: [121.774, 12.879], zoom: 5 },    // Philippines
  SGP: { coordinates: [103.819, 1.352], zoom: 10 },    // Singapore
  MMR: { coordinates: [95.956, 21.916], zoom: 5 },     // Myanmar
  KHM: { coordinates: [104.991, 12.565], zoom: 6 },    // Cambodia
  LAO: { coordinates: [102.495, 19.856], zoom: 6 },    // Laos
  BRN: { coordinates: [114.727, 4.535], zoom: 9 },     // Brunei
  TLS: { coordinates: [125.727, -8.874], zoom: 8 },    // Timor-Leste

  // ── South Asia ────────────────────────────
  IND: { coordinates: [78.962, 20.593], zoom: 4 },     // India
  PAK: { coordinates: [69.345, 30.375], zoom: 5 },     // Pakistan
  BGD: { coordinates: [90.356, 23.685], zoom: 6 },     // Bangladesh
  LKA: { coordinates: [80.771, 7.873], zoom: 7 },      // Sri Lanka
  NPL: { coordinates: [84.124, 28.394], zoom: 6 },     // Nepal
  BTN: { coordinates: [90.433, 27.514], zoom: 7 },     // Bhutan
  MDV: { coordinates: [73.220, 3.202], zoom: 6 },      // Maldives
  AFG: { coordinates: [67.709, 33.939], zoom: 5 },     // Afghanistan

  // ── Central Asia ──────────────────────────
  KAZ: { coordinates: [66.923, 48.019], zoom: 3 },     // Kazakhstan
  UZB: { coordinates: [64.585, 41.377], zoom: 5 },     // Uzbekistan
  TKM: { coordinates: [59.556, 38.969], zoom: 5 },     // Turkmenistan
  KGZ: { coordinates: [74.766, 41.204], zoom: 6 },     // Kyrgyzstan
  TJK: { coordinates: [71.276, 38.861], zoom: 6 },     // Tajikistan

  // ── North America ─────────────────────────
  USA: { coordinates: [-95.712, 37.090], zoom: 3 },    // United States
  CAN: { coordinates: [-106.346, 56.130], zoom: 3 },   // Canada
  MEX: { coordinates: [-102.552, 23.634], zoom: 4 },   // Mexico
  GRL: { coordinates: [-42.604, 71.706], zoom: 2 },    // Greenland

  // ── Central America & Caribbean ───────────
  GTM: { coordinates: [-90.230, 15.783], zoom: 6 },    // Guatemala
  CUB: { coordinates: [-77.781, 21.521], zoom: 5 },    // Cuba
  HTI: { coordinates: [-72.285, 18.971], zoom: 7 },    // Haiti
  DOM: { coordinates: [-70.162, 18.735], zoom: 7 },    // Dominican Republic
  HND: { coordinates: [-86.241, 15.199], zoom: 6 },    // Honduras
  NIC: { coordinates: [-85.207, 12.865], zoom: 6 },    // Nicaragua
  SLV: { coordinates: [-88.896, 13.794], zoom: 7 },    // El Salvador
  CRI: { coordinates: [-83.753, 9.748], zoom: 7 },     // Costa Rica
  PAN: { coordinates: [-80.782, 8.538], zoom: 7 },     // Panama
  JAM: { coordinates: [-77.297, 18.109], zoom: 8 },    // Jamaica
  BHS: { coordinates: [-77.396, 25.034], zoom: 6 },    // Bahamas
  PRI: { coordinates: [-66.590, 18.220], zoom: 8 },    // Puerto Rico
  BLZ: { coordinates: [-88.497, 17.189], zoom: 7 },    // Belize
  BRB: { coordinates: [-59.543, 13.193], zoom: 10 },   // Barbados
  TTO: { coordinates: [-61.222, 10.691], zoom: 8 },    // Trinidad and Tobago

  // ── South America ─────────────────────────
  BRA: { coordinates: [-51.925, -14.235], zoom: 3 },   // Brazil
  ARG: { coordinates: [-63.616, -38.416], zoom: 3 },   // Argentina
  COL: { coordinates: [-74.297, 4.570], zoom: 5 },     // Colombia
  PER: { coordinates: [-75.015, -9.189], zoom: 4 },    // Peru
  VEN: { coordinates: [-66.589, 6.423], zoom: 5 },     // Venezuela
  CHL: { coordinates: [-71.542, -35.675], zoom: 3 },   // Chile
  ECU: { coordinates: [-78.183, -1.831], zoom: 6 },    // Ecuador
  BOL: { coordinates: [-63.588, -16.290], zoom: 5 },   // Bolivia
  PRY: { coordinates: [-58.443, -23.442], zoom: 5 },   // Paraguay
  URY: { coordinates: [-55.765, -32.522], zoom: 6 },   // Uruguay
  GUY: { coordinates: [-58.930, 4.860], zoom: 6 },     // Guyana
  SUR: { coordinates: [-56.027, 3.919], zoom: 6 },     // Suriname
  GUF: { coordinates: [-53.125, 3.933], zoom: 6 },     // French Guiana

  // ── Europe ────────────────────────────────
  GBR: { coordinates: [-3.435, 55.378], zoom: 5 },     // United Kingdom
  FRA: { coordinates: [2.213, 46.227], zoom: 5 },      // France
  DEU: { coordinates: [10.451, 51.165], zoom: 5 },     // Germany
  ITA: { coordinates: [12.567, 41.871], zoom: 5 },     // Italy
  ESP: { coordinates: [-3.749, 40.463], zoom: 5 },     // Spain
  UKR: { coordinates: [31.165, 48.379], zoom: 4 },     // Ukraine
  POL: { coordinates: [19.145, 51.919], zoom: 5 },     // Poland
  ROU: { coordinates: [24.966, 45.943], zoom: 5 },     // Romania
  NLD: { coordinates: [5.291, 52.132], zoom: 7 },      // Netherlands
  BEL: { coordinates: [4.469, 50.503], zoom: 7 },      // Belgium
  CZE: { coordinates: [15.473, 49.817], zoom: 6 },     // Czech Republic
  GRC: { coordinates: [21.824, 39.074], zoom: 6 },     // Greece
  PRT: { coordinates: [-8.224, 39.399], zoom: 6 },     // Portugal
  SWE: { coordinates: [18.643, 60.128], zoom: 4 },     // Sweden
  HUN: { coordinates: [19.503, 47.162], zoom: 6 },     // Hungary
  BLR: { coordinates: [27.953, 53.709], zoom: 5 },     // Belarus
  AUT: { coordinates: [14.550, 47.516], zoom: 6 },     // Austria
  CHE: { coordinates: [8.227, 46.818], zoom: 7 },      // Switzerland
  SRB: { coordinates: [21.005, 44.016], zoom: 6 },     // Serbia
  BGR: { coordinates: [25.485, 42.733], zoom: 6 },     // Bulgaria
  DNK: { coordinates: [9.501, 56.263], zoom: 6 },      // Denmark
  FIN: { coordinates: [25.748, 61.924], zoom: 4 },     // Finland
  SVK: { coordinates: [19.699, 48.669], zoom: 6 },     // Slovakia
  NOR: { coordinates: [8.468, 60.472], zoom: 4 },      // Norway
  IRL: { coordinates: [-8.243, 53.412], zoom: 6 },     // Ireland
  HRV: { coordinates: [15.200, 45.100], zoom: 6 },     // Croatia
  MDA: { coordinates: [28.369, 47.411], zoom: 7 },     // Moldova
  BIH: { coordinates: [17.679, 43.915], zoom: 7 },     // Bosnia and Herzegovina
  ALB: { coordinates: [20.168, 41.153], zoom: 7 },     // Albania
  LTU: { coordinates: [23.881, 55.169], zoom: 6 },     // Lithuania
  MKD: { coordinates: [21.745, 41.608], zoom: 7 },     // North Macedonia
  SVN: { coordinates: [14.995, 46.151], zoom: 7 },     // Slovenia
  LVA: { coordinates: [24.603, 56.879], zoom: 6 },     // Latvia
  EST: { coordinates: [25.013, 58.595], zoom: 6 },     // Estonia
  MNE: { coordinates: [19.374, 42.708], zoom: 8 },     // Montenegro
  LUX: { coordinates: [6.129, 49.815], zoom: 9 },      // Luxembourg
  MCO: { coordinates: [7.424, 43.738], zoom: 11 },     // Monaco
  AND: { coordinates: [1.521, 42.507], zoom: 10 },     // Andorra
  LIE: { coordinates: [9.556, 47.166], zoom: 11 },     // Liechtenstein
  SMR: { coordinates: [12.458, 43.942], zoom: 11 },    // San Marino
  MLT: { coordinates: [14.375, 35.937], zoom: 10 },    // Malta
  ISL: { coordinates: [-19.020, 64.963], zoom: 5 },    // Iceland
  RUS: { coordinates: [105.318, 61.524], zoom: 2 },    // Russia
  CYP: { coordinates: [33.429, 35.126], zoom: 8 },     // Cyprus

  // ── Middle East ───────────────────────────
  SAU: { coordinates: [45.079, 23.885], zoom: 4 },     // Saudi Arabia
  IRN: { coordinates: [53.688, 32.427], zoom: 4 },     // Iran
  TUR: { coordinates: [35.243, 38.963], zoom: 5 },     // Turkey
  IRQ: { coordinates: [43.679, 33.223], zoom: 5 },     // Iraq
  YEM: { coordinates: [48.516, 15.552], zoom: 5 },     // Yemen
  SYR: { coordinates: [38.996, 34.802], zoom: 6 },     // Syria
  JOR: { coordinates: [36.238, 30.585], zoom: 6 },     // Jordan
  AZE: { coordinates: [47.576, 40.143], zoom: 6 },     // Azerbaijan
  ARE: { coordinates: [53.847, 23.424], zoom: 6 },     // United Arab Emirates
  ISR: { coordinates: [34.851, 31.046], zoom: 7 },     // Israel
  LBN: { coordinates: [35.862, 33.854], zoom: 8 },     // Lebanon
  OMN: { coordinates: [55.923, 21.512], zoom: 5 },     // Oman
  KWT: { coordinates: [47.481, 29.311], zoom: 8 },     // Kuwait
  QAT: { coordinates: [51.183, 25.354], zoom: 8 },     // Qatar
  BHR: { coordinates: [50.637, 26.066], zoom: 9 },     // Bahrain
  GEO: { coordinates: [43.356, 42.315], zoom: 6 },     // Georgia
  ARM: { coordinates: [45.038, 40.069], zoom: 7 },     // Armenia
  PSE: { coordinates: [35.233, 31.952], zoom: 8 },     // Palestine

  // ── Africa ────────────────────────────────
  NGA: { coordinates: [8.675, 9.082], zoom: 5 },       // Nigeria
  ETH: { coordinates: [40.489, 9.145], zoom: 4 },      // Ethiopia
  EGY: { coordinates: [30.802, 26.820], zoom: 4 },     // Egypt
  COD: { coordinates: [21.758, -4.038], zoom: 4 },     // DR Congo
  ZAF: { coordinates: [22.937, -30.559], zoom: 4 },    // South Africa
  TZA: { coordinates: [34.888, -6.369], zoom: 5 },     // Tanzania
  KEN: { coordinates: [37.906, -0.023], zoom: 5 },     // Kenya
  UGA: { coordinates: [32.290, 1.373], zoom: 6 },      // Uganda
  SDN: { coordinates: [30.217, 12.862], zoom: 4 },     // Sudan
  MAR: { coordinates: [-7.092, 31.791], zoom: 5 },     // Morocco
  AGO: { coordinates: [17.873, -11.202], zoom: 4 },    // Angola
  GHA: { coordinates: [-1.023, 7.946], zoom: 6 },      // Ghana
  MOZ: { coordinates: [35.529, -18.665], zoom: 4 },    // Mozambique
  MDG: { coordinates: [46.869, -18.766], zoom: 4 },    // Madagascar
  CIV: { coordinates: [-5.547, 7.540], zoom: 5 },      // Ivory Coast
  CMR: { coordinates: [12.354, 7.369], zoom: 5 },      // Cameroon
  NER: { coordinates: [8.081, 17.607], zoom: 4 },      // Niger
  MLI: { coordinates: [-3.996, 17.570], zoom: 4 },     // Mali
  BFA: { coordinates: [-1.561, 12.238], zoom: 5 },     // Burkina Faso
  MWI: { coordinates: [34.301, -13.254], zoom: 6 },    // Malawi
  ZMB: { coordinates: [27.849, -13.133], zoom: 5 },    // Zambia
  SEN: { coordinates: [-14.452, 14.497], zoom: 6 },    // Senegal
  TCD: { coordinates: [18.732, 15.454], zoom: 4 },     // Chad
  SOM: { coordinates: [46.199, 5.152], zoom: 5 },      // Somalia
  ZWE: { coordinates: [29.154, -19.015], zoom: 5 },    // Zimbabwe
  GIN: { coordinates: [-9.696, 9.945], zoom: 6 },      // Guinea
  RWA: { coordinates: [29.873, -1.940], zoom: 8 },     // Rwanda
  BEN: { coordinates: [2.315, 9.307], zoom: 6 },       // Benin
  BDI: { coordinates: [29.918, -3.373], zoom: 8 },     // Burundi
  TUN: { coordinates: [9.537, 33.886], zoom: 6 },      // Tunisia
  SSD: { coordinates: [31.307, 6.877], zoom: 5 },      // South Sudan
  LBY: { coordinates: [17.228, 26.335], zoom: 4 },     // Libya
  DZA: { coordinates: [1.659, 28.033], zoom: 4 },      // Algeria
  CAF: { coordinates: [20.939, 6.611], zoom: 5 },      // Central African Republic
  COG: { coordinates: [15.827, -0.228], zoom: 5 },     // Congo
  LBR: { coordinates: [-9.429, 6.428], zoom: 6 },      // Liberia
  MRT: { coordinates: [-10.940, 21.007], zoom: 4 },    // Mauritania
  ERI: { coordinates: [39.782, 15.179], zoom: 6 },     // Eritrea
  GMB: { coordinates: [-15.310, 13.443], zoom: 8 },    // Gambia
  BWA: { coordinates: [24.684, -22.328], zoom: 5 },    // Botswana
  NAM: { coordinates: [18.490, -22.957], zoom: 5 },    // Namibia
  GAB: { coordinates: [11.609, -0.803], zoom: 6 },     // Gabon
  LSO: { coordinates: [28.233, -29.609], zoom: 8 },    // Lesotho
  GNB: { coordinates: [-15.180, 11.803], zoom: 7 },    // Guinea-Bissau
  GNQ: { coordinates: [10.267, 1.650], zoom: 7 },      // Equatorial Guinea
  DJI: { coordinates: [42.590, 11.825], zoom: 8 },     // Djibouti
  SWZ: { coordinates: [31.465, -26.522], zoom: 8 },    // Eswatini
  TGO: { coordinates: [0.824, 8.619], zoom: 7 },       // Togo
  SLE: { coordinates: [-11.779, 8.460], zoom: 6 },     // Sierra Leone
  ESH: { coordinates: [-12.885, 24.215], zoom: 5 },    // Western Sahara

  // ── Oceania ───────────────────────────────
  AUS: { coordinates: [133.775, -25.274], zoom: 3 },  // Australia
  PNG: { coordinates: [147.180, -6.314], zoom: 5 },    // Papua New Guinea
  NZL: { coordinates: [174.885, -40.900], zoom: 5 },   // New Zealand
  FJI: { coordinates: [178.065, -17.713], zoom: 7 },   // Fiji
  SLB: { coordinates: [160.156, -9.645], zoom: 6 },    // Solomon Islands
  VUT: { coordinates: [166.959, -15.376], zoom: 6 },   // Vanuatu
  NCL: { coordinates: [165.618, -20.904], zoom: 6 },   // New Caledonia (FR)
};
