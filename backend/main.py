from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analysis_router, report_router

app = FastAPI(
    title="Golf Utilization & Weather Correlation API",
    description="""
    API for analyzing golf course utilization patterns and their correlation with weather conditions.

    ## Features
    - **Dead Zone Detection**: Identify periods of low utilization
    - **Weather Correlation**: Analyze how weather impacts bookings
    - **Wind Wall Analysis**: Find the wind speed threshold where bookings collapse
    - **Financial Impact**: Calculate revenue losses from underutilization
    - **Strategic Reports**: Generate Markdown reports with recommendations

    ## Booking Types
    - 9-Hole Rounds
    - 18-Hole Rounds
    - Driving Range (Outdoor)
    - Indoor Driving Range
    - Outdoor Putt-Putt
    - Indoor Putt-Putt
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analysis_router)
app.include_router(report_router)


@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "name": "Golf Utilization & Weather Correlation API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "locations": "/api/locations",
            "dead_zones": "/api/analysis/dead-zones",
            "weather_correlation": "/api/analysis/weather-correlation",
            "wind_threshold": "/api/analysis/wind-threshold",
            "financial_impact": "/api/analysis/financial-impact",
            "charts": "/api/charts/{chart_type}",
            "report": "/api/report"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
