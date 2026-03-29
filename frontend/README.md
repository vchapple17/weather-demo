# Weather Demo — Frontend

React Native + Expo frontend for the Dead Hours golf course analytics app.

## Overview

Three-tab app designed to help golf course managers identify and act on low-utilization time slots:

| Tab | Purpose |
|-----|---------|
| **Forecast** | Forward-looking dead zone predictions based on upcoming weather |
| **Revenue Leaks** | Dead zone patterns ranked by estimated lost revenue |
| **Patterns** | Weather correlations, wind wall threshold, behavioral trends |

Location detail is a stack drill-down accessible from any tab.

## Running

**With Docker (recommended):**
```bash
# From project root
docker compose up --build
```
App runs at `http://localhost:8081`

**Locally:**
```bash
npm install
npx expo start
```

## Forecast Screen

The Forecast tab (`app/(tabs)/index.tsx`) is the primary decision tool:

- **Day picker** — 7-day strip with urgency dots indicating days with at-risk slots
- **Weather card** — color-coded by condition (rainy, hot, cold, windy, sunny) with full stats
- **Promotion opportunities** — only at-risk slots, ranked by urgency, each with a plain-English reason and suggested discount range
- **Full schedule** — collapsible view of all hours × booking types for the selected day

Mock data in `data/mock/forecast.ts` uses a date-seeded RNG so each day renders consistently. The utilization patterns and weather-impact logic mirror the backend `MockDataGenerator` algorithms exactly.

## Charts

Charts use [ECharts](https://echarts.apache.org/) via [`@wuba/react-native-echarts`](https://github.com/wuba/react-native-echarts) with the SVG renderer.

`components/charts/EChart.tsx` is a reusable wrapper that handles init, setOption, and dispose — pass any ECharts option object as a prop.

### Patterns Screen Charts

| # | Chart | Type | Business Question |
|---|-------|------|-------------------|
| 1 | Wind Wall Effect | Line + area | At what wind speed do bookings collapse? |
| 2 | Temperature Sweet Spot | Color-coded bar | Which temp range drives the most bookings? |
| 3 | Heat Index Penalty | Horizontal bar | How much does humidity amplify heat impact? |
| 4 | Precipitation Impact | Color-coded bar | How fast does rain kill utilization? |
| 5 | Monthly Seasonality | Bar + line overlay | Which months under/overprice demand? |
| 6 | Day of Week Pattern | Bar + line overlay | Which weekdays have untapped capacity? |
| 7 | Hour × Day Heatmap | Heatmap (14h × 7d) | When exactly are the dead zones each week? |

Mock data lives in `data/mock/patterns.ts` — shaped to mirror the real API response for easy swap-in.

## Data Models

TypeScript types in `types/`:
- `location.ts` — `Location`, `BookingType`, `Amenity`
- `booking.ts` — `Booking`, `Player`, `CartSelection`, `BookingPricing`, `ContactInfo`
- `weather.ts` — `WeatherReading`, `DailyWeatherSummary`, `PrecipitationType`

## Metro Config

`metro.config.js` includes two fixes required for ECharts compatibility:
- `unstable_enablePackageExports: true` — resolves echarts subpath imports
- Custom `tslib` resolver — fixes ESM/CJS interop error at runtime
