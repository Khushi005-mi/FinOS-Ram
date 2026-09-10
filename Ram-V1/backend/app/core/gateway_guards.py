import time
from fastapi import HTTPException, Request, status
from typing import Dict, Tuple, Optional

# In-memory sliding window rate limiter and idempotency store
# (In production enterprise scale, this is backed by Redis cluster)
_RATE_LIMIT_STORE: Dict[str, list] = {}
_IDEMPOTENCY_STORE: Dict[str, Tuple[int, dict]] = {}

RATE_LIMIT_MAX_REQUESTS = 30  # Max requests per window
RATE_LIMIT_WINDOW_SECONDS = 60  # 1 minute window

def check_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path
    key = f"{client_ip}:{path}"
    
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS
    
    # Clean old requests
    requests = _RATE_LIMIT_STORE.get(key, [])
    requests = [t for t in requests if t > window_start]
    
    if len(requests) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Too many requests in a sliding window of 60 seconds.",
        )
    
    requests.append(now)
    _RATE_LIMIT_STORE[key] = requests

def verify_idempotency(request: Request) -> Optional[str]:
    # For sensitive mutations, check X-Idempotency-Key
    if request.method in ["POST", "PUT", "PATCH"]:
        idempotency_key = request.headers.get("X-Idempotency-Key")
        if idempotency_key:
            now = time.time()
            # Clean expired idempotency keys (24 hour retention)
            expired_keys = [k for k, (timestamp, _) in _IDEMPOTENCY_STORE.items() if now - timestamp > 86400]
            for k in expired_keys:
                del _IDEMPOTENCY_STORE[k]
                
            if idempotency_key in _IDEMPOTENCY_STORE:
                _, cached_response = _IDEMPOTENCY_STORE[idempotency_key]
                # Return cached response indicator or handle duplicate
                return idempotency_key
    return None
