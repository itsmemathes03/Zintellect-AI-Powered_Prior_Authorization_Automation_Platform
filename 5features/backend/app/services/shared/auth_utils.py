"""
Authentication utilities
"""
from typing import Dict, Any
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

# In a real application, these would be loaded from environment variables or a config file
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode a JWT token.
    Returns the payload if valid, raises JWTError otherwise.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise


def get_current_user_from_token(token: str) -> Dict[str, Any]:
    """
    Extract user information from token.
    In a real application, you might fetch the user from a database.
    """
    payload = verify_token(token)
    # Assuming the token payload contains user_id and roles
    return {
        "user_id": payload.get("sub"),
        "roles": payload.get("roles", []),
        # Add any other user info you need
    }


# Placeholder for dependency in FastAPI routes
# This would be used as: current_user: dict = Depends(get_current_user_from_token)
# But we need to extract the token from the request header.
# For simplicity, we'll leave the actual header extraction to the route dependencies.