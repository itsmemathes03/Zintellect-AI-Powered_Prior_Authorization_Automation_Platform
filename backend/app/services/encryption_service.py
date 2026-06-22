import os
import hashlib

from cryptography.fernet import Fernet


# ==========================================
# ENCRYPTION KEY
# ==========================================

KEY_FILE = "file_encryption.key"


def generate_key():

    """
    Generate AES key once.
    """

    if not os.path.exists(KEY_FILE):

        key = Fernet.generate_key()

        with open(KEY_FILE, "wb") as f:
            f.write(key)

        return key

    with open(KEY_FILE, "rb") as f:
        return f.read()


ENCRYPTION_KEY = generate_key()

cipher = Fernet(ENCRYPTION_KEY)


# ==========================================
# ENCRYPT FILE
# ==========================================

def encrypt_file(
        input_path,
        output_path=None
):

    if output_path is None:

        output_path = input_path + ".bin"

    with open(input_path, "rb") as file:
        file_data = file.read()

    encrypted_data = cipher.encrypt(
        file_data
    )

    with open(output_path, "wb") as file:
        file.write(encrypted_data)

    return output_path


# ==========================================
# DECRYPT FILE
# ==========================================

def decrypt_file(
        encrypted_path,
        output_path
):

    with open(encrypted_path, "rb") as file:
        encrypted_data = file.read()

    decrypted_data = cipher.decrypt(
        encrypted_data
    )

    with open(output_path, "wb") as file:
        file.write(decrypted_data)

    return output_path


# ==========================================
# SHA256 HASH
# ==========================================

def generate_hash(file_path):

    sha256 = hashlib.sha256()

    with open(file_path, "rb") as file:

        while True:

            chunk = file.read(4096)

            if not chunk:
                break

            sha256.update(chunk)

    return sha256.hexdigest()


# ==========================================
# VERIFY FILE INTEGRITY
# ==========================================

def verify_hash(
        file_path,
        original_hash
):

    current_hash = generate_hash(
        file_path
    )

    return current_hash == original_hash