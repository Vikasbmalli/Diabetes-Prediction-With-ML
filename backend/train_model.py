
from pathlib import Path

import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parent / "diabetes.csv"
MODEL_PATH = BASE_DIR / "diabetes_model.joblib"

# Load and validate the dataset
df = pd.read_csv(DATA_PATH)

required_columns = [
    "Pregnancies", "Glucose", "BloodPressure",
    "SkinThickness", "Insulin", "BMI",
    "DiabetesPedigreeFunction", "Age", "Outcome"
]

missing = set(required_columns) - set(df.columns)
if missing:
    raise ValueError(f"Missing columns: {missing}")

df = df[required_columns].apply(pd.to_numeric, errors="raise")
df = df.dropna(subset=["Outcome"])

if not df["Outcome"].isin([0, 1]).all():
    raise ValueError("Outcome must contain only 0 and 1.")

X = df.drop(columns="Outcome").copy()
y = df["Outcome"].astype(int)

# In this dataset, zero in these measurements can mean
# the measurement was not recorded.
zero_missing_columns = [
    "Glucose", "BloodPressure",
    "SkinThickness", "Insulin", "BMI"
]
X[zero_missing_columns] = X[zero_missing_columns].replace(0, float("nan"))

# Split before fitting preprocessing steps
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

model = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
    ("classifier", LogisticRegression(max_iter=1000))
])

model.fit(X_train, y_train)

predictions = model.predict(X_test)

print("Dataset shape:", df.shape)
print(f"Test accuracy: {accuracy_score(y_test, predictions):.2%}")
print("\nClassification report:")
print(classification_report(y_test, predictions, zero_division=0))

joblib.dump(model, MODEL_PATH)
print(f"\nModel saved to: {MODEL_PATH}")
