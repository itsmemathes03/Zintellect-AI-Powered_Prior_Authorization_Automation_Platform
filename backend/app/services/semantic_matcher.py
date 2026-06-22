from sentence_transformers import (
    SentenceTransformer,
    util
)
from sklearn.metrics.pairwise import cosine_similarity

# load model once
model = SentenceTransformer(
    'all-MiniLM-L6-v2'
)

def semantic_match(text1, text2):

    if not text1 or not text2:
        return 0

    emb1 = model.encode([text1])
    emb2 = model.encode([text2])

    similarity = cosine_similarity(
        emb1,
        emb2
    )[0][0]

    return float(similarity)