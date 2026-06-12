import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Sparkles, Youtube, Loader2, UploadCloud } from 'lucide-react';
import { usePosts } from '../context/PostsContext';
import { useProfile, CURRENT_USER_ID } from '../context/ProfileContext';
import type { TrashType } from '../App';

const CATEGORY_OPTIONS = ['Plastik', 'Kardus', 'Kaca', 'Kayu', 'Logam', 'Lainnya'];
const API_BASE = import.meta.env.VITE_API_URL ?? 'https://soft-eng-project-trashform.vercel.app';

// Utility function untuk convert File ke base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

interface CreatePostPageProps {
  onBackToFeed?: () => void;
}



export default function CreatePostPage({ onBackToFeed }: CreatePostPageProps) {
  // const { addPost } = usePosts();
  // const { profile } = useProfile();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Plastik');
  const [description, setDescription] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const { authFetch } = useProfile();


  const imagePreview = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);

  useEffect(() => {

    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handlePickFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
  };

  const handleDraft = async () => {
    setIsDraftLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setTitle('Lampu Hias dari Botol Bekas');
    setCategory('Kardus');
    setDescription('Saya ubah material bekas jadi lampu meja sederhana dengan rangka kuat dan pencahayaan hangat.');
    setYoutubeLink('https://youtube.com/watch?v=example');
    setIsDraftLoading(false);
  };

  const handlePost = async () => {
    setIsPosting(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    
    // Convert image to base64 if exists
    let imageData = '/assets/potmini.jpg';
    if (imageFile) {
      try {
        imageData = await fileToBase64(imageFile);
      } catch (error) {
        console.error('Error converting image:', error);
      }
    }
  
    // handle post upload
    
   
    if (!imageFile) {
        alert("Pilih gambar dulu")
        return
      }
    try {

      setIsPosting(true)

      const token = localStorage.getItem("token")

      const formData = new FormData()

      formData.append("file", imageFile)

      formData.append("title", title)

      formData.append("caption", description)

      formData.append("youtube_url", youtubeLink)

      formData.append("category", category)

      formData.append("for_sale", "false")

      const response = await authFetch(
          `${API_BASE}/upload-post`,
          {
            method: "POST",

            headers: {
              Authorization: `Bearer ${token}`
            },

            body: formData
          }
        )

      if (!response.ok) {

        const error = await response.json()

        throw new Error(error.detail)
      }

      const data = await response.json()

      console.log(data)

      alert("Post berhasil dibuat")

      // reset form
      setTitle('')
      setDescription('')
      setCategory('Plastik')
      setYoutubeLink('')
      setImageFile(null)

      onBackToFeed?.()

    } catch (err) {

    console.error(err)

    alert("Gagal upload post")

    } finally {

        setIsPosting(false)
    }
    

    // 

    
    // Reset form
    setTitle('');
    setDescription('');
    setCategory('Plastik');
    setYoutubeLink('');
    setImageFile(null);
    
    setIsPosting(false);
    onBackToFeed?.();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#edf5ee]">
      <div className="max-w-[1080px] mx-auto rounded-[28px] bg-white border border-[#dbe7dc] shadow-sm">
        <div className="px-7 py-6 border-b border-[#e3ece4] flex items-center justify-between">
          <div>
            <h1 className="text-[42px] leading-none font-semibold text-[#123b2a]">Buat Postingan Baru</h1>
            <p className="text-sm text-[#61786b] mt-2">Bagikan kreasi upcycling mu ke komunitas</p>
          </div>
        </div>

        <div className="p-7 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-7">
          <label
            htmlFor="create-upload"
            className="rounded-3xl border-2 border-dashed border-[#d5e3d8] bg-[#f1f6f2] min-h-[360px] cursor-pointer p-4 flex flex-col items-center justify-center text-center"
          >
            <input
              id="create-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
            />
            {imagePreview ? (
              <img src={imagePreview} alt="Preview karya" className="w-full h-full max-h-[320px] rounded-2xl object-cover" />
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-[#c8ead3] flex items-center justify-center mb-4">
                  <UploadCloud className="text-[#1b734c]" />
                </div>
                <p className="text-[30px] leading-none font-semibold text-[#173928]">Unggah Foto Utama</p>
                <p className="text-sm text-[#5d7568] mt-2">Tarik dan lepas gambar di sini atau klik untuk memilih file</p>
                <p className="text-xs text-[#859b90] mt-4">PNG, JPG up to 10MB</p>
              </>
            )}
          </label>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#2b4338] mb-2">Judul Proyek</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Rak Buku Estetik dari Kardus Bekas"
                className="w-full rounded-xl bg-[#eef6ef] border border-[#dbe7dc] px-4 py-3 text-sm outline-none focus:border-[#76bf95]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2b4338] mb-2">Kategori Material</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                      category === item
                        ? 'bg-[#0f8a4f] text-white border-[#0f8a4f]'
                        : 'bg-[#eef3ee] text-[#2f4a3d] border-[#d8e4da] hover:bg-[#e4eee6]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2b4338] mb-2">Deskripsi Singkat</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Ceritakan proses pembuatan dan tips untuk orang lain..."
                className="w-full rounded-xl bg-[#eef6ef] border border-[#dbe7dc] px-4 py-3 text-sm outline-none focus:border-[#76bf95] resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[#2b4338]">Link YouTube Tutorial</label>
                <span className="text-[10px] text-[#70877b] uppercase">Opsional</span>
              </div>
              <div className="rounded-xl bg-[#eef6ef] border border-[#dbe7dc] px-4 py-3 flex items-center gap-2">
                <Youtube size={16} className="text-[#4a6759]" />
                <input
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#e5ede6] flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2.5 rounded-full text-[#355045] hover:bg-[#edf3ee]"
              >
                Simpan Draft
              </button>
              <button
                type="button"
                onClick={handlePost}
                disabled={isPosting}
                className="min-w-[220px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0d7a41] text-white font-medium hover:bg-[#0b6838] disabled:opacity-70 shadow-md shadow-[#99cfb0]"
              >
                {isPosting ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                {isPosting ? 'Sinkronisasi ke API...' : 'Bagikan ke Komunitas'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="rounded-2xl border border-[#e1d7c9] bg-[#efe8dc] p-4">
          <p className="text-sm font-semibold text-[#7d5a30]">Tip Upcycling</p>
          <p className="text-sm text-[#6c5640] mt-1">Pastikan material sudah dibersihkan dari sisa organik untuk meningkatkan daya tahan karya Anda.</p>
        </div>
        <div className="rounded-2xl border border-[#cde6d3] bg-[#dff2e4] p-4">
          <p className="text-sm font-semibold text-[#286845]">AI Insights</p>
          <p className="text-sm text-[#2f5a44] mt-1">Kardus memiliki potensi reduksi karbon tinggi. Memposting ini dapat meningkatkan skor Impact-mu sebanyak 15 poin.</p>
        </div>
      </div>
    </div>
  );
}
