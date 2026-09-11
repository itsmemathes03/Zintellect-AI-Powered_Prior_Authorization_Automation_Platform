import os
import shutil
import re
from app.database.db import SessionLocal
from app.models.uploaded_file_model import UploadedFile
from app.services.virus_scan_service import scan_file
from app.services.encryption_service import generate_hash

ALLOWED_MIME_TYPES = {

    "application/pdf",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "text/plain",

    "image/png",

    "image/jpeg",

    "image/webp",

    "image/bmp",

    "image/tiff"

}

# ==========================================
# TEMP DIRECTORY
# ==========================================

TEMP_DIR = os.path.join(
    "app",
    "uploads",
    "requests"
)
POLICY_DIR = os.path.join(
    "app",
    "uploads",
    "policies"
)

os.makedirs(
    POLICY_DIR,
    exist_ok=True
)

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
        if file.content_type not in ALLOWED_MIME_TYPES:

            raise Exception(
                f"Unsupported file type : {file.content_type}"
            )

        safe_filename = re.sub(
            r'[^A-Za-z0-9._-]',
            '_',
            file.filename
        )

        temp_path = os.path.join(
            TEMP_DIR,
            f"{request_id}_{safe_filename}"
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

            file_type=file.content_type,

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
def delete_temp_file(temp_path):

    try:

        if temp_path and os.path.exists(temp_path):

            os.remove(temp_path)

            print(f"[Cleanup] Deleted: {temp_path}")

            return True

    except Exception as e:

        print(f"[Cleanup Error] {e}")

    return False