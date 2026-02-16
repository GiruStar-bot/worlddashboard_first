# ISO Reconciliation (countries-110m-kosovo-id.json ↔ worlddash_global_master.json)

## 1) Map geometry property identifiers

Checked `public/countries-110m-kosovo-id.json` and confirmed country geometries contain:

- `properties.name`
- `properties.ISO_A3`
- `properties.ADM0_A3`

`ISO_A3` / `ADM0_A3` were added for geometries that only had numeric `id` in the previous file, with explicit fallback exceptions kept in app constants.

## 2) Unmatched list after corrections

### Present in master but not represented on the map geometry (29)

`AND, ATG, BHR, BRB, COM, CPV, DMA, FSM, GRD, KIR, KNA, LCA, LIE, MCO, MDV, MHL, MLT, MUS, NRU, PLW, SGP, SMR, STP, SYC, TON, TUV, VAT, VCT, WSM`

### Present on map geometry but not in master (4)

`ATA, ATF, FLK, PRI`

## 3) Applied corrections

- Added geometry-property-first ISO lookup in `WorldMap` (`ISO_A3` → `ADM0_A3` → exceptions).
- Kept only minimal exception maps:
  - `id` exceptions: `983 -> XKX`, `548 -> VUT`
  - `name` exceptions: `N. Cyprus -> CYP`, `New Caledonia -> NCL`
