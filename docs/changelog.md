# Changelog

## Planned Improvements

- [ ] Upgrade to Expo 55 when stable (removes deprecated `inflight` dependency)
- [ ] Add authentication to API endpoints
- [ ] Add rate limiting for production

## Changes

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


