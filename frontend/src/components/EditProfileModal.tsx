import { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://soft-eng-project-trashform.vercel.app';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { profile, updateProfile, authFetch } = useProfile();

  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUsername(profile.username);
      setBio(profile.bio);
      setAvatarPreview(profile.avatar);
      setSelectedFile(null);
      setError('');
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Pilih file gambar (JPG, PNG, dll.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2 MB');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const filename = `profile_pict/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from('aol_se_bucket')
      .upload(filename, file, { upsert: true });
    if (error) throw new Error('Gagal upload foto: ' + error.message);
    const { data } = supabase.storage
      .from('aol_se_bucket')
      .getPublicUrl(filename);
    return data.publicUrl;
  };

  const handleSave = async () => {
    const cleanUsername = username.replace('@', '').trim();
    if (!cleanUsername) {
      setError('Username tidak boleh kosong');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload foto dulu kalau ada file baru
      let avatarUrl: string | null = avatarPreview;
      if (selectedFile) {
        avatarUrl = await uploadAvatar(selectedFile);
      }

      const res = await authFetch(`${API_BASE}/profile/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          bio: bio.trim(),
          profile_picture: avatarUrl,
        }),
      });

      if (!res.ok) throw new Error('Gagal menyimpan profil');

      const updated = await res.json();

      // Sync ke ProfileContext → otomatis update Sidebar dll
      updateProfile({
        name: updated.name,
        username: updated.username,
        bio: updated.bio ?? '',
        avatar: updated.avatar ?? null,
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setLoading(false);
    }
  };

  const displayAv = username.replace('@', '').slice(0, 2).toUpperCase() || '??';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e3ece4]">
          <h2 className="text-lg font-semibold text-[#123b2a]">Edit Profil</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Foto profil */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Foto profil"
                  className="w-24 h-24 rounded-full object-cover border-[3px] border-[#dbe7dc]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#66e09a] border-[3px] border-[#dbe7dc] flex items-center justify-center text-2xl font-bold text-[#0e4c33]">
                  {displayAv}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1b5c43] text-white flex items-center justify-center shadow-md hover:bg-[#0e4c33] transition-colors"
              >
                <Camera size={14} />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[12px] font-semibold text-[#1b5c43] hover:underline"
              >
                Unggah foto
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-[12px] font-semibold text-red-600 hover:underline"
                >
                  Hapus foto
                </button>
              )}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-[12px] font-semibold text-[#395447] mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              maxLength={30}
              className="w-full text-[13px] border border-[#dbe7dc] rounded-xl px-3 py-2.5 outline-none focus:border-[#66e09a] transition-colors"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[12px] font-semibold text-[#395447] mb-1.5">Deskripsi</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan tentang dirimu..."
              rows={4}
              maxLength={300}
              className="w-full text-[13px] border border-[#dbe7dc] rounded-xl px-3 py-2.5 outline-none focus:border-[#66e09a] resize-none transition-colors"
            />
            <p className="text-[10px] text-[#8a9e92] mt-1 text-right">{bio.length}/300</p>
          </div>
        </div>

        {error && <p className="text-red-500 text-[12px] px-6 pb-2">{error}</p>}

        <div className="flex gap-3 px-6 py-4 border-t border-[#e3ece4]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full border border-[#dbe7dc] text-[13px] font-semibold text-[#395447] hover:bg-[#f3f7f4] transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full bg-[#1b5c43] text-white text-[13px] font-semibold hover:bg-[#0e4c33] transition-colors disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}