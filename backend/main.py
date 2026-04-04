import base64
import json
import re
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from typing import Literal,Dict,Any,List,Optional
import os
from dotenv import load_dotenv
from tavily import TavilyClient
import asyncio


load_dotenv()

app = FastAPI(title="TRASHFORM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API")
)


class Warning(BaseModel):
    icon: Literal["flame", "drop", "warning"]  = Field(description="Tipe ikon peringatan")
    text: str                                  = Field(description="Teks peringatan penanganan")

class EnvImpact(BaseModel):
    co2_saved:   str  = Field(description="Estimasi CO2 yang bisa dicegah, contoh: '0.18 kg'")
    decompose:   str  = Field(description="Estimasi waktu terurai di alam, contoh: '450 tahun'")
    recyclable:  bool = Field(description="Apakah bisa didaur ulang")

class UpcyclingIdea(BaseModel):
    emoji:      str                             = Field(description="Emoji representasi kerajinan")
    title:      str                             = Field(description="Nama kerajinan")
    difficulty: Literal["Mudah", "Sedang", "Sulit"] = Field(description="Tingkat kesulitan")
    time:       str                             = Field(description="Estimasi waktu pengerjaan, contoh: '30 mnt'")
    steps:      str                             = Field(description="Langkah singkat cara pembuatan (1-2 kalimat)")
    rating:     float                           = Field(description="Rating estimasi dari 1.0 hingga 5.0")

class VideoItem(BaseModel):
    title: str = Field(description="Judul video YouTube")
    url: str = Field(description="URL video YouTube")

class YoutubeRef(BaseModel):
    # title:    str = Field(description="Judul video atau query pencarian YouTube")
    # channel:  str = Field(description="Nama channel atau 'YouTube Search'")
    # duration: str = Field(description="Estimasi durasi, contoh: '8:24' atau '~10 mnt'")
    query:    list[str] = Field(description="Query untuk mencari tutorial DIY dari bahan di YouTube, contoh: 'DIY pot dari botol plastik'")
    related_videos: Optional[List[VideoItem]] = Field(
            default=None,
            description="List video hasil pencarian (diisi oleh backend, jangan diisi oleh LLM)"
        )
    
class BankSampah(BaseModel):
    can_sell:       bool = Field(description="Apakah material ini bisa dijual ke bank sampah")
    estimate_price: str  = Field(description="Estimasi harga jual per kg, contoh: 'Rp 500 – 1.500 / kg'")

class TrashAnalysisResult(BaseModel):
    name:            str                                    = Field(description="Nama spesifik sampah yang terdeteksi")
    emoji:           str                                    = Field(description="Satu emoji yang merepresentasikan sampah")
    confidence:      int                                    = Field(description="Confidence score deteksi AI, 0-100")
    trash_type:      Literal["Organik", "Anorganik", "B3"]  = Field(description="Jenis sampah")
    recyclable_code: str                                    = Field(description="Kode daur ulang jika ada, contoh: '#1 PET', '#2 HDPE', atau 'N/A'")
    short_desc:      str                                    = Field(description="Deskripsi singkat 1 kalimat tentang material")
    full_desc:       str                                    = Field(description="Deskripsi lengkap 2-3 kalimat tentang material, cara daur ulang, dan nilai ekonominya")
    warnings:        list[Warning]                          = Field(description="Daftar peringatan cara penanganan yang benar")
    env_impact:      EnvImpact                              = Field(description="Dampak lingkungan dari sampah ini")
    ideas:           list[UpcyclingIdea]                    = Field(description="3 hingga 5 ide kreatif upcycling atau daur ulang")
    youtube_refs:    YoutubeRef                             = Field(description="referensi tutorial YouTube yang relevan")
    bank_sampah:     BankSampah                             = Field(description="Info jual ke bank sampah")

# respons si API nya

