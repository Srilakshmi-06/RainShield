import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
import joblib
import io

# Dataset based on user requirements
data = """rainfall,temperature,humidity,wind_speed,deliveries,earnings
0,32,60,5,25,900
10,30,70,6,18,650
20,28,80,8,10,350
30,27,85,10,5,150
5,31,65,4,22,800
15,29,75,7,12,450
25,28,82,9,7,250
35,26,90,12,2,100"""

def train_model():
    # Read the data
    df = pd.read_csv(io.StringIO(data))
    
    # Features and Target
    X = df[['rainfall', 'temperature', 'humidity', 'wind_speed']]
    y = df['earnings']
    
    # Using Random Forest Regressor for better accuracy on small datasets
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Save the model
    joblib.dump(model, 'model.joblib')
    print("Model trained and saved as model.joblib")

if __name__ == "__main__":
    train_model()
