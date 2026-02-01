# Original Idea

## Concept

Build a cross-platform application to identify "Dead Hours" at golf course locations by correlating tee time booking data with weather patterns.

Inputs will include location data, historical purchasing data, and weather API inputs.  

## Original Plan

**Tech Stack:**
  - **Backend**: FastAPI (Python 3.x)
  - **Frontend**: React Native with Expo (iOS, Android, Web)
  - **Data**: Mock/sample reservation data + Open-Meteo API for weather

## Backend Structure (`/backend`)

  ```
  backend/
  ├── main.py                 # FastAPI app entry point
  ├── requirements.txt        # Dependencies
  ├── app/
  │   ├── config.py           # Settings (API URLs, thresholds)
  │   ├── models/
  │   │   └── some-model.py       # Pydantic models, enums, for booking data (9/18-hole, ranges, putt-putt)
  │   ├── services/
  │   │   └── some-service.py # Open-Meteo API integration, dead zone logic and report generation
  │   ├── routers/
  │   │   └── some-router-1.py     # API endpoints
  │   └── data/
  │       └── mock_data.py    # Mock reservation data generator
  ```

  ### Key Backend Components

  1. **Mock Data Generator** (`app/data/mock_data.py`)
     - Generate realistic reservation data for 13 golf facilities
     - **Booking Types:**
       - 9-hole rounds
       - 18-hole rounds
       - Driving range (outdoor)
       - Indoor driving range
       - Outdoor putt-putt
       - Indoor putt-putt
     - Include hourly timestamps, utilization rates, pricing per booking type
     - Cover ~6 months of historical data
     - Indoor facilities (indoor driving range, indoor putt-putt) are weather-independent

  2. **Weather Service** (`app/services/weather.py`)
     - Integrate with Open-Meteo API (local Docker or public)
     - Fetch: temp_2m, precipitation, wind_speed_10m
     - Cache responses to avoid repeated calls

  3. **Analysis Engine** (`app/services/analysis.py`)
     - Dead Zone Detection: utilization < 15%, exclude 12AM-6AM
     - Weather Correlation (outdoor only): 9/18-hole, outdoor driving range, outdoor putt-putt
       - Identify wind threshold for golf rounds
       - Precipitation impact analysis
     - Indoor Analysis: indoor driving range & indoor putt-putt (weather-independent)
       - Focus on behavior-driven patterns only
     - Behavior-Driven Analysis: low utilization in "perfect" conditions (60-75°F, low wind)
     - Financial Impact: calculate lost revenue per booking type and dead zone category

  4. **Report Generator** (`app/services/report.py`)
     - Generate Markdown report with:
       - Executive Summary (Top 3 Revenue Leaks)
       - "Wind Wall" Insight (MPH collapse threshold)
       - Strategic Recommendations (dynamic pricing, operational pivots)

  5. **API Endpoints**
     - `GET /api/locations` - List all facilities
     - `GET /api/analysis/dead-zones` - Get dead zone analysis
     - `GET /api/analysis/weather-correlation` - Weather impact data
     - `GET /api/analysis/financial-impact` - Revenue loss calculations
     - `GET /api/report` - Full Markdown report
     - `GET /api/charts/{chart_type}` - Chart data for visualizations

  ---

  ## Frontend Structure (`/frontend`)

  ```
  frontend/
  ├── package.json
  ├── app.json                # Expo config
  ├── App.tsx                 # Root component
  ├── src/
  │   ├── api/
  │   │   └── client.ts       # API client for backend
  │   ├── screens/
  │   │   ├── DashboardScreen.tsx    # Main overview
  │   │   ├── AnalysisScreen.tsx     # Detailed analysis view
  │   │   ├── ReportScreen.tsx       # Markdown report display
  │   │   └── LocationScreen.tsx     # Per-location details
  │   ├── components/
  │   │   ├── charts/
  │   │   │   ├── UtilizationChart.tsx
  │   │   │   ├── WindCorrelationChart.tsx
  │   │   │   └── RevenueImpactChart.tsx
  │   │   ├── DeadZoneCard.tsx
  │   │   └── LocationList.tsx
  │   └── utils/
  │       └── formatting.ts   # Data formatting helpers
  ```

  ### Key Frontend Components

  1. **Dashboard** - Overview of all locations with key metrics
  2. **Analysis View** - Interactive charts showing correlations
  3. **Report View** - Rendered Markdown strategic report
  4. **Location Details** - Drill-down per facility

  ---

  ## Implementation Steps

  ### Phase 1: Backend Foundation
  1. Set up FastAPI project structure
  2. Create Pydantic models for reservation and weather data
  3. Build mock data generator with realistic patterns
  4. Implement Open-Meteo API integration

  ### Phase 2: Analysis Engine
  1. Implement dead zone detection algorithm
  2. Build weather correlation analysis (find "Wind Wall" threshold)
  3. Create behavior-driven analysis (perfect weather low utilization)
  4. Calculate financial impact metrics

  ### Phase 3: API & Report
  1. Create REST endpoints for analysis data
  2. Build Markdown report generator
  3. Add chart data endpoints for frontend

  ### Phase 4: Frontend Setup
  1. Initialize Expo project
  2. Set up navigation and screens
  3. Create API client

  ### Phase 5: Frontend Features
  1. Build dashboard with location overview
  2. Implement charts using react-native-chart-kit or victory-native
  3. Create report viewer with markdown rendering
  4. Add location drill-down screens

  ---

  ## Dependencies

  ### Backend (`requirements.txt`)
  - fastapi
  - uvicorn
  - pydantic
  - httpx (for Open-Meteo API calls)
  - pandas (for data analysis)
  - numpy

  ### Frontend (`package.json`)
  - expo
  - react-native
  - @react-navigation/native
  - react-native-chart-kit or victory-native

  ---

  ## Verification

  1. **Backend**: Run `uvicorn main:app --reload` and test endpoints via `/docs`
  2. **Frontend**: Run `npx expo start` and test on web/iOS simulator/Android
  3. **Integration**: Verify frontend fetches and displays analysis data
  4. **Report**: Confirm Markdown report generates with all required sections
