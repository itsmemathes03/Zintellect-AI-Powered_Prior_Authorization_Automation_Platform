from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from typing import List
import os
import uuid

from app.services.file_service import TEMP_DIR
from app.services.document_similarity_service import analyze_document_similarity
from app.services.auth_middleware import verify_jwt_token

router = APIRouter(prefix="/similarity", tags=["Document Similarity"])


@router.post("/check")
async def check_document_similarity(
    files: List[UploadFile] = File(...),
    exclude_request_id: str | None = Form(None),
    threshold: float = Form(0.7),
    payload: dict = Depends(verify_jwt_token),
):
    saved_paths = []
    try:
        check_id = str(uuid.uuid4())[:8]
        for file in files:
            temp_path = os.path.join(TEMP_DIR, f"sim_check_{check_id}_{file.filename}")
            with open(temp_path, "wb") as f:
                content = await file.read()
                f.write(content)
            saved_paths.append(temp_path)

        result = analyze_document_similarity(
            saved_paths,
            exclude_request_id=exclude_request_id,
            threshold=threshold,
        )

        return {"status": "Success", **result}

    except Exception as e:
        print("Similarity Check Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in saved_paths:
            if os.path.exists(p):
                os.remove(p)
