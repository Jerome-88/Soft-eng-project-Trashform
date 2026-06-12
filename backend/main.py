
from fastapi import FastAPI, File, UploadFile, HTTPException,Depends,Form
from fastapi import UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ai_service.base import AnalyzeResponse
from ai_service.analyze import analyze_trash
from dotenv import load_dotenv
from auth.auth_service import get_current_user,supabase_client
import uuid
from typing import Optional
from auth.base import LikeResponse,CommentRequest,CommentResponse,UpdateProfileRequest,SaveResponse
from helper import get_user_profile,format_time

load_dotenv()

app = FastAPI(title="TRASHFORM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:3000","https://trashform.vercel.app","https://soft-eng-project-trashform-7deb.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ni endpoint API nya
@app.get("/")
def root():
    return {"message": "TRASHFORM API is running 🌱", "version": "1.1.0"}


@app.get("/auth")
async def get_profile(user = Depends(get_current_user)):
    return {"user_id": user.id, "email": user.email}



# Query database langsung
@app.get("/home")
async def get_data(user=Depends(get_current_user)):

    try:

        posts_res = (
            supabase_client
            .table("posts")
            .select("*")
            .neq("owner", user.id)
            .order("created_at", desc=True)
            .execute()
        )

        result = []

        for post in posts_res.data:

            # =========================
            # PROFILE
            # =========================

            profile_res = (
                supabase_client
                .table("profile")
                .select("username, profile_picture")
                .eq("user_id", post["owner"])
                .execute()
            )

            if not profile_res.data:
                continue

            profile = profile_res.data[0]

            # =========================
            # TOTAL LIKES
            # =========================

            likes_res = (
                supabase_client
                .table("likes")
                .select("*", count="exact")
                .eq("post_id", post["id"])
                .execute()
            )

            total_likes = likes_res.count or 0

            # =========================
            # USER SUDAH LIKE?
            # =========================

            liked_res = (
                supabase_client
                .table("likes")
                .select("id")
                .eq("post_id", post["id"])
                .eq("user_id", user.id)
                .execute()
            )

            liked = len(liked_res.data) > 0

            # =========================
            # COMMENTS
            # =========================

            comments_res = (
                supabase_client
                .table("comments")
                .select("*")
                .eq("post_id", post["id"])
                .order("created_at")
                .execute()
            )

            comments = []

            for comment in comments_res.data:

                comment_profile_res = (
                    supabase_client
                    .table("profile")
                    .select("username")
                    .eq("user_id", comment["user_id"])
                    .execute()
                )

                username = "Unknown"

                if comment_profile_res.data:
                    username = comment_profile_res.data[0]["username"]

                comments.append({
                    "id": comment["id"],
                    "author": username,
                    "content": comment["content"],
                    "time": format_time(comment["created_at"])
                })

            result.append({
                "id": post["id"],

                "author": profile["username"],
                "authorId": post["owner"],

                "title": post["title"],
                "content": post["caption"],

                "img": post["storage_url"],

                "likes": total_likes,
                "liked": liked,

                "shares": 0,

                "commentList": comments,

                "av": profile["username"][0].upper(),

                "time": format_time(post["created_at"]),

                "type": "Organik"
            })


        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/upload-post")
async def upload_post(user=Depends(get_current_user),
    file: UploadFile = File(...),

    title: str = Form(...),
    caption: Optional[str] = Form(None),
    youtube_url: Optional[str] = Form(None),
    category: str = Form(...),
    for_sale: bool = Form(False),):
    try:
        # =========================
        # VALIDASI FILE
        # =========================

        allowed_types = [
            "image/png",
            "image/jpeg",
            "image/webp"
        ]

        if file.content_type not in allowed_types:
            raise HTTPException(400, "Invalid file type")

        file_content = await file.read()

        # =========================
        # GENERATE UNIQUE FILENAME
        # =========================

        ext = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"

        storage_path = f"posts/{filename}"

        # =========================
        # UPLOAD KE STORAGE
        # =========================

        supabase_client.storage \
            .from_("aol_se_bucket") \
            .upload(
                path=storage_path,
                file=file_content,
                file_options={
                    "content-type": file.content_type,
                    "upsert": "false"
                }
            )

        # =========================
        # AMBIL PUBLIC URL
        # =========================

        public_url = (
            supabase_client.storage
            .from_("aol_se_bucket")
            .get_public_url(storage_path)
        )

        # =========================
        # INSERT KE TABLE POSTS
        # =========================

        data = {
            "title": title,
            "caption": caption,
            "youtube_url": youtube_url,
            "category": category,
            "for_sale": for_sale,

            # URL hasil upload
            "storage_url": public_url,

            # owner FK
            "owner": user.id
        }

        result = (
            supabase_client.table("posts")
            .insert(data)
            .execute()
        )

        return {
            "message": "Post uploaded successfully",
            "data": result.data
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    

    


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_endpoint(file: UploadFile = File(...)):
    # Validasi tipe file
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Tipe file tidak didukung: {file.content_type}. Gunakan JPEG, PNG, atau WEBP."
        )

    # Validasi ukuran file (max 10MB)
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ukuran file maksimal 10MB.")

    try:
        result = await analyze_trash(image_bytes, file.content_type)
        return AnalyzeResponse(success=True, data=result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Gagal memproses response AI: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan: {str(e)}")



"""

limit
"""


# routers/interactions.py
from datetime import datetime, timezone

# ─── Like ─────────────────────────────────────────────────────────────────────
@app.post("/posts/{post_id}/likes", response_model=LikeResponse)
def toggle_like(post_id: str, user = Depends(get_current_user)):
    user_id = user.id
    # Cek sudah like atau belum
    existing = (
        supabase_client.table("likes")
        .select("id")
        .eq("post_id", post_id)
        .eq("user_id", user_id)
        .execute()
    )
    already_liked = len(existing.data) > 0

    if already_liked:
        # Unlike
        supabase_client.table("likes").delete() \
            .eq("post_id", post_id) \
            .eq("user_id", user_id) \
            .execute()
    else:
        # Like — kolom: id(auto), created_at(auto), post_id, user_id
        supabase_client.table("likes").insert({
            "post_id": post_id,
            "user_id": user_id,
        }).execute()

    # Hitung total likes terbaru
    count_res = (
        supabase_client.table("likes")
        .select("id", count="exact")
        .eq("post_id", post_id)
        .execute()
    )

    return LikeResponse(
        liked=not already_liked,
        likes=count_res.count or 0,
    )

# ─── Comments ─────────────────────────────────────────────────────────────────

@app.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=201)
def add_comment(
    post_id: str,
    body: CommentRequest,
    current_user = Depends(get_current_user),
):
    user_id = current_user.id

    if not body.text.strip():
        raise HTTPException(status_code=422, detail="Komentar tidak boleh kosong")

    profile = get_user_profile(user_id)
    username = profile["username"] or "?"


    # Insert — kolom: id(auto), created_at(auto), content, post_id, user_id
    res = (
        supabase_client.table("comments")
        .insert({
            "post_id": post_id,
            "user_id": user_id,
            "content": body.text.strip(),
            "username": username 
        })
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=500, detail="Gagal menyimpan komentar")

    comment = res.data[0]

    return CommentResponse(
        id=comment["id"],
        author=username,
        av=username[0].upper(),
        authorId=user_id,
        text=comment["content"],  # ← mapping "content" → "text" untuk frontend
        time="Baru saja",
    )


@app.get("/posts/{post_id}/comments", response_model=list[CommentResponse])
def get_comments(post_id: str, current_user = Depends(get_current_user)):
    res = (
        supabase_client.table("comments")
        .select("id, content, created_at, user_id, profile(username)")
        .eq("post_id", post_id)
        .order("created_at", desc=False)
        .execute()
    )

    result = []
    for c in res.data:
        username = c["profile"]["username"] if c.get("profile") else "?"
        result.append(CommentResponse(
            id=c["id"],
            author=username,
            av=username[0].upper() if username else "?",
            authorId=c["user_id"],
            text=c["content"],       # ← "content" dari DB → "text" ke frontend
            time=format_time(c["created_at"]),
        ))
    return result


# ─── Profile ─────────────────────────────────────────────────────────────────────
# GET /profile/me
@app.get("/profile/me")
def get_my_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user.id
    # Ambil profile
    profile_res = (
        supabase_client.table("profile")
        .select("username, profile_picture, bio")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not profile_res.data:
        raise HTTPException(status_code=404, detail="Profile tidak ditemukan")

    p = profile_res.data
    username = p["username"] or "?"

    # Ambil posts milik user
    posts_res = (
        supabase_client.table("posts")
        .select("*")
        .eq("owner", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    posts = []
    for post in posts_res.data:
        # Cek liked
        liked_res = (
            supabase_client.table("likes")
            .select("id")
            .eq("post_id", post["id"])
            .eq("user_id", user_id)
            .execute()
        )
        # Hitung likes
        likes_res = (
            supabase_client.table("likes")
            .select("id", count="exact")
            .eq("post_id", post["id"])
            .execute()
        )

        posts.append({
            "id": post["id"],
            "author": username,
            "authorId": user_id,
            "av": username[0].upper(),
            "avatar": p.get("profile_picture"),
            "title": post["title"],
            "content": post["caption"],
            "img": post.get("storage_url", ""),
            "type": post.get("type", "Organik"),
            "likes": likes_res.count or 0,
            "liked": len(liked_res.data) > 0,
            "shares": post.get("shares", 0),
            "commentList": [],
            "time": post["created_at"],
        })

    return {
        "userId": user_id,
        "name": username,
        "username": f"@{username}",
        "av": username[0].upper(),
        "avatar": p.get("profile_picture"),
        "bio": p.get("bio"),
        "postCount": len(posts),
        "posts": posts,
    }

@app.put("/profile/me")
def update_my_profile(
    body: UpdateProfileRequest,
    current_user = Depends(get_current_user)
):
    user_id = current_user.id

    # Hanya update field yang dikirim (tidak None)
    updates = {}
    if body.username is not None:
        username = body.username.strip().lstrip("@")
        if not username:
            raise HTTPException(status_code=422, detail="Username tidak boleh kosong")
        updates["username"] = username
    if body.bio is not None:
        updates["bio"] = body.bio.strip()
    if body.profile_picture is not None:
        updates["profile_picture"] = body.profile_picture

    if not updates:
        raise HTTPException(status_code=422, detail="Tidak ada data yang diupdate")

    res = (
        supabase_client.table("profile")
        .update(updates)
        .eq("user_id", user_id)
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=500, detail="Gagal mengupdate profile")

    p = res.data[0]
    username = p.get("username") or "?"

    return {
        "userId": user_id,
        "name": username,
        "username": f"@{username}",
        "av": username[0].upper(),
        "avatar": p.get("profile_picture"),
        "bio": p.get("bio"),
    }

# ─── Post Saving ─────────────────────────────────────────────────────────────────────
@app.post("/posts/{post_id}/save", response_model=SaveResponse)
def toggle_save(post_id: str, current_user = Depends(get_current_user)):
    user_id = current_user.id

    # Cek sudah disimpan atau belum
    existing = (
        supabase_client.table("saved_posts")
        .select("id")
        .eq("post_id", post_id)
        .eq("user_id", user_id)
        .execute()
    )
    already_saved = len(existing.data) > 0

    if already_saved:
        supabase_client.table("saved_posts").delete() \
            .eq("post_id", post_id) \
            .eq("user_id", user_id) \
            .execute()
    else:
        supabase_client.table("saved_posts").insert({
            "post_id": post_id,
            "user_id": user_id,
        }).execute()

    return SaveResponse(saved=not already_saved)


@app.get("/saved")
def get_saved_posts(current_user = Depends(get_current_user)):
    """Ambil semua post yang disimpan user"""
    user_id = current_user.id

    res = (
        supabase_client.table("saved_posts")
        .select("post_id, posts!saved_posts_post_id_fkey(*, profile!posts_owner_fkey1(username, profile_picture))")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    result = []
    for item in res.data:
        post = item.get("posts")
        if not post:
            continue

        profile = post.get("profile") or {}
        username = profile.get("username") or "?"

        liked_res = (
            supabase_client.table("likes")
            .select("id")
            .eq("post_id", post["id"])
            .eq("user_id", user_id)
            .execute()
        )
        likes_res = (
            supabase_client.table("likes")
            .select("id", count="exact")
            .eq("post_id", post["id"])
            .execute()
        )

        result.append({
            "id": post["id"],
            "author": username,
            "authorId": post["owner"],
            "av": username[0].upper() if username else "?",
            "avatar": profile.get("profile_picture"),
            "title": post.get("title", ""),
            "content": post.get("caption", ""),
            "img": post.get("storage_url", ""),
            "type": post.get("category", "Organik"),
            "likes": likes_res.count or 0,
            "liked": len(liked_res.data) > 0,
            "saved": True,
            "shares": 0,
            "commentList": [],
            "time": post["created_at"],
        })

    return result

@app.delete("/post/{post_id}/delete")
def delete_post(post_id: str,current_user = Depends(get_current_user)):
    """HAPUS POSTINGAN USER"""
    user_id = current_user.id

    # Cek post ada dan milik user ini
    post_res = (
        supabase_client.table("posts")
        .select("id, owner")
        .eq("id", post_id)
        .single()
        .execute()
    )

    if not post_res.data:
        raise HTTPException(status_code=404, detail="Post tidak ditemukan")

    if post_res.data["owner"] != user_id:
        raise HTTPException(status_code=403, detail="Tidak boleh menghapus post milik orang lain")

    # Hapus post — likes & comments otomatis terhapus kalau ada ON DELETE CASCADE
    supabase_client.table("posts").delete().eq("id", post_id).execute()

    return {"message": "Post berhasil dihapus"}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
