from supabase import create_client
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import os
load_dotenv()

security = HTTPBearer()
supabase_client = create_client(os.getenv("SUPABASE_URL"),os.getenv("SUPABASE_SECRET"))

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    
    try:
        res = supabase_client.auth.get_user(token)
        return res.user

    except Exception as e:
        error_msg = str(e).lower()
        if "expired" in error_msg:
            raise HTTPException(status_code=401, detail="Expire Token")
        raise HTTPException(status_code=401, detail="Invalid Token")

