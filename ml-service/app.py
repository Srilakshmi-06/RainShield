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
        baseline = 800
        loss_percentage = round(max(0, (1 - predicted_earnings / baseline) * 100), 2)
        
        risk_level = "LOW"
        payout_amount = 0
        
        if loss_percentage > 40:
            risk_level = "HIGH"
            payout_amount = 300
        elif loss_percentage > 20:
            risk_level = "MEDIUM"
            payout_amount = 150
            
        return jsonify({
            "predicted_earnings": round(predicted_earnings, 2),
            "loss_percentage": loss_percentage,
            "risk_level": risk_level,
            "recommended_payout": payout_amount
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    # Use 0.0.0.0 and dynamic port for cloud deployment (Render/Railway)
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
