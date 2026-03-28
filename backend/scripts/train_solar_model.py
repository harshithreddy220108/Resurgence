import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib

def generate_historical_data(num_samples=3000):
    np.random.seed(42)
    # Generate random weather and panel characteristics
    panel_kw = np.random.uniform(1.0, 15.0, num_samples)
    temp_max_c = np.random.uniform(-10.0, 45.0, num_samples)
    sunshine_hours = np.random.uniform(0.0, 14.0, num_samples)
    cloud_cover_pct = np.random.uniform(0.0, 100.0, num_samples)
    
    y_kwh = []
    for i in range(num_samples):
        # Base generation
        base_gen = panel_kw[i] * sunshine_hours[i]
        
        # Cloud penalty: up to 75% reduction
        cloud_penalty = 1.0 - (cloud_cover_pct[i] / 100.0) * 0.75
        
        # Temp penalty: high heat reduces efficiency (0.4% per deg above 25C)
        temp_penalty = 1.0
        if temp_max_c[i] > 25:
            temp_penalty = 1.0 - (temp_max_c[i] - 25) * 0.004
            
        real_base = base_gen * cloud_penalty * temp_penalty
        
        # Add random noise (representing variance like shading, dust, etc)
        noise = np.random.normal(0, real_base * 0.1) # 10% realistic variance
        final_gen = max(0.0, real_base + noise)
        y_kwh.append(final_gen)
        
    df = pd.DataFrame({
        "panel_kw": panel_kw,
        "temp_max_c": temp_max_c,
        "sunshine_hours": sunshine_hours,
        "cloud_cover_pct": cloud_cover_pct,
        "target_kwh": y_kwh
    })
    return df

def train_and_save_model():
    print("Generating synthetic historical solar data (3000 records)...")
    df = generate_historical_data()
    
    X = df[["panel_kw", "temp_max_c", "sunshine_hours", "cloud_cover_pct"]]
    y = df["target_kwh"]
    
    # Split dataset
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForestRegressor...")
    model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model Performance -> MSE: {mse:.2f}, R2 Score: {r2:.4f}")
    
    # Save Model into backend/ai
    ai_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ai_pkg_dir = os.path.join(ai_dir, "ai")
    os.makedirs(ai_pkg_dir, exist_ok=True)
    
    model_path = os.path.join(ai_pkg_dir, "solar_model.joblib")
    joblib.dump(model, model_path)
    print(f"Model successfully saved to: {model_path}")

if __name__ == "__main__":
    train_and_save_model()
