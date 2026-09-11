import os

# ==========================================
# ALLOWED FILE TYPES
# ==========================================

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg",
    ".docx"
}

# Maximum file size: 20 MB
MAX_FILE_SIZE = 20 * 1024 * 1024

# Suspicious extensions
BLOCKED_EXTENSIONS = {
    ".exe",
    ".bat",
    ".cmd",
    ".sh",
    ".js",
    ".msi",
    ".dll",
    ".vbs",
    ".scr"
}


# ==========================================
# VALIDATE FILE EXTENSION
# ==========================================

def validate_extension(file_name):

    extension = os.path.splitext(
        file_name
    )[1].lower()

    if extension in BLOCKED_EXTENSIONS:
        return False

    return extension in ALLOWED_EXTENSIONS


# ==========================================
# VALIDATE FILE SIZE
# ==========================================

def validate_file_size(file_path):

    file_size = os.path.getsize(
        file_path
    )

    return file_size <= MAX_FILE_SIZE


# ==========================================
# BASIC FILE SCAN
# ==========================================

def scan_file(file_path):

    file_name = os.path.basename(
        file_path
    )

    extension = os.path.splitext(
        file_name
    )[1].lower()

    # Block dangerous extensions
    if extension in BLOCKED_EXTENSIONS:

        return {
            "safe": False,
            "reason": "Blocked file type."
        }

    # Validate extension
    if not validate_extension(file_name):

        return {
            "safe": False,
            "reason": "Unsupported file type."
        }

    # Validate size
    if not validate_file_size(file_path):

        return {
            "safe": False,
            "reason": "File size exceeds limit."
        }

    return {
        "safe": True,
        "reason": "File is safe."
    }