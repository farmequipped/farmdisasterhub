import time
import numpy as np
import requests
from tensorflow.keras.models import load_model
from sklearn.preprocessing import StandardScaler

# -----------------------------
# Configuration
# -----------------------------
MODEL_PATH = "natural_disaster_classifier.h5"
SERVER_URL = "http://localhost:3000/predict"  # change to your Node.js endpoint
INTERVAL_SECONDS = 60  # 1 minute
FEATURE_NAMES = ['temperature', 'co2', 'humidity', 'wind_speed'] #change later


model = load_model(MODEL_PATH)
print("Model loaded successfully.")


scaler = StandardScaler()

def get_live_data(): # Replace with actual sensor data retrieval logic
    temperature = np.random.uniform(15, 45)
    co2 = np.random.uniform(350, 600)
    humidity = np.random.uniform(10, 90)
    wind_speed = np.random.uniform(0, 30)
    return np.array([[temperature, co2, humidity, wind_speed]])

# -----------------------------
# Main loop
# -----------------------------
while True:
    try:
        # Get live data
        X_live = get_live_data()

        # Scale features (use the same scaler as training if possible)
        X_live_scaled = scaler.fit_transform(X_live)  # Replace with saved scaler in real use

        # Predict
        predictions = model.predict(X_live_scaled)
        predicted_class = int(np.argmax(predictions, axis=1)[0])
        confidence = float(np.max(predictions))

        # Prepare payload
        payload = {
            "features": X_live.flatten().tolist(),
            "predicted_class": predicted_class,
            "confidence": confidence
        }

        # Post to Node.js server
        response = requests.post(SERVER_URL, json=payload)
        if response.status_code == 200:
            print(f"Posted prediction successfully: {payload}")
        else:
            print(f"Failed to post prediction: {response.status_code} {response.text}")

    except Exception as e:
        print(f"Error: {e}")

    # Wait for next interval
    time.sleep(INTERVAL_SECONDS)