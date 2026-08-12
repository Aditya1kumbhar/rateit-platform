import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, roc_auc_score, brier_score_loss, roc_curve, auc
from sklearn.model_selection import GroupKFold, cross_val_predict
from sklearn.calibration import calibration_curve
import lightgbm as lgb
import matplotlib.pyplot as plt
import warnings

warnings.filterwarnings('ignore')

def main():
    print("Loading data...")
    df = pd.read_csv('overtake_opportunities_2026.csv')
    
    # Target
    y = df['pass_completed'].astype(int)
    groups = df['round']
    
    # Features
    num_features = ['gap_at_detection_s', 'speed_trap_delta', 'tyre_age_behind', 'tyre_age_ahead']
    cat_features = ['compound_behind', 'compound_ahead', 'track_energy_class', 'override_available']
    
    X = df[num_features + cat_features].copy()
    
    # Preprocessing
    num_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    cat_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_transformer, num_features),
            ('cat', cat_transformer, cat_features)
        ])
        
    # Models
    models = {
        'Logistic Regression': Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42))
        ]),
        'LightGBM': Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', lgb.LGBMClassifier(n_estimators=100, class_weight='balanced', random_state=42, verbose=-1))
        ])
    }
    
    cv = GroupKFold(n_splits=5)
    
    fig, ax = plt.subplots(figsize=(8, 8))
    ax.plot([0, 1], [0, 1], "k:", label="Perfectly calibrated")
    
    for name, model in models.items():
        print(f"\nEvaluating {name} using GroupKFold (grouped by race round)...")
        # Get out-of-fold probabilities
        y_prob = cross_val_predict(model, X, y, groups=groups, cv=cv, method='predict_proba')[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)
        
        acc = accuracy_score(y, y_pred)
        roc_auc = roc_auc_score(y, y_prob)
        brier = brier_score_loss(y, y_prob)
        
        print(f"  Accuracy: {acc:.4f}")
        print(f"  AUC:      {roc_auc:.4f}")
        print(f"  Brier:    {brier:.4f}")
        
        fraction_of_positives, mean_predicted_value = calibration_curve(y, y_prob, n_bins=10)
        ax.plot(mean_predicted_value, fraction_of_positives, "s-", label=f"{name} (AUC: {roc_auc:.2f})")
        
    ax.set_ylabel("Fraction of positives (True Pass Rate)")
    ax.set_xlabel("Mean predicted probability")
    ax.set_title("Calibration Curve - Overtake Success Probability")
    ax.legend(loc="lower right")
    ax.grid(True, linestyle='--', alpha=0.7)
    
    plt.tight_layout()
    plt.savefig('calibration_curve.png', dpi=300)
    print("\nSaved calibration_curve.png")

if __name__ == '__main__':
    main()
