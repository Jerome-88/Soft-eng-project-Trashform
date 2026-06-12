from fastapi import  HTTPException
from auth.auth_service import supabase_client
from datetime import datetime,timezone


# ─── Helper ──────────────────────────────────────────────────────────────────


def format_time(created_at: str) -> str:
    now = datetime.now(timezone.utc)
    dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    diff = int((now - dt).total_seconds())
    if diff < 60:
        return "Baru saja"
    elif diff < 3600:
        return f"{diff // 60} menit"
    elif diff < 86400:
        return f"{diff // 3600} jam"
    else:
        return f"{diff // 86400} hari"

def get_user_profile(user_id: str) -> dict:
    res = (
        supabase_client.table("profile")
        .select("username, profile_picture")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile tidak ditemukan")
    return res.data