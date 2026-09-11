from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.services.auth_service import SECRET_KEY, ALGORITHM

security = HTTPBearer()


def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_role(role: str):
    def role_checker(payload: dict = Depends(verify_jwt_token)):
        if payload.get("role") != role:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. {role.capitalize()} role required.",
            )
        return payload

    return role_checker
