from pydantic import BaseModel
from typing import Optional

class CommentRequest(BaseModel):
    text: str  # dari frontend tetap "text"

class CommentResponse(BaseModel):
    id: str
    author: str
    av: str
    authorId: str
    text: str
    time: str

class LikeResponse(BaseModel):
    liked: bool
    likes: int

class ProfileResponse(BaseModel):
    userId: str
    name: str
    username: str
    av: str
    avatar: Optional[str]
    bio: Optional[str]
    location: Optional[str]


class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None  # URL foto dari storage

class SaveResponse(BaseModel):
    saved: bool