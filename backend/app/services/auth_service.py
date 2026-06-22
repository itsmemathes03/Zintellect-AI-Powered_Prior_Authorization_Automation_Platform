import os

from datetime import datetime, timedelta

from jose import JWTError, jwt

import bcrypt as _bcrypt

# ==========================================
# JWT CONFIG
# ==========================================

SECRET_KEY = os.getenv("SECRET_KEY", "zintellect_secret_key")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# ==========================================
# PASSWORD HASHING
# ==========================================


def hash_password(password):

    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password, hashed_password):

    return _bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


# ==========================================
# ACCESS TOKEN
# ==========================================


def create_access_token(data):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


# ==========================================
# REFRESH TOKEN
# ==========================================


def create_refresh_token(data):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire, "type": "refresh"})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


# ==========================================
# VERIFY TOKEN
# ==========================================


def verify_token(token):

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        return payload

    except JWTError:
        return None


# ==========================================
# PASSWORD RESET TOKEN
# ==========================================


def create_password_reset_token(email):

    expire = datetime.utcnow() + timedelta(minutes=30)

    payload = {"email": email, "exp": expire, "type": "password_reset"}

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return token
