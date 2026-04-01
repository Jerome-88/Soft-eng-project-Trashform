import { useState, useRef, type JSX } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Camera, Home, Search, User, Recycle, Upload, Leaf,
  FlaskConical, ChevronRight, Play, Share2, ArrowLeft,
  Sparkles, ScanLine, CheckCircle2, AlertTriangle,
  Flame, Droplets, Package, BookOpen, Clock, Star,
  Bell, X
} from 'lucide-react';

// ─── Types (mirror dari Pydantic backend) ─────────────────────────────────────
export type TrashType   = 'Organik' | 'Anorganik' | 'B3';
export type Difficulty  = 'Mudah' | 'Sedang' | 'Sulit';
export type WarningIcon = 'flame' | 'drop' | 'warning';
export type PageId      = 'scan' | 'feed' | 'explore' | 'profile';

export interface Warning {
  icon: WarningIcon;
  text: string;
}

export interface EnvImpact {
  co2_saved:   string;
  decompose:   string;
  recyclable:  boolean;
}

export interface UpcyclingIdea {
  emoji:      string;
  title:      string;
  difficulty: Difficulty;
  time:       string;
  steps:      string;
  rating:     number;
}

export interface YoutubeRef {
  title:    string;
  channel:  string;
  duration: string;
  query:    string;
}

export interface BankSampah {
  can_sell:       boolean;
  estimate_price: string;
}

export interface TrashAnalysisResult {
  name:            string;
  emoji:           string;
  confidence:      number;
  trash_type:      TrashType;
  recyclable_code: string;
  short_desc:      string;
  full_desc:       string;
  warnings:        Warning[];
  env_impact:      EnvImpact;
  ideas:           UpcyclingIdea[];
  youtube_refs:    YoutubeRef[];
  bank_sampah:     BankSampah;
}

export interface AnalyzeResponse {
  success: boolean;
  data:    TrashAnalysisResult | null;
  error:   string | null;
}

// Anu anuan API
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function analyzeTrash(file: File): Promise<TrashAnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  const json: AnalyzeResponse = await res.json();
  if (!json.success || !json.data) throw new Error(json.error ?? 'Analisis gagal');
  return json.data;
}


const TRASH_TYPE_STYLE: Record<TrashType, { badge: string; icon: JSX.Element }> = {
  Organik:   { badge: 'bg-green-100 text-green-700',  icon: <Leaf size={10} /> },
  Anorganik: { badge: 'bg-blue-100 text-blue-700',    icon: <Recycle size={10} /> },
  B3:        { badge: 'bg-red-100 text-red-700',       icon: <FlaskConical size={10} /> },
};

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  Mudah:  'bg-emerald-100 text-emerald-700',
  Sedang: 'bg-yellow-100 text-yellow-700',
  Sulit:  'bg-red-100 text-red-700',
};



const MOCK_POSTS = [
  { id: 1, user: 'Gojo Sitorus', av: 'GS', type: 'Anorganik' as TrashType, craft: 'Pot Mini',  img: '/assets/potmini.jpg',  likes: 67, time: '2j' },
  { id: 2, user: 'Windah Barusadar', av: 'WB', type: 'Anorganik'   as TrashType, craft: 'Robot Botol',      img: '/assets/botol.jpg',         likes: 88, time: '5j' },
  { id: 3, user: 'Green ninja',   av: 'GN', type: 'Anorganik' as TrashType, craft: 'Rak Dinding Kardus',img: '/assets/dinding.jpg',     likes: 888, time: '1h' },
];

