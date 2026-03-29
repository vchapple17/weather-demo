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
- Added TypeScript data models to frontend (`frontend/types/`)
  - `location.ts` — `Location`, `BookingType`, `Amenity`, `GeoCoordinates`
  - `booking.ts` — `Booking`, `Player`, `CartSelection`, `BookingPricing`, `ContactInfo`, `BookingStatus`, `BookingSource`, `WeatherSnapshot`
  - `weather.ts` — `WeatherReading`, `DailyWeatherSummary`, `PrecipitationType`, `SkyCondition`, `WindDirection`
- Added backend repository pattern (`backend/app/repositories/`)
  - `base.py` — abstract `BookingRepository`, `WeatherRepository`, `LocationRepository` interfaces
  - `mock/bookings.py` — in-memory mock with ~4,000 seeded bookings (90 days × 7 locations)
  - `mock/weather.py` — in-memory mock with ~15,000 hourly weather readings
  - `mock/locations.py` — 7 seeded facility locations
  - `repositories/__init__.py` — factory functions (`get_booking_repo`, `get_weather_repo`, `get_location_repo`) with TODO stubs for Postgres swap-in
- Expanded `backend/app/models/booking.py` — rich `Booking` model with `Player`, `CartSelection`, `BookingPricing`, `ContactInfo`, `BookingStatus`, `CartOption`
- Expanded `backend/app/models/weather.py` — added `WeatherReading`, `DailyWeatherSummary`, `PrecipitationType`, `SkyCondition`, `WindDirection` alongside existing `HourlyWeather`
- Built out Patterns screen with 7 business-insight charts
  - `components/charts/EChart.tsx` — reusable ECharts init/dispose wrapper
  - `data/mock/patterns.ts` — typed mock datasets for all charts
  - Charts: Wind Wall, Temperature Sweet Spot, Heat Index Penalty, Precipitation Impact, Monthly Seasonality, Day of Week, Hour×Day Heatmap
  - Hour×Day heatmap (14 hrs × 7 days) replaces simple hour-of-day bar chart; color-coded red→amber→green
- Consolidated backend data layer — single source of truth for all mock data
  - `repositories/mock/locations.py` is now the only definition of `LOCATIONS`; `mock_data.py` imports from it
  - `MockWeatherRepository` replaces `MockDataGenerator.generate_mock_weather()` as the weather data source
  - `mock_data.py` reduced to a pure computation layer (utilization patterns + weather-impact algorithms)
  - `AnalysisService` now uses `get_location_repo()` and `get_weather_repo()` instead of calling `mock_data` directly
  - All weather access updated from dict-style `w["key"]` to `WeatherReading` attribute access
  - Repository interfaces made synchronous (in-memory, no I/O; async deferred until Postgres)
  - `test_seeded_generator_is_deterministic` updated to use `MockWeatherRepository` directly

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


