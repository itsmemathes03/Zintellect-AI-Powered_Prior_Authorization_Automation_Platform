from rank_bm25 import BM25Okapi

from app.services.embeddings.embedding_service import (
    generate_query_embedding
)

from app.services.retrieval.vector_db_service import (
    search_policy_chunks
)


# ==========================================
# TOKENIZER
# ==========================================

def tokenize(text):

    return text.lower().split()


# ==========================================
# BM25 RETRIEVAL
# ==========================================

def bm25_search(
        query,
        chunks,
        top_k=5
):

    if not chunks:
        return []

    corpus = [

        tokenize(
            chunk["chunk_text"]
        )

        for chunk in chunks
    ]

    bm25 = BM25Okapi(
        corpus
    )

    tokenized_query = tokenize(
        query
    )

    scores = bm25.get_scores(
        tokenized_query
    )

    ranked = sorted(

        zip(
            chunks,
            scores
        ),

        key=lambda x: x[1],

        reverse=True
    )

    results = []

    for chunk, score in ranked[:top_k]:

        item = chunk.copy()

        item["bm25_score"] = (
            float(score)
        )

        results.append(
            item
        )

    return results


# ==========================================
# VECTOR RETRIEVAL
# ==========================================

def vector_search(
        query,
        top_k=5
):

    query_embedding = generate_query_embedding(
        query
    )

    results = search_policy_chunks(

        query_embedding,

        top_k
    )

    return results


# ==========================================
# RECIPROCAL RANK FUSION
# ==========================================

def reciprocal_rank_fusion(

        bm25_results,

        vector_results,

        k=60
):

    scores = {}

    chunk_map = {}

    # ----------------------------------
    # BM25
    # ----------------------------------

    for rank, chunk in enumerate(
            bm25_results
    ):

        chunk_id = chunk["chunk_id"]

        score = 1 / (
            k + rank + 1
        )

        scores[chunk_id] = (
            scores.get(
                chunk_id,
                0
            ) + score
        )

        chunk_map[
            chunk_id
        ] = chunk

    # ----------------------------------
    # VECTOR RESULTS
    # ----------------------------------

    if vector_results:

        documents = vector_results.get(
            "documents",
            [[]]
        )[0]

        metadatas = vector_results.get(
            "metadatas",
            [[]]
        )[0]

        ids = vector_results.get(
            "ids",
            [[]]
        )[0]

        for rank, (
                chunk_id,
                text,
                metadata
        ) in enumerate(

            zip(
                ids,
                documents,
                metadatas
            )
        ):

            score = 1 / (
                k + rank + 1
            )

            scores[
                chunk_id
            ] = (
                scores.get(
                    chunk_id,
                    0
                ) + score
            )

            chunk_map[
                chunk_id
            ] = {

                "chunk_id":
                    chunk_id,

                "chunk_text":
                    text,

                **metadata
            }

    # ----------------------------------
    # FINAL SORT
    # ----------------------------------

    ranked = sorted(

        scores.items(),

        key=lambda x: x[1],

        reverse=True
    )

    final_results = []

    for chunk_id, score in ranked:

        chunk = chunk_map[
            chunk_id
        ]

        chunk[
            "rrf_score"
        ] = float(score)

        final_results.append(
            chunk
        )

    return final_results


# ==========================================
# HYBRID RETRIEVAL
# ==========================================

def hybrid_retrieve(

        query,

        policy_chunks,

        top_k=5
):

    # BM25
    bm25_results = bm25_search(

        query,

        policy_chunks,

        top_k
    )

    # Vector Search
    vector_results = vector_search(

        query,

        top_k
    )

    # RRF
    final_results = reciprocal_rank_fusion(

        bm25_results,

        vector_results
    )

    return final_results[:top_k]

# ==========================================
# BACKWARD COMPATIBILITY
# ==========================================

def create_query_embedding(
        query
):

    return generate_query_embedding(
        query
    )