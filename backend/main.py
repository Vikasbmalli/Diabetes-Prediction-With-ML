
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load the trained ML model
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "diabetes_model.joblib"

model = joblib.load(MODEL_PATH)

FEATURES = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
]

app = FastAPI(title="Diabetes Prediction API")

# Allow requests from the local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class PatientData(BaseModel):
    Pregnancies: int = Field(ge=0, le=30)
    Glucose: float = Field(gt=0, le=500)
    BloodPressure: float = Field(gt=0, le=300)
    SkinThickness: float = Field(ge=0, le=150)
    Insulin: float = Field(ge=0, le=3000)
    BMI: float = Field(gt=0, le=100)
    DiabetesPedigreeFunction: float = Field(ge=0, le=10)
    Age: int = Field(ge=1, le=120)


@app.get("/")
def home():
    return {
        "message": "Diabetes Prediction API is running"
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(data: PatientData):
    patient = pd.DataFrame(
        [data.model_dump()],
        columns=FEATURES,
    )

    # Apply the same zero-as-missing handling used in training.
    zero_missing_columns = [
        "Glucose",
        "BloodPressure",
        "SkinThickness",
        "Insulin",
        "BMI",
    ]

    patient[zero_missing_columns] = patient[
        zero_missing_columns
    ].replace(0, float("nan"))

    prediction = int(model.predict(patient)[0])
    probability = float(model.predict_proba(patient)[0][1])

    return {
        "prediction": prediction,
        "result": (
            "Higher predicted likelihood"
            if prediction == 1
            else "Lower predicted likelihood"
        ),
        "model_probability": round(probability, 4),
        "disclaimer": (
            "Educational estimate only; this is not "
            "a medical diagnosis."
        ),
    }
