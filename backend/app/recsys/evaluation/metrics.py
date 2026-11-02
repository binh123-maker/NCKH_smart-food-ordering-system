import math
import numpy as np

def precision_at_k(recommended: list, relevant: set, k: int = 10) -> float:
    """
    Computes Precision@K.
    Proportion of recommended items in Top-K that are relevant to the user in the test set.
    """
    if k <= 0 or not relevant:
        return 0.0
    rec_k = recommended[:k]
    hits = sum(1 for item in rec_k if item in relevant)
    return hits / float(k)

def recall_at_k(recommended: list, relevant: set, k: int = 10) -> float:
    """
    Computes Recall@K.
    Proportion of relevant items in the test set that are successfully retrieved in Top-K.
    """
    if not relevant or k <= 0:
        return 0.0
    rec_k = recommended[:k]
    hits = sum(1 for item in rec_k if item in relevant)
    return hits / float(len(relevant))

def f1_score_at_k(p: float, r: float) -> float:
    """
    Harmonic mean of Precision@K and Recall@K.
    """
    if p + r == 0:
        return 0.0
    return (2.0 * p * r) / (p + r)

def ndcg_at_k(recommended: list, relevant: set, k: int = 10) -> float:
    """
    Computes Normalized Discounted Cumulative Gain (NDCG@K).
    Measures the ranking quality of recommended items with logarithmic position discounting.
    """
    if not relevant or k <= 0:
        return 0.0
    
    rec_k = recommended[:k]
    dcg = 0.0
    for idx, item in enumerate(rec_k):
        if item in relevant:
            rank = idx + 1
            dcg += 1.0 / math.log2(rank + 1)
            
    # Ideal DCG (all relevant items ranked at the top)
    ideal_hits = min(k, len(relevant))
    idcg = sum(1.0 / math.log2(i + 1) for i in range(1, ideal_hits + 1))
    
    if idcg == 0.0:
        return 0.0
    return dcg / idcg

def average_precision_at_k(recommended: list, relevant: set, k: int = 10) -> float:
    """
    Computes Average Precision at K (AP@K) for a single user query.
    Used to compute Mean Average Precision (MAP@K).
    """
    if not relevant or k <= 0:
        return 0.0
    
    rec_k = recommended[:k]
    hits = 0
    running_prec_sum = 0.0
    
    for idx, item in enumerate(rec_k):
        if item in relevant:
            hits += 1
            rank = idx + 1
            running_prec_sum += hits / float(rank)
            
    ideal_count = min(k, len(relevant))
    if ideal_count == 0:
        return 0.0
    return running_prec_sum / float(ideal_count)

def catalog_coverage(all_user_recommendations: list[list], total_items: int, k: int = 10) -> float:
    """
    Computes Catalog Coverage.
    Proportion of distinct items in the entire catalog recommended at least once in Top-K.
    """
    if total_items == 0:
        return 0.0
    
    unique_recommended = set()
    for rec_list in all_user_recommendations:
        for item in rec_list[:k]:
            unique_recommended.add(item)
            
    return len(unique_recommended) / float(total_items)

