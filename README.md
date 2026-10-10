# 🩺 Diabetes Prediction System Using Machine Learning

A full-stack machine learning application built with Python, Scikit-learn, FastAPI, and React to predict the diabetes target class from health-related input measurements.

## 📌 Project Overview

This project demonstrates the integration of a machine learning classification model with a web application. Users submit health-related measurements through an interactive frontend, and a FastAPI backend returns the prediction produced by a saved Logistic Regression model.

This project is intended for educational and demonstration purposes, not medical diagnosis.

## ✨ Features

- Logistic Regression classification using Scikit-learn.
- Dataset processing with Pandas and NumPy.
- Model training and test-set evaluation.
- REST API built using FastAPI.
- Interactive frontend built with React and Vite.
- Binary prediction output (`0` or `1`).
- Saved model for inference without retraining.
- Prediction history and analytics where implemented.

## 🛠️ Technology Stack

| Area | Technology |
|---|---|
| Programming | Python, JavaScript |
| Machine Learning | Scikit-learn |
| Data Processing | Pandas, NumPy |
| Backend | FastAPI, Uvicorn |
| Frontend | React, Vite |
| Styling | CSS |
| Model Storage | Joblib |
| Version Control | Git, GitHub |

## 📊 Dataset

The project uses the Pima Indians Diabetes dataset, containing 768 records and 9 columns in the dataset version used here.

Input features:

- Pregnancies
- Glucose
- BloodPressure
- SkinThickness
- Insulin
- BMI
- DiabetesPedigreeFunction
- Age

The target column is `Outcome`.

Check the dataset's licensing and redistribution terms before sharing it publicly.

## 🤖 Machine Learning Workflow

1. Load `diabetes.csv`.
2. Separate input features from the `Outcome` target.
3. Prepare the data using the implemented preprocessing steps.
4. Split the dataset into training and testing subsets.
5. Train the Logistic Regression classifier.
6. Evaluate performance on held-out test data.
7. Save the fitted model as `diabetes_model.joblib`.
8. Load the saved model in the FastAPI backend.
9. Return predictions to the React frontend.

A previous training run reported approximately **70.78% test accuracy**. This result should be reproduced before being treated as the final evaluation. Accuracy alone does not establish clinical reliability.

## 📁 Project Structure

```text
diabetes-prediction-ml/
├── backend/
│   ├── main.py
│   ├── train_model.py
│   ├── requirements.txt
│   └── diabetes_model.joblib
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   └── vite.config.js
├── demo/
│   └── diabetes-demo.mp4
├── diabetes.csv
├── .gitignore
└── README.md
```

The `demo/` folder is optional if the video is hosted externally.

## 💻 Installation and Setup

### Prerequisites

- Python 3.10 or another version supported by the dependencies
- Node.js and npm
- Git

### 1. Clone the repository

Replace `YOUR_GITHUB_USERNAME` with your GitHub username.

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/diabetes-prediction-ml.git
cd diabetes-prediction-ml
```

### 2. Install backend dependencies

From the project root, run these commands in Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

### 3. Train the model (optional)

If the saved model is unavailable or you want to retrain it:

```powershell
python -m backend.train_model
```

Confirm that the script completes successfully and creates `backend/diabetes_model.joblib`.

### 4. Run the backend

From the project root:

```powershell
python -m uvicorn backend.main:app --reload --port 8000
```

API documentation: http://127.0.0.1:8000/docs

Keep this terminal running.

### 5. Run the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, commonly http://localhost:5173.

Keep both servers running while using the application.

## 🔌 Prediction Output

The model returns a binary classification:

- `0` — the model predicts the negative target class.
- `1` — the model predicts the positive target class.

These outputs are model predictions, not confirmed medical diagnoses. Refer to `/docs` for the actual API routes and request schema.

## 🚀 Future Improvements

- Compare additional classification algorithms.
- Add cross-validation and hyperparameter tuning.
- Evaluate precision, recall, F1-score, and a confusion matrix.
- Improve validation, accessibility, and error handling.
- Add automated tests and deployment support.
- Evaluate the model on appropriate independent datasets.

## ⚠️ Disclaimer

This project is intended for educational purposes only. It is not a clinically validated diagnostic tool and must not be used to make medical decisions. Consult a qualified healthcare professional for medical advice.

## 📄 License

A license has not yet been specified. Add an appropriate license before redistributing the project, and verify the dataset's terms.

---

**Built with Python, Scikit-learn, FastAPI, and React.**