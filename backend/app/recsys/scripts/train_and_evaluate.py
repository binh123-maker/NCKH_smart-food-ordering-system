import os
import sys
import json
import time
from pathlib import Path
import pandas as pd
import joblib

# Ensure root and backend directories are in python path
FILE_PATH = Path(__file__).resolve()
PROJECT_ROOT = FILE_PATH.parents[4] # D:\NCKH
BACKEND_ROOT = FILE_PATH.parents[3] # D:\NCKH\backend
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_ROOT))

from backend.app.recsys.config import (
    RAW_DATA_DIR,
    PROCESSED_DATA_DIR,
    SERIALIZED_DIR,
    EVALUATION_DIR,
    CURRENT_MODEL_VERSION,
)
from backend.app.recsys.pipelines.split import train_test_split_by_user
from backend.app.recsys.models.content_based import ContentBasedRecommender
from backend.app.recsys.models.collaborative import CollaborativeFilteringRecommender
from backend.app.recsys.models.hybrid import HybridRecommender
from backend.app.recsys.evaluation.evaluator import PopularityBaselineRecommender, RecSysBenchmark

def run_experiment():
    print("=" * 70)
    print("STARTING SCIENTIFIC RECOMMENDATION ENGINE TRAINING & EVALUATION")
    print(f"Model Version: {CURRENT_MODEL_VERSION}")
    print("=" * 70)

    # 1. Load Data
    foods_path = RAW_DATA_DIR / "foods.csv"
    users_path = RAW_DATA_DIR / "users.csv"
    interactions_path = RAW_DATA_DIR / "interactions.csv"

    if not (foods_path.exists() and users_path.exists() and interactions_path.exists()):
        raise FileNotFoundError("Raw datasets not found. Run generate_research_dataset.py first.")

    foods_df = pd.read_csv(foods_path)
    users_df = pd.read_csv(users_path)
    interactions_df = pd.read_csv(interactions_path)

    print(f"Loaded: {len(foods_df)} foods, {len(users_df)} users, {len(interactions_df)} interactions.")

    # 2. Train / Test Split
    print("\nSplitting interactions (80% Train, 20% Test stratified by user)...")
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    train_df, test_df = train_test_split_by_user(interactions_df, test_ratio=0.20, min_interactions=5)

    train_df.to_csv(PROCESSED_DATA_DIR / "train_interactions.csv", index=False)
    test_df.to_csv(PROCESSED_DATA_DIR / "test_interactions.csv", index=False)
    print(f"Split complete: Train set = {len(train_df)} rows, Test set = {len(test_df)} rows.")

    # 3. Model Initialization
    print("\nInitializing candidate models...")
    pop_model = PopularityBaselineRecommender()
    cbf_model = ContentBasedRecommender()
    cf_model = CollaborativeFilteringRecommender()
    hybrid_model = HybridRecommender()

    # 4. Training (Fitting)
    print("Fitting models on training split...")
    t0 = time.time()
    pop_model.fit(train_df, foods_df)
    cbf_model.fit(train_df, foods_df)
    cf_model.fit(train_df, foods_df)
    hybrid_model.fit(train_df, foods_df, users_df=users_df)
    print(f"Training completed in {time.time() - t0:.2f} seconds.")

    # 5. Comparative Evaluation
    print("\nEvaluating all models on the identical test split...")
    benchmark = RecSysBenchmark(
        test_df=test_df,
        total_catalog_size=len(foods_df),
        k_values=[5, 10]
    )

    models_to_evaluate = [pop_model, cbf_model, cf_model, hybrid_model]
    df_results = benchmark.compare_models(models_to_evaluate)

    print("\n" + "=" * 80)
    print("EMPIRICAL EVALUATION RESULTS TABLE")
    print("=" * 80)
    print(df_results.to_string(index=False))
    print("=" * 80)

    # 6. Save Evaluation Results
    EVALUATION_DIR.mkdir(parents=True, exist_ok=True)
    csv_eval_path = EVALUATION_DIR / "evaluation_results.csv"
    json_eval_path = EVALUATION_DIR / "evaluation_results.json"

    df_results.to_csv(csv_eval_path, index=False)
    
    results_dict = {
        "model_version": CURRENT_MODEL_VERSION,
        "evaluated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "dataset_summary": {
            "num_foods": len(foods_df),
            "num_users": len(users_df),
            "num_train_interactions": len(train_df),
            "num_test_interactions": len(test_df),
            "evaluated_test_users": len(benchmark.user_ground_truth),
        },
        "metrics_table": df_results.to_dict(orient="records"),
    }
    with open(json_eval_path, "w", encoding="utf-8") as f:
        json.dump(results_dict, f, indent=2, ensure_ascii=False)

    print(f"\nEvaluation metrics saved to:\n- {csv_eval_path}\n- {json_eval_path}")

    # 7. Model Serialization
    SERIALIZED_DIR.mkdir(parents=True, exist_ok=True)
    print("\nSerializing trained models...")
    joblib.dump(hybrid_model, SERIALIZED_DIR / "hybrid_model.joblib")
    joblib.dump(cbf_model, SERIALIZED_DIR / "cbf_model.joblib")
    joblib.dump(cf_model, SERIALIZED_DIR / "cf_model.joblib")

    # Save model metadata
    model_metadata = {
        "model_version": CURRENT_MODEL_VERSION,
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "n_foods": len(foods_df),
        "n_users": len(users_df),
        "feature_dim": hybrid_model.cbf.pipeline.feature_matrix.shape[1],
        "hybrid_weights": {
            "cbf": hybrid_model.cbf_weight,
            "cf": hybrid_model.cf_weight
        },
        "evaluation_metrics": df_results.set_index("Model").to_dict(orient="index")
    }
    with open(SERIALIZED_DIR / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2, ensure_ascii=False)

    print(f"Models successfully serialized into {SERIALIZED_DIR}")
    print("\nEXPERIMENT FINISHED SUCCESSFULLY!")
    return df_results

if __name__ == "__main__":
    run_experiment()