function Avatar({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }[size];
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function TrashBadge({ type }: { type: TrashType }) {
  const s = TRASH_TYPE_STYLE[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>
      {s.icon} {type}
    </span>
  );
}

function SectionTitle({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <Icon size={14} className="text-emerald-500" />
      <p className="font-bold text-sm text-gray-900">{label}</p>
    </div>
  );
}

// Nav
const TABS: { id: PageId; icon: LucideIcon; label: string }[] = [
  { id: 'scan',    icon: ScanLine, label: 'Scan'    },
  { id: 'feed',    icon: Home,     label: 'Feed'    },
  { id: 'explore', icon: Search,   label: 'Explore' },
  { id: 'profile', icon: User,     label: 'Profil'  },
];

function BottomNav({ active, onChange }: { active: PageId; onChange: (id: PageId) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 z-40 shadow-lg">
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex flex-col items-center gap-0.5 px-5 py-1 rounded-xl transition-all ${isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Icon size={20} />
            <span className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>{t.label}</span>
            {isActive && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
          </button>
        );
      })}
    </nav>
  );
}

// halaman scan
type ScanState = 'idle' | 'scanning' | 'error';

function ScanPage({ onResult }: { onResult: (r: TrashAnalysisResult, preview: string) => void }) {
  const [state,    setState]    = useState<ScanState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File): Promise<void> => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPEG, PNG, atau WEBP).');
      setState('error');
      return;
    }
    const preview = URL.createObjectURL(file);
    setState('scanning');
    setErrorMsg('');
    try {
      const result = await analyzeTrash(file);
      onResult(result, preview);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan tidak dikenal.');
      setState('error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };


  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center">
            <img src="/assets/logo.png" alt="logo" className="w-10 h-10" />
          </div>
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">TRASHFORM</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 leading-tight">
          Foto sampahmu,<br />
          <span className="text-emerald-600">daur ulang kreatif!</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">AI akan mengidentifikasi jenis & memberikan ide upcycling</p>
      </div>

      <div className="px-4 space-y-3 flex-1">
        {state === 'idle' && (
          <>
            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => inputRef.current?.click()}
              className={`relative rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 py-12 ${
                dragOver ? 'border-emerald-500 bg-emerald-50 scale-[1.01]' : 'border-gray-200 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/50'
              }`}
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center">
                <Upload size={28} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700 text-sm">Upload Foto Sampah</p>
                <p className="text-xs text-gray-400 mt-0.5">Drag & drop atau tap di sini</p>
              </div>
              {/* Corner accents */}
              <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
            </div>

            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />

            {/* Camera Button */}
            <button
              onClick={() => { if (inputRef.current) { inputRef.current.capture = 'environment'; inputRef.current.click(); } }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl py-3.5 font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-200"
            >
              <Camera size={20} /> Gunakan Kamera
            </button>

            {/* Recent Scans */}
          </>
        )}

        {state === 'scanning' && (
          <div className="flex flex-col items-center justify-center gap-5 py-20">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-ping opacity-60" />
              <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-spin border-t-transparent" />
              <div className="absolute inset-3 rounded-full bg-emerald-50 flex items-center justify-center">
                <Sparkles size={24} className="text-emerald-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800">Menganalisis...</p>
              <p className="text-sm text-gray-400 mt-1">Mendeteksi jenis sampah & ide upcycling</p>
            </div>
            <div className="w-48 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <X size={28} className="text-red-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800">Analisis Gagal</p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">{errorMsg}</p>
            </div>
            <button
              onClick={() => setState('idle')}
              className="bg-emerald-600 text-white rounded-2xl px-6 py-2.5 font-semibold text-sm hover:bg-emerald-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

//result page
function ResultPage({
  result,
  preview,
  onBack,
  onShare,
}: {
  result: TrashAnalysisResult;
  preview: string;
  onBack: () => void;
  onShare: () => void;
}) {
  const [expandedIdea, setExpandedIdea] = useState<number | null>(null);
  const [showFull,     setShowFull]     = useState<boolean>(false);
  const typeStyle = TRASH_TYPE_STYLE[result.trash_type];

  return (
    <div className="flex flex-col min-h-full pb-24 overflow-y-auto">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 flex items-center gap-3 px-4 pt-5 pb-3 border-b border-gray-100">
        <button onClick={onBack} className="p-1.5 rounded-full hover:bg-gray-100 flex-shrink-0">
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <span className="font-bold text-gray-900 flex-1 truncate">Hasil Scan</span>
        <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full flex-shrink-0">
          <CheckCircle2 size={11} className="text-emerald-600" />
          <span className="text-xs text-emerald-600 font-semibold">Terdeteksi</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-5">

        {/* ── 1. Identity Card ── */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 rounded-3xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            {/* Preview thumbnail */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
              <img src={preview} alt="scan" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 text-lg leading-tight truncate">{result.name}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <TrashBadge type={result.trash_type} />
                {result.recyclable_code !== 'N/A' && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    <Package size={9} /> {result.recyclable_code}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <div className="flex justify-between mb-0.5">
                  <span className="text-xs text-gray-400">Akurasi AI</span>
                  <span className="text-xs font-bold text-emerald-600">{result.confidence}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${result.confidence}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Deskripsi ── */}
        <div>
          <SectionTitle icon={BookOpen} label="Deskripsi Sampah" />
          <div className="bg-gray-50 rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-700 leading-relaxed">
              {showFull ? result.full_desc : result.short_desc}
            </p>
            <button onClick={() => setShowFull((p) => !p)} className="text-emerald-600 text-xs font-semibold mt-1.5">
              {showFull ? 'Tampilkan lebih sedikit ▲' : 'Selengkapnya ▼'}
            </button>
          </div>
        </div>

        {/* ── 3. Peringatan ── */}
        {result.warnings.length > 0 && (
          <div>
            <SectionTitle icon={AlertTriangle} label="Peringatan & Penanganan" />
            <div className="space-y-2">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2.5">
                  {w.icon === 'flame'   ? <Flame    size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                 : w.icon === 'drop'    ? <Droplets size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
                 :                        <AlertTriangle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />}
                  <p className="text-xs text-amber-800 leading-relaxed">{w.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. Dampak Lingkungan ── */}
        <div>
          <SectionTitle icon={Leaf} label="Dampak Lingkungan" />
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'CO₂ Dicegah',    value: result.env_impact.co2_saved,              bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700' },
              { label: 'Waktu Terurai',  value: result.env_impact.decompose,              bg: 'bg-red-50',   border: 'border-red-100',   text: 'text-red-600'  },
              { label: 'Daur Ulang',     value: result.env_impact.recyclable ? '✓ Bisa' : '✗ Tidak', bg: 'bg-blue-50',  border: 'border-blue-100',  text: 'text-blue-700' },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} border ${item.border} rounded-2xl p-2.5 text-center`}>
                <p className={`text-xs font-black ${item.text}`}>{item.value}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. Ide Upcycling ── */}
        <div>
          <SectionTitle icon={Sparkles} label={`Ide Upcycling (${result.ideas.length} Rekomendasi)`} />
          <div className="space-y-2">
            {result.ideas.map((idea, i) => {
              const diff = DIFFICULTY_STYLE[idea.difficulty];
              const isOpen = expandedIdea === i;
              return (
                <div
                  key={i}
                  onClick={() => setExpandedIdea(isOpen ? null : i)}
                  className={`rounded-2xl border transition-all cursor-pointer shadow-sm ${isOpen ? 'border-emerald-300 bg-emerald-50/60' : 'border-gray-100 bg-white hover:border-emerald-200'}`}
                >
                  <div className="flex items-center gap-3 px-3 py-3">
                    <span className="text-2xl w-9 text-center flex-shrink-0">{idea.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{idea.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${diff}`}>{idea.difficulty}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-0.5"><Clock size={10} /> {idea.time}</span>
                        <span className="text-xs text-amber-500 flex items-center gap-0.5"><Star size={10} fill="currentColor" /> {idea.rating}</span>
                      </div>
                    </div>
                    <ChevronRight size={15} className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90 text-emerald-500' : ''}`} />
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-3 border-t border-emerald-100 pt-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Langkah Singkat</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{idea.steps}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/*Tutorial yt */}
        <div>
          <SectionTitle icon={Play} label="Referensi Tutorial" />
          <div className="space-y-2">
            {result.youtube_refs.map((yt, i) => (
              <a
                key={i}
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(yt.query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2.5 hover:bg-red-50 hover:border-red-100 transition-colors group"
              >
                <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Play size={12} className="text-white" fill="white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{yt.title}</p>
                  <p className="text-xs text-gray-400">{yt.channel} · {yt.duration}</p>
                </div>
                <ChevronRight size={13} className="text-gray-300 group-hover:text-red-400 transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* 7. Bank Sampah */}
        {result.bank_sampah.can_sell && (
          <div className="bg-emerald-600 rounded-3xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Recycle size={15} />
              <p className="font-bold text-sm">Jual ke Bank Sampah</p>
            </div>
            <p className="text-xs text-emerald-100 mb-1">Estimasi harga jual:</p>
            <p className="font-black text-xl">{result.bank_sampah.estimate_price}</p>
            <button className="mt-2 bg-white text-emerald-700 rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-emerald-50 transition-colors">
              Cari Bank Sampah Terdekat →
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onShare}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-3 font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200 transition-all active:scale-95"
          >
            <Share2 size={15} /> Bagikan ke Feed
          </button>
          <button
            onClick={onBack}
            className="px-4 rounded-2xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
          >
            Scan Lagi
          </button>
        </div>
      </div>
    </div>
  );
}

// halaamn Feed
function FeedPage() {
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  return (
    <div className="min-h-full pb-24">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center">
            <img src="/assets/logo.png" alt="logo" className="w-10 h-10" />
          </div>
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">TRASHFORM</span>
        </div>
        <Bell size={20} className="text-gray-400" />
      </div>
      {MOCK_POSTS.map((p) => (
        <div key={p.id} className="border-b border-gray-100">
          <div className="flex items-center gap-2 px-4 py-3">
            <Avatar initials={p.av} size="sm" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{p.user}</p>
              <TrashBadge type={p.type} />
            </div>
            <span className="ml-auto text-xs text-gray-400">{p.time}</span>
          </div>
          <img src={p.img} alt={p.craft} className="w-full aspect-square object-cover" />
          <div className="px-4 py-2 flex items-center gap-3">
            <button onClick={() => setLiked((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
              className={liked[p.id] ? 'text-red-500' : 'text-gray-500'}>
              ♥
            </button>
            <p className="text-xs font-semibold text-gray-800">{p.likes + (liked[p.id] ? 1 : 0)} suka</p>
          </div>
          <p className="px-4 pb-3 text-xs text-gray-700"><span className="font-semibold">{p.user} </span>{p.craft}</p>
        </div>
      ))}
    </div>
  );
}

// ROOT APP
type AppView = 'scan' | 'result';

export default function App() {
  const [page,          setPage]         = useState<PageId>('scan');
  const [view,          setView]         = useState<AppView>('scan');
  const [scanResult,    setScanResult]   = useState<TrashAnalysisResult | null>(null);
  const [previewUrl,    setPreviewUrl]   = useState<string>('');

  const handleResult = (result: TrashAnalysisResult, preview: string): void => {
    setScanResult(result);
    setPreviewUrl(preview);
    setView('result');
  };

  const handleBack = (): void => {
    setView('scan');
    setScanResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  };

  const handleShare = (): void => {
    setPage('feed');
    setView('scan');
  };

  const handlePageChange = (id: PageId): void => {
    setPage(id);
    if (id === 'scan') setView('scan');
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <div className="max-w-lg mx-auto relative min-h-screen bg-white shadow-xl">
        {page === 'scan' && view === 'scan' && (
          <ScanPage onResult={handleResult} />
        )}
        {page === 'scan' && view === 'result' && scanResult && (
          <ResultPage
            result={scanResult}
            preview={previewUrl}
            onBack={handleBack}
            onShare={handleShare}
          />
        )}
        {page === 'feed'    && <FeedPage />}
        {page === 'explore' && <div className="flex items-center justify-center min-h-screen text-gray-400 pb-24">Belom jadi</div>}
        {page === 'profile' && <div className="flex items-center justify-center min-h-screen text-gray-400 pb-24">belom jadi</div>}

        <BottomNav active={page} onChange={handlePageChange} />
      </div>
    </div>
  );
}