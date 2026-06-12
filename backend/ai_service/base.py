from pydantic import BaseModel, Field
from typing import Literal

class Warning(BaseModel):
    icon: Literal["flame", "drop", "warning"]  = Field(description="Tipe ikon peringatan")
    text: str                                   = Field(description="Teks peringatan penanganan")

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

class YoutubeRef(BaseModel):
    title:    str = Field(description="Judul video atau query pencarian YouTube")
    channel:  str = Field(description="Nama channel atau 'YouTube Search'")
    duration: str = Field(description="Estimasi durasi, contoh: '8:24' atau '~10 mnt'")
    query:    str = Field(description="Query untuk pencarian di YouTube, contoh: 'DIY pot dari botol plastik'")

class BankSampah(BaseModel):
    can_sell:       bool = Field(description="Apakah material ini bisa dijual ke bank sampah")
    estimate_price: str  = Field(description="Estimasi harga jual per kg, contoh: 'Rp 500 – 1.500 / kg'")

class TrashAnalysisResult(BaseModel):
    name:            str                                    = Field(description="Nama spesifik sampah yang terdeteksi")
    emoji:           str                                    = Field(description="Satu emoji yang merepresentasikan sampah")
    confidence:      int                                    = Field(description="Confidence score deteksi AI, 0-100")
    trash_type:      Literal["Organik", "Anorganik", "B3"] = Field(description="Jenis sampah")
    recyclable_code: str                                    = Field(description="Kode daur ulang jika ada, contoh: '#1 PET', '#2 HDPE', atau 'N/A'")
    short_desc:      str                                    = Field(description="Deskripsi singkat 1 kalimat tentang material")
    full_desc:       str                                    = Field(description="Deskripsi lengkap 2-3 kalimat tentang material, cara daur ulang, dan nilai ekonominya")
    warnings:        list[Warning]                          = Field(description="Daftar peringatan cara penanganan yang benar")
    env_impact:      EnvImpact                              = Field(description="Dampak lingkungan dari sampah ini")
    ideas:           list[UpcyclingIdea]                    = Field(description="3 hingga 5 ide kreatif upcycling atau daur ulang")
    youtube_refs:    list[YoutubeRef]                       = Field(description="2 referensi tutorial YouTube yang relevan")
    bank_sampah:     BankSampah                             = Field(description="Info jual ke bank sampah")

# respons si API nya

class AnalyzeResponse(BaseModel):
    success: bool
    data:    TrashAnalysisResult | None = None
    error:   str | None                 = None
