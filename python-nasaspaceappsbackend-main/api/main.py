from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openaq import OpenAQ

app = FastAPI()
client = OpenAQ(api_key="421d3183b203d60430bad493a8ec7755db93e72a8e7a518e0ab29e069b836dcc")
coords_db = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Coords(BaseModel):
    latitude: float
    longitude: float

@app.get("/")
def root():
    return {"status": "ok", "message": "Air Quality API is running"}

@app.post("/coords")
def add_coords(coords: Coords):
    if coords_db:
        coords_db.pop()
    coords_db.append({"latitude": coords.latitude, "longitude": coords.longitude})
    return {"message": "Coordinates updated successfully", "coords": coords_db[-1]}

@app.post("/calculations")
def perform_calculations():
    if not coords_db:
        return {"aqi_data": {"AQI": 0, "Alert": "No Location"}, "count": 0}

    latest_coords = coords_db[-1]
    lat = latest_coords["latitude"]
    lon = latest_coords["longitude"]

    locations = client.locations.list(coordinates=(lat, lon), radius=5_000, limit=1)

    all_values = []

    for loc in locations.results:
        latest_data = client.locations.latest(loc.id)
        for item in latest_data.results:
            # Collect all pollutant values
            all_values.append(item.value)

    if not all_values:
        return {"aqi_data": {"AQI": 0, "Alert": "No Data"}, "count": len(coords_db)}

    max_value = max(all_values)

    # Determine alert
    if max_value <= 50:
        alert = "Healthy"
    elif max_value <= 100:
        alert = "Moderate"
    elif max_value <= 150:
        alert = "Unhealthy for Sensitive Groups"
    elif max_value <= 200:
        alert = "Unhealthy"
    elif max_value <= 300:
        alert = "Very Unhealthy"
    else:
        alert = "Hazardous"

    return {
        "aqi_data": {"AQI": max_value, "Alert": alert},
        "count": len(coords_db),
    }
    
    if __name__ == "__main__":
    uvicorn.run(
        "main:app",   
        host="0.0.0.0",
        port=8000,
        reload=True   
    )
