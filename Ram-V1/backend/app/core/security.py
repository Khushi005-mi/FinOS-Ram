from datetime import datetime, timedelta
from typing import List, Optional
import uuid
import bcrypt

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import settings

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)
oauth2_scheme = reusable_oauth2


class TokenData(BaseModel):
    user_id: str
    organization_id: str
    email: str
    role: str


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def create_access_token(
    subject: str,
    organization_id: str,
    role: str = "ANALYST",
    email: str = "",
    expires_delta: Optional[timedelta] = None,
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "org_id": str(organization_id),
        "role": str(role),
        "email": str(email),
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_tenant_user(
    request: Request,
    header_token: Optional[str] = Depends(reusable_oauth2),
) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = request.cookies.get("finos_access_token")
    if not token and header_token:
        token = header_token

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id: Optional[str] = payload.get("sub")
        org_id: Optional[str] = payload.get("org_id")
        email: Optional[str] = payload.get("email")
        role: Optional[str] = payload.get("role", "ANALYST")

        if not user_id or not org_id:
            raise credentials_exception

        uuid.UUID(str(user_id))
        uuid.UUID(str(org_id))

        return TokenData(
            user_id=str(user_id),
            organization_id=str(org_id),
            email=str(email or ""),
            role=str(role),
        )
    except (JWTError, ValueError):
        raise credentials_exception


get_current_user = get_current_tenant_user


def require_roles(allowed_roles: List[str]):
    async def role_checker(current_user: TokenData = Depends(get_current_tenant_user)) -> TokenData:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires one of the following roles: {', '.join(allowed_roles)}. Current role: '{current_user.role}'.",
            )
        return current_user
    return role_checker

def create_password_reset_token(user_id: str, email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {
        "exp": expire,
        "sub": str(user_id),
        "email": str(email),
        "type": "password_reset",
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_password_reset_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "password_reset":
            return None
        return payload
    except Exception:
        return None

def create_password_reset_token(user_id: str, email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode = {
        "exp": expire,
        "sub": str(user_id),
        "email": str(email),
        "type": "password_reset",
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_password_reset_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "password_reset":
            return None
        return payload
    except Exception:
        return None


def create_refresh_token(subject: str, organization_id: str, role: str = 'ANALYST', email: str = '') -> str:
    expire = datetime.utcnow() + timedelta(days=30)
    to_encode = {
        'exp': expire,
        'sub': str(subject),
        'org_id': str(organization_id),
        'role': str(role),
        'email': str(email),
        'type': 'refresh',
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
