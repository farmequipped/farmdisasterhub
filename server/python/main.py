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

# Setup SPI for MCP3008 ADC
spi = busio.SPI(clock=board.SCK, MISO=board.MISO, MOSI=board.MOSI)
cs = digitalio.DigitalInOut(board.D5)  # Chip select pin
mcp = MCP3008(spi, cs)

# Grove Air Quality Sensor connected to channel 0
airsense_channel = AnalogIn(mcp, 0)

temphumidsense = adafruit_dht.DHT11(board.A2)

VCC = 5.0           # Sensor supply voltage
RL = 10000          # Load resistor in Ohms (10k)
RO_CLEAN_AIR = 10000  # Measured Ro in clean air, adjust from calibration

# MQ135 curve constants for CO (from datasheet example)
A_CO = 110.47
B_CO = -2.862

# -----------------------------
# Configuration
# -----------------------------
MODEL_PATH = "natural_disaster_classifier.h5"
SERVER_URL = "http://localhost:3000/predict"  # change to your Node.js endpoint
INTERVAL_SECONDS = 60  # 1 minute


model = load_model(MODEL_PATH)
print("Model loaded successfully.")


scaler = StandardScaler()

def get_live_data():
    """
    Returns 1x3 NumPy array: [CO_ppm, Temp_C, Humidity_%]
    """
    try:
        # Read MQ135 voltage
        Vrl = airsense_channel.voltage
        Rs = ((VCC - Vrl) / Vrl) * RL
        ratio = Rs / RO_CLEAN_AIR

        # Calculate estimated CO in ppm
        ppm_CO = A_CO * (ratio ** B_CO)

        # Read temperature and humidity
        temp = temphumidsense.temperature
        humidity = temphumidsense.humidity

        return np.array([[ppm_CO, temp, humidity]])

    except Exception as e:
        print(f"Error reading sensors: {e}")
        return np.zeros((1, 3))


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