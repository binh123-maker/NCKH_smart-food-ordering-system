import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "models"
SERIALIZED_DIR = MODELS_DIR / "serialized"
EVALUATION_DIR = BASE_DIR / "evaluation"

# Recommendation Hyperparameters
TOP_K_DEFAULT = 10
EVAL_K_LIST = [5, 10]
RELEVANCE_THRESHOLD = 3.5  # Interaction score >= 3.5 is considered positive/relevant

# Collaborative Filtering
CF_SVD_COMPONENTS = 15
CF_SVD_RANDOM_STATE = 42

# Hybrid Model Weights
HYBRID_CBF_WEIGHT = 0.55
HYBRID_CF_WEIGHT = 0.45
COLD_START_INTERACTION_THRESHOLD = 3

# Nutrition & Budget Constraint Re-ranking Weights
NUTRITION_PENALTY_FACTOR = 0.25
BUDGET_PENALTY_FACTOR = 0.30

# Model Version
CURRENT_MODEL_VERSION = "v2.0.0-scientific-hybrid"

