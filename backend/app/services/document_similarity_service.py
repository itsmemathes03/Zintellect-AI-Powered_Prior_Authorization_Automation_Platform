import os
import re
import hashlib
from typing import List, Dict
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from app.database.db import SessionLocal
from app.models.request_model import PriorAuthRequest
from app.models.uploaded_file_model import UploadedFile
from app.services.extraction_service import extract_text
from app.services.text_normalizer import normalize_text


def compute_file_hash(file_path: str) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def check_exact_duplicate(file_path: str) -> List[Dict]:
    db: Session = SessionLocal()
    try:
        file_hash = compute_file_hash(file_path)
        matches = (
            db.query(UploadedFile)
            .filter(
                UploadedFile.hash_value == file_hash,
                UploadedFile.processing_status != "Deleted",
            )
            .all()
        )
        results = []
        for m in matches:
            request = (
                db.query(PriorAuthRequest)
                .filter(PriorAuthRequest.id == m.request_id)
                .first()
            )
            results.append(
                {
                    "match_type": "exact",
                    "similarity": 1.0,
                    "matched_file": m.file_name,
                    "request_id": m.request_id,
                    "patient_name": request.patient_name if request else "Unknown",
                    "created_at": (
                        request.created_at.isoformat()
                        if request and request.created_at
                        else None
                    ),
                }
            )
        return results
    finally:
        db.close()


def extract_file_text(file_path: str) -> str:
    text = extract_text(file_path)
    return normalize_text(text)


def compute_text_similarity(texts: List[str]) -> np.ndarray:
    if len(texts) < 2:
        return np.array([[1.0]])
    vectorizer = TfidfVectorizer(
        analyzer="word",
        ngram_range=(1, 3),
        max_features=10000,
        stop_words="english",
    )
    tfidf_matrix = vectorizer.fit_transform(texts)
    similarity_matrix = cosine_similarity(tfidf_matrix)
    return similarity_matrix


def get_all_previous_extracted_texts(
    exclude_request_id: str | None = None,
) -> List[Dict]:
    db: Session = SessionLocal()
    try:
        query = db.query(PriorAuthRequest).filter(
            PriorAuthRequest.processing_stage == "Completed"
        )
        if exclude_request_id:
            query = query.filter(PriorAuthRequest.id != exclude_request_id)

        previous = []
        for req in query.all():
            if req.clinical_notes and len(req.clinical_notes.strip()) > 50:
                previous.append(
                    {
                        "request_id": req.id,
                        "patient_name": req.patient_name,
                        "procedure_code": req.procedure_code,
                        "diagnosis": req.diagnosis,
                        "text": normalize_text(req.clinical_notes),
                        "created_at": req.created_at,
                    }
                )
        return previous
    finally:
        db.close()


def check_similarity_against_existing(
    new_text: str,
    exclude_request_id: str | None = None,
    threshold: float = 0.7,
) -> List[Dict]:
    previous = get_all_previous_extracted_texts(exclude_request_id)
    if not previous or not new_text.strip():
        return []

    prev_texts = [p["text"] for p in previous]
    all_texts = [new_text] + prev_texts

    similarity_matrix = compute_text_similarity(all_texts)
    similarities = similarity_matrix[0][1:]

    flagged = []
    for i, sim in enumerate(similarities):
        if sim >= threshold:
            flagged.append(
                {
                    "match_type": "text_similarity",
                    "similarity": round(float(sim), 4),
                    "request_id": previous[i]["request_id"],
                    "patient_name": previous[i]["patient_name"],
                    "procedure_code": previous[i]["procedure_code"],
                    "diagnosis": previous[i]["diagnosis"],
                    "created_at": (
                        previous[i]["created_at"].isoformat()
                        if previous[i]["created_at"]
                        else None
                    ),
                }
            )

    flagged.sort(key=lambda x: x["similarity"], reverse=True)
    return flagged


def analyze_document_similarity(
    file_paths: List[str],
    exclude_request_id: str | None = None,
    threshold: float = 0.7,
) -> Dict:
    exact_duplicates = []
    text_similar_matches = []

    for fp in file_paths:
        exact_duplicates.extend(check_exact_duplicate(fp))

    combined_text = ""
    for fp in file_paths:
        text = extract_file_text(fp)
        if text:
            combined_text += text + "\n"

    combined_text = combined_text.strip()
    if combined_text:
        text_similar_matches = check_similarity_against_existing(
            combined_text, exclude_request_id, threshold
        )

    all_matches = exact_duplicates + text_similar_matches
    unique_matches = {}
    for m in all_matches:
        rid = m["request_id"]
        if (
            rid not in unique_matches
            or m["similarity"] > unique_matches[rid]["similarity"]
        ):
            unique_matches[rid] = m

    max_similarity = (
        max([m["similarity"] for m in unique_matches.values()])
        if unique_matches
        else 0.0
    )

    return {
        "has_duplicates": len(unique_matches) > 0,
        "max_similarity": max_similarity,
        "total_matches": len(unique_matches),
        "matches": list(unique_matches.values()),
        "is_suspected_duplicate": max_similarity >= threshold,
    }
