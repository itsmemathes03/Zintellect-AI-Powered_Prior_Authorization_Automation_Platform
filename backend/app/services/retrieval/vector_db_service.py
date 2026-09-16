import os
import logging

logger = logging.getLogger(__name__)

# ==========================================
# CHROMA CLIENT — graceful degradation
# ==========================================

client = None
medical_collection = None
policy_collection = None

try:
    import chromadb
    from chromadb.config import Settings

    client = chromadb.PersistentClient(
        path=os.getenv("CHROMA_DB_PATH", "app/vector_db/chroma")
    )

    medical_collection = client.get_or_create_collection(name="medical_chunks")
    policy_collection = client.get_or_create_collection(name="policy_chunks")
except Exception as exc:
    logger.warning(
        f"ChromaDB unavailable ({type(exc).__name__}: {exc}). "
        "Vector search features will be disabled."
    )


# ==========================================
# STORE MEDICAL CHUNKS
# ==========================================


def store_medical_embeddings(embedded_chunks):
    if medical_collection is None:
        logger.warning("ChromaDB unavailable — skipping store_medical_embeddings")
        return

    for chunk in embedded_chunks:
        medical_collection.add(
            ids=[chunk["chunk_id"]],
            embeddings=[chunk["embedding"]],
            documents=[chunk["chunk_text"]],
            metadatas=[
                {
                    "request_id": str(chunk.get("request_id", "")),
                    "chunk_index": int(chunk.get("chunk_index", 0)),
                    "document_type": str(chunk.get("document_type", "")),
                }
            ],
        )


# ==========================================
# STORE POLICY CHUNKS
# ==========================================


def store_policy_embeddings(embedded_chunks):
    """
    Upsert (not add): combined with deterministic chunk IDs
    ({policy_id}_{content_hash}_{index} from policy_loader),
    re-matching the same policy is idempotent - no duplicate
    vectors accumulate across requests.
    """
    if policy_collection is None:
        logger.warning("ChromaDB unavailable — skipping store_policy_embeddings")
        return

    for chunk in embedded_chunks:
        policy_collection.upsert(
            ids=[chunk["chunk_id"]],
            embeddings=[chunk["embedding"]],
            documents=[chunk["chunk_text"]],
            metadatas=[
                {
                    "policy_id": str(chunk.get("policy_id", "")),
                    "chunk_index": int(chunk.get("chunk_index", 0)),
                    "document_type": str(chunk.get("document_type", "")),
                    "section_number": int(chunk.get("section_number", 0)),
                }
            ],
        )


# ==========================================
# MEDICAL SEARCH
# ==========================================


def search_medical_chunks(query_embedding, top_k=5):
    if medical_collection is None:
        return {"ids": [[]], "documents": [[]], "distances": [[]]}

    results = medical_collection.query(
        query_embeddings=[query_embedding], n_results=top_k
    )

    return results


# ==========================================
# POLICY SEARCH
# ==========================================


def search_policy_chunks(query_embedding, top_k=5):
    if policy_collection is None:
        return {"ids": [[]], "documents": [[]], "distances": [[]]}

    results = policy_collection.query(
        query_embeddings=[query_embedding], n_results=top_k
    )

    return results


# ==========================================
# FILTER BY REQUEST
# ==========================================


def search_request_chunks(request_id, query_embedding, top_k=5):
    if medical_collection is None:
        return {"ids": [[]], "documents": [[]], "distances": [[]]}

    results = medical_collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"request_id": request_id},
    )

    return results


# ==========================================
# FILTER BY POLICY
# ==========================================


def search_policy_by_id(policy_id, query_embedding, top_k=5):
    if policy_collection is None:
        return {"ids": [[]], "documents": [[]], "distances": [[]]}

    results = policy_collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"policy_id": policy_id},
    )

    return results


# ==========================================
# DELETE REQUEST EMBEDDINGS
# ==========================================


def delete_request_embeddings(request_id):
    if medical_collection is None:
        return
    medical_collection.delete(where={"request_id": request_id})


# ==========================================
# DELETE POLICY EMBEDDINGS
# ==========================================


def delete_policy_embeddings(policy_id):
    if policy_collection is None:
        return
    policy_collection.delete(where={"policy_id": policy_id})


# ==========================================
# COLLECTION STATS
# ==========================================


def get_collection_stats():
    if medical_collection is None or policy_collection is None:
        return {"medical_chunks": 0, "policy_chunks": 0, "chromadb_available": False}

    return {
        "medical_chunks": medical_collection.count(),
        "policy_chunks": policy_collection.count(),
        "chromadb_available": True,
    }
