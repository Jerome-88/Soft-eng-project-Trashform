import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { Comment } from '../context/PostsContext';
import { useProfile } from '../context/ProfileContext';


const API_BASE = import.meta.env.VITE_API_URL ?? 'https://soft-eng-project-trashform.vercel.app';

interface CommentSectionProps {
  postId: string;          // ← tambah postId
  comments: Comment[];
  onAddComment: (text: string) => void;
}

export default function CommentSection({ postId, comments, onAddComment }: CommentSectionProps) {
  const { profile } = useProfile();
  const [text, setText] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [loading, setLoading] = useState(false);
  const { authFetch } = useProfile();


  // Fetch komentar saat section dibuka
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await authFetch(`${API_BASE}/posts/${postId}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch comments');
        const data = await res.json();
        setLocalComments(data);
      } catch (err) {
        console.error(err);
        setLocalComments(comments); // fallback ke prop
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]); // fetch ulang kalau postId berubah

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    await onAddComment(trimmed);

    // Refresh komentar setelah submit
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`${API_BASE}/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLocalComments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mt-2 pt-2 border-t border-[#e3ece4]">
      {loading ? (
        <div className="flex justify-center py-3">
          <p className="text-[12px] text-[#8a9e92]">Memuat komentar...</p>
        </div>
      ) : localComments.length > 0 ? (
        <div className="flex flex-col gap-2.5 mb-3 max-h-48 overflow-y-auto">
          {localComments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-[#66e09a] flex items-center justify-center text-[#0e4c33] font-bold text-[10px] flex-shrink-0">
                {c.av}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-[#f3f7f4] rounded-2xl px-3 py-2">
                  <p className="font-semibold text-[11px] text-[#1a3a2b] leading-none">{c.author}</p>
                  <p className="text-[12px] text-[#395447] mt-1 break-words">{c.text}</p>
                </div>
                <p className="text-[10px] text-[#667d70] mt-0.5 ml-1">{c.time}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-[#8a9e92] text-center py-2 mb-2">
          Belum ada komentar.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {profile.avatar ? (
          <img src={profile.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#66e09a] flex items-center justify-center text-[#0e4c33] font-bold text-[10px] flex-shrink-0">
            {profile.av}
          </div>
        )}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis komentar..."
          className="flex-1 text-[12px] bg-[#f3f7f4] border border-[#dbe7dc] rounded-full px-3 py-2 outline-none focus:border-[#66e09a] transition-colors placeholder:text-[#8a9e92]"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2 rounded-full text-[#1b5c43] hover:bg-[#eef4ef] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Kirim komentar"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}