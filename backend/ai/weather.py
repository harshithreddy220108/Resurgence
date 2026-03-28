import requests
from datetime import datetime

# Open-Meteo allows free API usage without keys for non-commercial open-source uses.
# We are fetching weather data for a demo location (Austin, TX style climate).
# Variables: temperature_2m_max, temperature_2m_min, daylight_duration, sunshine_duration, cloud_cover_mean
WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"
BASE_LAT = 30.2672
BASE_LNG = -97.7431

def fetch_daily_weather(lat: float = BASE_LAT, lng: float = BASE_LNG) -> dict:
    """
    Fetches the current day's weather forecast for the specified coordinates.
    Returns a dictionary of features useful for solar generation prediction.
    """
    params = {
        "latitude": lat,
        "longitude": lng,
        "daily": ["temperature_2m_max", "daylight_duration", "sunshine_duration"],
        "hourly": ["cloud_cover"],
        "timezone": "auto"
    }
    
    try:
        response = requests.get(WEATHER_API_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Extract today's metrics
        daily = data.get("daily", {})
        hourly = data.get("hourly", {})
        
        # If today is the 0th index:
        temp_max = daily.get("temperature_2m_max", [25.0])[0]
        daylight_seconds = daily.get("daylight_duration", [43200])[0]
        sunshine_seconds = daily.get("sunshine_duration", [daylight_seconds])[0]
        
        # Calculate mean cloud cover from hourly data for today (first 24 hours)
        cloud_cover_values = hourly.get("cloud_cover", [])[:24]
        avg_cloud_cover = sum(cloud_cover_values) / len(cloud_cover_values) if cloud_cover_values else 0.0

        return {
            "temp_max_c": temp_max,
            "daylight_hours": daylight_seconds / 3600,
            "sunshine_hours": sunshine_seconds / 3600,
            "cloud_cover_pct": avg_cloud_cover
        }

    except Exception as e:
        print(f"Warning: Weather API failed ({e}). Returning fallback data.")
        return {
            "temp_max_c": 28.5,
            "daylight_hours": 13.5,
            "sunshine_hours": 10.2,
            "cloud_cover_pct": 14.5
        }

if __name__ == "__main__":
    weather = fetch_daily_weather()
    print("Fetched weather data:")
    for k, v in weather.items():
        print(f"  {k}: {round(v, 2)}")
