# Golf Weather Insights

An application for analyzing golf course utilization patterns and their correlation with weather conditions.

## About This Project

This project explores a common challenge in the golf industry: understanding how weather impacts course utilization and revenue. Golf courses often experience "dead zones" - periods of low bookings that may be driven by weather conditions, customer behavior patterns, or a combination of both.

The application analyzes historical booking and weather data to:
- Identify the "wind wall" - the wind speed threshold where bookings sharply decline
- Correlate weather conditions (temperature, rain, wind) with utilization rates
- Detect behavioral patterns in dead zones unrelated to weather
- Calculate financial impact of underutilization
- Generate strategic recommendations for dynamic pricing and promotions

## Why This Project Exists

As a developer and designer, I wanted to explore Claude's capabilities by building an entire application using [Claude Code](https://github.com/anthropics/claude-code) exclusively. The goal was to test the limits of AI-assisted development - from initial architecture decisions to implementation details, debugging, and documentation.

This project serves as both a functional demo and an experiment in human-AI collaboration for software development.

## Features

- Dead zone detection (periods of low utilization)
- Weather correlation analysis
- Wind threshold analysis
- Financial impact calculations
- Strategic report generation

## Project Structure

```
weather-demo/
├── backend/         # FastAPI Python backend
├── frontend/        # Expo React Native app
├── docker-compose.yml
└── README.md
```

## Getting Started

### Local Development

You can run this project two ways:
1. **Manually** - Run the backend and frontend separately (recommended for development)
2. **Docker Compose** - Run both services in containers (see [Docker](#docker) section below)

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

#### Frontend

```bash
cd frontend
npm install
npx expo start
```

Press `w` for web, `i` for iOS simulator, or `a` for Android emulator.

### Docker

Run both services with Docker Compose:

```bash
docker compose up
```

- **Backend**: `http://localhost:8000`
- **Frontend (web)**: `http://localhost:8081`

> **Note:** The frontend is an Expo React Native app. For mobile development, run `npx expo start` directly on your machine to use the Expo Go app on your device. The Docker setup is primarily useful for running the web version.

## Acknowledgments

**Designed by Valerie Chapple**

All code in this project was written intentionally and exclusively using [Claude Code](https://github.com/anthropics/claude-code), Anthropic's CLI tool for AI-assisted development. From project scaffolding to API design, React Native components, and this README - Claude wrote the code while I provided direction, feedback, and design decisions.
