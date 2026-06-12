import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { usePosts } from '../context/PostsContext';
import { useProfile } from '../context/ProfileContext';
import { resolveProfileUserId } from '../lib/users';
import type { Post } from '../context/PostsContext';
import CommentSection from './CommentSection';

interface PostDetailModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onViewProfile?: (userId: string) => void;
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://soft-eng-project-trashform.vercel.app';


export default function PostDetailModal({ post, isOpen, onClose, onViewProfile }: PostDetailModalProps) {
  const { deletePost, addComment } = usePosts();
  const { isOwnPost } = useProfile();
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const { authFetch } = useProfile();

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!window.confirm('Yakin ingin menghapus postingan ini??')) return;

    try {
      const token = localStorage.getItem('token');
      console.log(API_BASE)
      const res = await authFetch(`${API_BASE}/post/${post.id}/delete`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`},
      });

      if (!res.ok) throw new Error('Gagal menghapus post');

      deletePost(post.id); 
      setShowMenu(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus postingan');
    }
  };

  const ownPost = isOwnPost(post.author, post.authorId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e3ece4] sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-[#123b2a]">{post.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Author Info */}
          <button
            type="button"
            onClick={() => {
              onViewProfile?.(resolveProfileUserId(post.author, post.authorId));
              onClose();
            }}
            className="flex items-center gap-3 mb-6 text-left hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 rounded-full bg-[#66e09a] flex items-center justify-center text-[#0e4c33] font-bold">
              {post.av}
            </div>
            <div>
              <p className="font-semibold text-[#1a3a2b] hover:underline">{post.author}</p>
              <p className="text-sm text-[#667d70]">{post.time}</p>
            </div>
          </button>

          {/* Image */}
          <div className="rounded-xl overflow-hidden mb-6 border border-[#e3ece4]">
            <img
              src={post.img}
              alt={post.title}
              className="w-full max-h-[400px] object-cover"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-[#173928] mb-2">{post.title}</h3>
            <p className="text-[#395447] leading-relaxed text-justify">{post.content}</p>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mb-6 py-4 border-t border-b border-[#e3ece4]">
            <div className="text-center">
              <p className="text-lg font-semibold text-[#173928]">{post.likes}</p>
              <p className="text-sm text-[#667d70]">Suka</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-[#173928]">{post.commentList.length}</p>
              <p className="text-sm text-[#667d70]">Komentar</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-[#173928]">{post.shares}</p>
              <p className="text-sm text-[#667d70]">Bagian</p>
            </div>
          </div>

          {/* Type Badge */}
          <div className="mb-6">
            <p className="text-sm text-[#667d70] mb-2">Jenis Sampah</p>
            <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full">
              {post.type}
            </span>
          </div>

          {/* Comments */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowComments((v) => !v)}
              className="text-sm font-semibold text-[#1b5c43] hover:underline mb-3"
            >
              {showComments ? 'Sembunyikan komentar' : `Lihat ${post.commentList.length} komentar`}
            </button>
            {showComments && (
              <CommentSection
                  postId={String(post.id)}
                  comments={post.commentList}
                  onAddComment={(text) => addComment(post.id, text)}
              />
            )}
          </div>

          {/* Action Buttons */}
          {ownPost && (
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors"
              >
                <Trash2 size={18} />
                Hapus Postingan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
