import { useMemo, useState, useEffect } from 'react';
import { BookmarkCheck, X, BookmarkX } from 'lucide-react';
import type { Post } from '../context/PostsContext';
import PostCard from './PostCard';
import {useProfile } from '../context/ProfileContext';


const API_BASE = import.meta.env.VITE_API_URL ?? 'https://soft-eng-project-trashform.vercel.app';

type SavedFilter = 'all' | 'community';

const FILTERS: { id: SavedFilter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'community', label: 'Inspirasi Komunitas' },
];

export default function SavedPage() {
  const [activeFilter, setActiveFilter] = useState<SavedFilter>('all');
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { authFetch } = useProfile();
  
  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await authFetch(`${API_BASE}/saved`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setSavedPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  const filtered = useMemo(
    () => savedPosts,
    [savedPosts, activeFilter]
  );

  const handleUnsave = async (postId: string) => {
    const token = localStorage.getItem('token');
    try {
      await authFetch(`${API_BASE}/posts/${postId}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#eef5ef]">
        <p className="text-[13px] text-[#8a9e92]">Memuat koleksi...</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-y-auto bg-[#eef5ef]">
      <div className="px-7 pt-7 pb-6">
        <h1 className="text-3xl font-semibold text-[#173928]">Koleksi Saya</h1>
        <p className="text-sm text-[#5a7165] mt-1">
          Postingan komunitas yang kamu simpan.
        </p>

        {filtered.length === 0 ? (
          <div className="mt-10 bg-white border border-[#d5e3d8] rounded-2xl p-10 text-center text-[#556d61]">
            <BookmarkCheck size={30} className="mx-auto mb-3 text-[#5f7d6d]" />
            <p className="text-[14px] font-semibold text-[#395447]">Belum ada postingan tersimpan</p>
            <p className="text-[12px] text-[#8a9e92] mt-1">
              Tekan tombol Simpan pada postingan untuk menyimpannya di sini.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 mt-6">
            {filtered.map((post) => (
              <div key={post.id} className="w-full max-w-[520px] relative">
                <PostCard post={post} />
                <button
                  type="button"
                  onClick={() => handleUnsave(post.id)}
                  className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-medium text-[#8b5a5a] hover:text-[#a33e3e] bg-white border border-[#e3ece4] rounded-full px-3 py-1.5 shadow-sm z-10"
                >
                  <BookmarkX size={14} />
                  Unsave
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}