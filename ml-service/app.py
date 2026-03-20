from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Load the model
model_path = os.path.join(os.path.dirname(__file__), 'model.joblib')
if os.path.exists(model_path):
    model = joblib.load(model_path)
else:
    model = None
    print("Warning: model.joblib not found. Run train_model.py first.")

@app.route('/predict-risk', methods=['POST'])
def predict_risk():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    data = request.json
    try:
        rainfall = data.get('rainfall', 0)
        temperature = data.get('temperature', 25)
        humidity = data.get('humidity', 60)
        wind_speed = data.get('wind_speed', 5)
        
        # Prepare input for prediction
        features = np.array([[rainfall, temperature, humidity, wind_speed]])
        predicted_earnings = float(model.predict(features)[0])
        
        # Risk Logic
        # If predicted_earnings < 400 → HIGH RISK → payout ₹300
        # If predicted_earnings between 400 and 700 → MEDIUM RISK → payout ₹150
        # If predicted_earnings > 700 → LOW RISK → no payout
        
        risk_level = "LOW"
        payout_amount = 0
        
        if predicted_earnings < 400:
            risk_level = "HIGH"
            payout_amount = 300
        elif 400 <= predicted_earnings <= 600:
            risk_level = "MEDIUM"
            payout_amount = 150
            
        return jsonify({
            "predicted_earnings": round(predicted_earnings, 2),
            "risk_level": "LOW" if predicted_earnings > 600 else risk_level,
            "recommended_payout": 0 if predicted_earnings > 600 else payout_amount
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    # Use 0.0.0.0 and dynamic port for cloud deployment (Render/Railway)
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
