import base64
import json
import re
from langchain_core.messages import HumanMessage
from ai_service.base import TrashAnalysisResult
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv
load_dotenv()


llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API"),
)



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
  "youtube_refs": [{"title": "...", "channel": "...", "duration": "...", "query": "..."}],
  "bank_sampah": {"can_sell": true, "estimate_price": "..."}
}
"""


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
    return TrashAnalysisResult(**raw_json)
