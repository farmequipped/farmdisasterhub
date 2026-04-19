import time
import numpy as np
import requests
from tensorflow.keras.models import load_model
from sklearn.preprocessing import StandardScaler
import board
import adafruit_dht
import busio
import digitalio
from adafruit_mcp3xxx.mcp3008 import MCP3008
from adafruit_mcp3xxx.analog_in import AnalogIn

# Configuration
MODEL_PATH = "natural_disaster_classifier.h5"
SERVER_URL = "http://localhost:3000/predict"  # this is node js endpoint on the same machine, adjust if different
INTERVAL_SECONDS = 60

# --------------------- Code Below is for Raspberry Pi with Grove Air Quality Sensor Replace with more specific sensors for better accuracy ---------------------
spi = busio.SPI(clock=board.SCK, MISO=board.MISO, MOSI=board.MOSI)
cs = digitalio.DigitalInOut(board.A0) 
mcp = MCP3008(spi, cs)

airsense_channel = AnalogIn(mcp, 0)

temphumidsense = adafruit_dht.DHT11(board.A2)
# --------------------------------------------------------------------------------------------------------------------------------------------------------------

model = load_model(MODEL_PATH)
print("Model loaded successfully.")

scaler = StandardScaler()

def get_live_data():
    """
    Returns 1x5 NumPy array:
    [CO, Formaldehyde, Acetone, Temp, Humidity]
    For Grove v1.3, gases are estimated from the single analog voltage.
    For more accurate readings use VOC-specific sensors for CO, HCHO, and Acetone example products: (ZE16B-CO, Sensirion SFA30, SGP40)
    """
    try:
        voltage = airsense_channel.voltage

        # Estimatations of each gas (dummy scaling, since sensor is general VOC) if using correct sensors, replace with actual readings per device documentation

        co = voltage * 10   
        formaldehyde = voltage * 5
        acetone = voltage * 2

        temp = temphumidsense.temperature
        humidity = temphumidsense.humidity

        return np.array([[co, formaldehyde, acetone, temp, humidity]])
    
    except Exception as e:
        print(f"Error reading sensors: {e}")
        return np.zeros((1, 5))


# Main loop
while True:
    try:
        X_live = get_live_data()

        X_live_scaled = scaler.fit_transform(X_live)  

        predictions = model.predict(X_live_scaled)
        predicted_class = int(np.argmax(predictions, axis=1)[0])
        confidence = float(np.max(predictions))

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