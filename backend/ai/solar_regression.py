import os
import joblib
import pandas as pd

# Load the trained model once when the module is imported
MODEL_PATH = os.path.join(os.path.dirname(__file__), "solar_model.joblib")
solar_model = None

if os.path.exists(MODEL_PATH):
    try:
        solar_model = joblib.load(MODEL_PATH)
        print("Successfully loaded Scikit-Learn Solar Model!")
    except Exception as e:
        print(f"Error loading solar AI model: {e}")

def predict_generation(panel_kw: float, weather_data: dict) -> float:
    """
    Predicts the total daily solar energy generation in kWh for a given panel size and weather.
    Uses the trained Scikit-Learn RandomForest model if available, otherwise falls back to physics simulation.
    """
    if panel_kw <= 0:
        return 0.0
        
    temp_c = weather_data.get("temp_max_c", 25.0)
    sunlight_hrs = weather_data.get("sunshine_hours", 10.0)
    cloud_pct = weather_data.get("cloud_cover_pct", 20.0)
    
    # AI ML Pipeline Path
    if solar_model is not None:
        try:
            # The model expects a DataFrame with features
            df = pd.DataFrame([{
                "panel_kw": panel_kw,
                "temp_max_c": temp_c,
                "sunshine_hours": sunlight_hrs,
                "cloud_cover_pct": cloud_pct
            }])
            y_pred = solar_model.predict(df)[0]
            return round(float(max(y_pred, 0.0)), 2)
        except Exception as e:
            print(f"AI inference failed: {e}. Falling back to physics model.")
            
    # Physics Fallback Path
    base_gen = panel_kw * sunlight_hrs
    cloud_penalty = 1.0 - (cloud_pct / 100.0) * 0.75
    
    temp_penalty = 1.0
    if temp_c > 25:
        temp_penalty = 1.0 - (temp_c - 25) * 0.004
        
    y_kwh = base_gen * cloud_penalty * temp_penalty
    return round(float(max(y_kwh, 0.0)), 2)

if __name__ == "__main__":
    # Test a prediction
    test_weather = {"temp_max_c": 32.0, "sunshine_hours": 12.0, "cloud_cover_pct": 10.0}
    test_panel = 8.5
    gen = predict_generation(test_panel, test_weather)
    print("\nTest Prediction:")
    print(f"Panel: {test_panel} kW")
    print(f"Weather: {test_weather}")
    print(f"Predicted Output: {gen} kWh")
