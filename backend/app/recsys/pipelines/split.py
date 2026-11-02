import pandas as pd
import numpy as np
from pathlib import Path

def train_test_split_by_user(
    interactions_df: pd.DataFrame,
    test_ratio: float = 0.20,
    min_interactions: int = 5,
    random_state: int = 42
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Stratified temporal/random split per user.
    Guarantees every evaluated user has both historical training data and held-out test items.
    """
    np.random.seed(random_state)
    
    train_rows = []
    test_rows = []
    
    user_groups = interactions_df.groupby("user_id")
    for user_id, group in user_groups:
        n_items = len(group)
        if n_items < min_interactions:
            # Users with very few interactions are reserved for training
            train_rows.append(group)
            continue
            
        n_test = max(1, int(n_items * test_ratio))
        shuffled = group.sample(frac=1.0, random_state=random_state)
        
        test_part = shuffled.iloc[:n_test]
        train_part = shuffled.iloc[n_test:]
        
        test_rows.append(test_part)
        train_rows.append(train_part)
        
    train_df = pd.concat(train_rows).reset_index(drop=True)
    test_df = pd.concat(test_rows).reset_index(drop=True)
    
    return train_df, test_df

if __name__ == "__main__":
    from backend.app.recsys.config import RAW_DATA_DIR, PROCESSED_DATA_DIR
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    df = pd.read_csv(RAW_DATA_DIR / "interactions.csv")
    train_df, test_df = train_test_split_by_user(df, test_ratio=0.20)
    
    train_df.to_csv(PROCESSED_DATA_DIR / "train_interactions.csv", index=False)
    test_df.to_csv(PROCESSED_DATA_DIR / "test_interactions.csv", index=False)
    
    print(f"Split completed: Train={len(train_df)}, Test={len(test_df)}")

