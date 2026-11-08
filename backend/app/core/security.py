from pwdlib import PasswordHash 
import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


import os

SECRET_KEY = os.getenv("SECRET_KEY", "ats_analyzer_super_secure_enterprise_key_2026_x92!")
ALGORITHM = "HS256"

def create_access_token(data: dict):
    token = jwt.encode(data, key=SECRET_KEY, algorithm=ALGORITHM)
    return token


from fastapi import Depends, HTTPException, status

def get_current_user(token: str = Depends(oauth2_scheme)) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return int(user_id)
    except (jwt.PyJWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )