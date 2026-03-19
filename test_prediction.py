import joblib
import numpy as np

model = joblib.load(r'c:\Users\srjis\OneDrive\Documents\Desktop\projects\RainShield\ml-service\model.joblib')
features = np.array([[0, 25, 60, 5]])
prediction = model.predict(features)[0]
print(f"Prediction for [0, 25, 60, 5]: {prediction}")
