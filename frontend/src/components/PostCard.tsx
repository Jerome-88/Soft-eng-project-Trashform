import { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import type { Post } from '../context/PostsContext';
import { usePosts } from '../context/PostsContext';
import { useProfile } from '../context/ProfileContext';
import { resolveProfileUserId } from '../lib/users';
import PostDetailModal from './PostDetailModal';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
  onViewProfile?: (userId: string) => void;
}

export default function PostCard({ post, onViewProfile }: PostCardProps) {
  const { likePost, deletePost, addComment, savePost } = usePosts();
  const { isOwnPost } = useProfile();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const toggleLike = () => {
    likePost(post.id);
  };

  const handleDelete = () => {
    if (window.confirm('Yakin ingin menghapus postingan ini?')) {
      deletePost(post.id);
      setShowMenu(false);
    }
  };

  const ownPost = isOwnPost(post.author, post.authorId);

  const getTrashTypeColor = (type: Post['type']) => {
    switch (type) {
      case 'Organik':
        return 'bg-green-100 text-green-700';
      case 'Anorganik':
        return 'bg-blue-100 text-blue-700';
      case 'B3':
        return 'bg-red-100 text-red-700';
    }
  };

  return (
    <>
      <PostDetailModal
        post={post}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onViewProfile={onViewProfile}
      />
      <div className="w-full max-w-[520px] self-center mx-5 my-3 bg-white border border-[#dbe7dc] rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile?.(resolveProfileUserId(post.author, post.authorId));
            }}
          >
            <div className="w-9 h-9 rounded-full bg-[#66e09a] flex items-center justify-center text-[#0e4c33] font-bold text-xs flex-shrink-0">
              {post.av}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[13px] leading-none text-[#1a3a2b] hover:underline">
                  {post.author}
                </p>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${getTrashTypeColor(post.type)}`}>
                  {post.type}
                </span>
              </div>
              <p className="text-[12px] text-[#667d70] mt-0.5">{post.time}</p>
            </div>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-500 hover:text-emerald-600 transition-colors p-2"
            >
              <MoreHorizontal size={16} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && ownPost && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#dbe7dc] rounded-lg shadow-lg z-10">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors text-sm"
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-3 cursor-pointer" onClick={() => setIsDetailOpen(true)}>
          <h3 className="font-semibold text-[14px] leading-tight text-[#173928] mb-1.5">{post.title}</h3>
          <p className="text-[12px] leading-[1.35] text-[#395447]">{post.content}</p>
        </div>

        {/* Image */}
        <div
          className="rounded-xl overflow-hidden mb-2.5 border border-[#e3ece4] cursor-pointer"
          onClick={() => setIsDetailOpen(true)}
        >
          <img
            src={post.img}
            alt={post.title}
            className="w-full aspect-[4/5] object-cover hover:scale-105 transition-transform"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-[11px] text-[#60766a] px-1.5 py-1.5 mb-2.5 border-t border-b border-[#e3ece4]">
          <span>{post.likes > 0 ? `${post.likes} orang menyukai` : 'Jadilah yang pertama menyukai'}</span>
          <div className="flex items-center gap-4">
            <span>{post.commentList.length} komentar</span>
            <span>{post.shares} bagian</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-1">
          <button
            onClick={toggleLike}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold text-[12px] transition-colors ${
              post.liked
                ? 'text-red-600'
                : 'text-[#2f4a3d] hover:bg-[#eef4ef]'
            }`}
          >
            <Heart size={14} fill={post.liked ? 'currentColor' : 'none'} />
            Suka
          </button>
          <button
            onClick={() => setShowComments((v) => !v)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold text-[12px] transition-colors ${
              showComments ? 'text-[#1b5c43] bg-[#eef4ef]' : 'text-[#2f4a3d] hover:bg-[#eef4ef]'
            }`}
          >
            <MessageCircle size={14} />
            Komentar
          </button>
          <button
              onClick={() => savePost(post.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold text-[12px] transition-colors ${
                post.saved
                  ? 'text-[#1b5c43] bg-[#eef4ef]'
                  : 'text-[#2f4a3d] hover:bg-[#eef4ef]'
              }`}
            >
              <Bookmark size={14} fill={post.saved ? 'currentColor' : 'none'} />
              {post.saved ? 'Tersimpan' : 'Simpan'}
          </button>
        </div>

        {showComments && (
          <CommentSection
            postId={post.id} 
            comments={post.commentList}
            onAddComment={(text) => addComment(post.id, text)}
          />
        )}
      </div>
    </>
  );
}
