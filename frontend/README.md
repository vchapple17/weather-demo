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

## Charts

Charts use [ECharts](https://echarts.apache.org/) via [`@wuba/react-native-echarts`](https://github.com/wuba/react-native-echarts) with the SVG renderer.

## Metro Config

`metro.config.js` includes two fixes required for ECharts compatibility:
- `unstable_enablePackageExports: true` — resolves echarts subpath imports
- Custom `tslib` resolver — fixes ESM/CJS interop error at runtime
