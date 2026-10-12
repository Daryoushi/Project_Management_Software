import hashlib
import hmac
import os
import secrets
import json
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-pm-app-key-2026-asana-jira-secure")
SALT_LENGTH = 16

def hash_password(password: str) -> str:
    salt = secrets.token_hex(SALT_LENGTH)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${key.hex()}"

def verify_password(stored_password: str, provided_password: str) -> bool:
    try:
        salt, key_hex = stored_password.split('$')
        new_key = hashlib.pbkdf2_hmac('sha256', provided_password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return hmac.compare_digest(new_key.hex(), key_hex)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": int(expire.timestamp())})
    payload_json = json.dumps(to_encode, separators=(',', ':'))
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode('utf-8')).decode('utf-8').rstrip('=')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return None
        payload_b64, signature = parts
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        # Add padding back if necessary
        padding = '=' * (4 - len(payload_b64) % 4) if len(payload_b64) % 4 != 0 else ''
        payload_json = base64.urlsafe_b64decode(payload_b64 + padding).decode('utf-8')
        payload = json.loads(payload_json)
        if "exp" in payload and datetime.utcnow().timestamp() > payload["exp"]:
            return None
        return payload
    except Exception:
        return None
