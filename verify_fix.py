import joblib
import numpy as np

model = joblib.load(r'c:\Users\srjis\OneDrive\Documents\Desktop\projects\RainShield\ml-service\model.joblib')
# New default: [rainfall, temp, humidity, wind]
features = np.array([[0, 30, 60, 5]])
prediction = model.predict(features)[0]
print(f"Prediction for [0, 30, 60, 5]: {prediction}")
