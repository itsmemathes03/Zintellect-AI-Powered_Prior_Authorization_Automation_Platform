import os
import shutil

from app.database.db import SessionLocal
from app.models.uploaded_file_model import UploadedFile
from app.services.virus_scan_service import scan_file
from app.services.encryption_service import generate_hash


# ==========================================
# TEMP DIRECTORY
# ==========================================

TEMP_DIR = "app/temp"

os.makedirs(
    TEMP_DIR,
    exist_ok=True
)


# ==========================================
# SAVE TEMP FILE
# ==========================================

def save_uploaded_file(
        file,
        request_id
):

    db = SessionLocal()

    try:

        # Create file path
        temp_path = (
            f"{TEMP_DIR}/"
            f"{request_id}_{file.filename}"
        )

        # Save uploaded file
        with open(
                temp_path,
                "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        # ----------------------------------
        # VIRUS SCAN
        # ----------------------------------

        scan_result = scan_file(
            temp_path
        )

        if not scan_result["safe"]:

            os.remove(temp_path)

            raise Exception(
                scan_result["reason"]
            )

        # ----------------------------------
        # GENERATE FILE HASH
        # ----------------------------------

        hash_value = generate_hash(
            temp_path
        )

        # ----------------------------------
        # STORE FILE METADATA
        # ----------------------------------

        uploaded_file = UploadedFile(

            request_id=request_id,

            file_name=file.filename,

            file_type=file.filename.split(".")[-1],

            hash_value=hash_value
        )

        db.add(uploaded_file)
        db.commit()
        db.refresh(uploaded_file)

        # Return saved file path
        return {

            "metadata": uploaded_file,

            "temp_path": temp_path
        }

    finally:

        db.close()


# ==========================================
# DELETE TEMP FILE
# ==========================================

def delete_temp_file(
        temp_path
):

    if os.path.exists(
            temp_path
    ):

        os.remove(
            temp_path
        )

        return True

    return False