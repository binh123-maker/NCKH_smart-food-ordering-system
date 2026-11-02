import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, MinMaxScaler, OneHotEncoder
from sklearn.metrics.pairwise import cosine_similarity
from pathlib import Path

class FoodFeaturePipeline:
    """
    Transforms raw food attributes into a dense and normalized numerical feature vector.
    Features combined:
    1. Ingredients TF-IDF representation (sublinear_tf=True)
    2. Nutrition values: Calories, Protein, Fat, Carbs (StandardScaler)
    3. Price (MinMaxScaler)
    4. Food Category (OneHotEncoder)
    5. Dietary tags (Multi-Hot binary vector)
    """
    def __init__(self):
        self.tfidf = TfidfVectorizer(max_features=40, sublinear_tf=True, token_pattern=r"(?u)\b\w+\b")
        self.nutrition_scaler = StandardScaler()
        self.price_scaler = MinMaxScaler()
        self.category_ohe = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
        self.unique_tags = []
        self.food_ids = []
        self.feature_matrix = None
        self.cosine_sim_matrix = None

    def fit_transform(self, df_foods: pd.DataFrame) -> np.ndarray:
        self.food_ids = df_foods["id"].tolist()

        # 1. Ingredients TF-IDF
        ing_features = self.tfidf.fit_transform(df_foods["ingredients"].fillna("")).toarray()

        # 2. Nutrition Normalization
        nutrition_cols = ["calories", "protein", "fat", "carbohydrates"]
        nutrition_features = self.nutrition_scaler.fit_transform(df_foods[nutrition_cols].values)

        # 3. Price Normalization
        price_features = self.price_scaler.fit_transform(df_foods[["price"]].values)

        # 4. Category One-Hot Encoding
        category_features = self.category_ohe.fit_transform(df_foods[["category_id"]].values)

        # 5. Dietary Tags Multi-Hot Encoding
        all_tags = set()
        for tags in df_foods["dietary_tags"].dropna():
            for t in tags.split(","):
                all_tags.add(t.strip())
        self.unique_tags = sorted(list(all_tags))
        
        tag_matrix = np.zeros((len(df_foods), len(self.unique_tags)), dtype=float)
        for i, tags in enumerate(df_foods["dietary_tags"]):
            if pd.notna(tags):
                for t in tags.split(","):
                    t = t.strip()
                    if t in self.unique_tags:
                        tag_matrix[i, self.unique_tags.index(t)] = 1.0

        # Weighted combination of feature spaces
        # Nutrition and ingredients carry highest weight for taste and health matching
        w_ing = 1.2
        w_nutr = 1.5
        w_price = 0.8
        w_cat = 1.2
        w_tag = 1.0

        self.feature_matrix = np.hstack([
            ing_features * w_ing,
            nutrition_features * w_nutr,
            price_features * w_price,
            category_features * w_cat,
            tag_matrix * w_tag,
        ])

        # Compute Item-Item Cosine Similarity Matrix
        self.cosine_sim_matrix = cosine_similarity(self.feature_matrix)
        return self.feature_matrix

    def transform_query_features(
        self,
        category: str = None,
        calories: float = None,
        protein: float = None,
        fat: float = None,
        carbs: float = None,
        price: float = None,
        preferred_tags: list = None
    ) -> np.ndarray:
        """
        Creates a query feature vector for cold-start or hypothetical food matching.
        """
        ing_dummy = np.zeros((1, len(self.tfidf.get_feature_names_out())))
        
        nutr_raw = np.array([[
            calories if calories is not None else 500,
            protein if protein is not None else 25,
            fat if fat is not None else 15,
            carbs if carbs is not None else 50
        ]])
        nutr_norm = self.nutrition_scaler.transform(nutr_raw) * 1.5
        
        price_raw = np.array([[price if price is not None else 50000]])
        price_norm = self.price_scaler.transform(price_raw) * 0.8
        
        cat_raw = pd.DataFrame({"category_id": [category if category else "COM"]})
        cat_ohe = self.category_ohe.transform(cat_raw.values) * 1.2
        
        tag_vec = np.zeros((1, len(self.unique_tags)))
        if preferred_tags:
            for t in preferred_tags:
                if t in self.unique_tags:
                    tag_vec[0, self.unique_tags.index(t)] = 1.0
        tag_vec = tag_vec * 1.0
        
        return np.hstack([ing_dummy * 1.2, nutr_norm, price_norm, cat_ohe, tag_vec])


class InteractionMatrixBuilder:
    """
    Constructs User-Item interaction matrices from training records.
    Supports both raw ratings and composite engagement scores.
    """
    def __init__(self):
        self.user_to_idx = {}
        self.idx_to_user = {}
        self.item_to_idx = {}
        self.idx_to_item = {}

    def build_matrix(
        self,
        interactions_df: pd.DataFrame,
        user_list: list = None,
        item_list: list = None,
        value_col: str = "composite_score"
    ) -> tuple[np.ndarray, dict, dict]:
        unique_users = user_list if user_list is not None else sorted(interactions_df["user_id"].unique())
        unique_items = item_list if item_list is not None else sorted(interactions_df["food_id"].unique())

        self.user_to_idx = {u: i for i, u in enumerate(unique_users)}
        self.idx_to_user = {i: u for i, u in enumerate(unique_users)}
        self.item_to_idx = {m: i for i, m in enumerate(unique_items)}
        self.idx_to_item = {i: m for i, m in enumerate(unique_items)}

        n_users = len(unique_users)
        n_items = len(unique_items)
        matrix = np.zeros((n_users, n_items), dtype=float)

        for _, row in interactions_df.iterrows():
            u = row["user_id"]
            m = row["food_id"]
            if u in self.user_to_idx and m in self.item_to_idx:
                u_idx = self.user_to_idx[u]
                m_idx = self.item_to_idx[m]
                matrix[u_idx, m_idx] = float(row[value_col])

        return matrix, self.user_to_idx, self.item_to_idx

