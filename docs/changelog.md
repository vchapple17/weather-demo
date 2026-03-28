# Changelog

## Planned Improvements

- [ ] Upgrade to Expo 55 when stable (removes deprecated `inflight` dependency)
- [ ] Add authentication to API endpoints
- [ ] Add rate limiting for production

## Changes

### 2026-03-28

- Redesigned frontend navigation around business decision-making (predict → quantify → understand)
  - Replaced original 4-screen plan (Dashboard, Analysis, Report, Location) with 3-tab structure
  - Tab 1: **Forecast** — forward-looking dead zone predictions based on upcoming weather
  - Tab 2: **Revenue Leaks** — ranked dead zone patterns with estimated lost revenue, filterable by location/booking type
  - Tab 3: **Patterns** — weather correlations, wind wall threshold, indoor vs outdoor behavior analysis
  - Location detail as a stack drill-down from any tab, not a standalone tab
- Built frontend routing structure with expo-router file-based routing
  - `app/(tabs)/index.tsx` — Forecast screen
  - `app/(tabs)/explore.tsx` — Revenue Leaks screen
  - `app/(tabs)/patterns.tsx` — Patterns screen
  - `app/location/[id].tsx` — Location detail drill-down (stack)
  - Updated tab icons: cloud/sun (Forecast), dollar (Revenue), chart (Patterns)
- Added ECharts via `echarts` + `@wuba/react-native-echarts` (SVG renderer)
  - Proof-of-concept wind wall chart on Patterns screen (wind speed vs utilization with dashed marker at 25 mph)
- Added `metro.config.js` to fix Metro bundler compatibility
  - Enabled `unstable_enablePackageExports` for echarts subpath resolution
  - Custom `tslib` resolver to fix ESM/CJS interop error

### 2026-02-01

- Added `test_revenue_examples.py` with comprehensive tests for revenue transaction fixtures, utilization data, weather impact on indoor/outdoor activities, and mock data generator determinism
- Replaced markdown-based report with custom UI components
  - Added `/api/report/structured` endpoint returning JSON
  - Created ExecutiveSummary, WindWallSection, WeatherCorrelationSection, DeadZoneSection, FinancialImpactSection, and RecommendationsSection components
  - Removed `react-native-markdown-display` dependency (and its vulnerable `markdown-it` dependency)
- Updated Expo to 54.0.33
- Enhanced README with project description and purpose statement
- Reviewed security considerations (CORS, auth, rate limiting)
- Enhanced `.gitignore` with security patterns (env files, certificates, secrets, Docker overrides, test coverage)

### 2025-01-25

- Added Docker support (Dockerfile for backend and frontend)
- Added docker-compose.yml for running both services
- Created project documentation
- Removed Claude's package.json, and used `npx @react-native-community/cli@latest init` to build the frontend project instead.