class AnalyzeResponse(BaseModel):
    success: bool
    data:    TrashAnalysisResult | None = None
    error:   str | None                 = None




# Prompt langchain nya

SYSTEM_PROMPT = """
Kamu adalah AI analis sampah untuk platform TRASHFORM (Trusted Recycle Adaptive Service & Hybrid Framework for Object Recommendation Model).

Tugasmu adalah menganalisis foto sampah dan memberikan informasi lengkap dalam format JSON yang ketat.

ATURAN PENTING:
- Selalu jawab dalam format JSON yang valid, TANPA markdown code block, TANPA teks tambahan sebelum atau sesudah JSON.
- Pastikan semua field terisi dengan benar sesuai tipe data yang diminta.
- confidence harus berupa integer 0-100 (bukan string).
- rating pada ideas harus berupa float (contoh: 4.5).
- recyclable pada env_impact harus boolean true/false.
- can_sell pada bank_sampah harus boolean true/false.
- Jika gambar bukan sampah, tetap berikan analisis dengan confidence rendah.
- Berikan respons dalam Bahasa Indonesia kecuali nama teknis material.

FORMAT JSON yang harus dikembalikan:
{
  "name": "...",
  "emoji": "...",
  "confidence": 95,
  "trash_type": "Organik|Anorganik|B3",
  "recyclable_code": "...",
  "short_desc": "...",
  "full_desc": "...",
  "warnings": [{"icon": "flame|drop|warning", "text": "..."}],
  "env_impact": {"co2_saved": "...", "decompose": "...", "recyclable": true},
  "ideas": [{"emoji": "...", "title": "...", "difficulty": "Mudah|Sedang|Sulit", "time": "...", "steps": "...", "rating": 4.5}],
  "youtube_refs": {"query": ["..."], "related_videos": [{"title":"...","url":"..."}]},
  "bank_sampah": {"can_sell": true, "estimate_price": "..."}
}
"""


# function untuk mengambil data dari youtube untuk dijadiin tutorial
async def get_videos(queries: List[str]) -> Dict[str, Any]:
    client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

    async def search_one(query: str):
        result = await asyncio.to_thread(
            client.search,
            query=f"tutorial {query}",
            search_depth="advanced",
            include_domains=["youtube.com"],
            max_results=3
        )
        return result.get("results", [])

    tasks = [search_one(q) for q in queries]
    
    try:
        query_results = await asyncio.gather(*tasks)
    except Exception as e:
        pass
    all_results = [item for sublist in query_results for item in sublist]

    return {
        "results": all_results,
        "count": len(all_results)
    }

# ni buat kita encode gambar ama ambil JSON dari respon AI

def encode_image(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")

def extract_json(text: str) -> dict:
    """Ekstrak JSON dari response Gemini, toleran terhadap markdown code block."""
    # Coba parse langsung
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Coba strip markdown code block
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Coba cari JSON object di dalam teks
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Tidak bisa mengekstrak JSON dari response:\n{text[:300]}...")

async def analyze_trash(image_bytes: bytes, mime_type: str = "image/jpeg") -> TrashAnalysisResult:
    image_base64 = encode_image(image_bytes)

    message = HumanMessage(
        content=[
            {"type": "text", "text": SYSTEM_PROMPT},
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{image_base64}"},
            },
        ]
    )

    response = await llm.ainvoke([message])
    raw_json = extract_json(response.content)
    query_list= raw_json["youtube_refs"]["query"]
    try:
        video_data = await get_videos(queries=query_list)
        url_list = [{"title": item["title"],"url": item["url"]} for item in video_data["results"]]
        raw_json["youtube_refs"]["related_videos"] = url_list

    except Exception as e:
        raise RuntimeError(f"Failed to fetch videos") from e
    
    return TrashAnalysisResult(**raw_json)

# ni endpoint API nya

@app.get("/")
def root():
    return {"message": "TRASHFORM API is running 🌱", "version": "1.0.0"}

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)