import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import type { TrashType } from '../App';
import { useProfile, CURRENT_USER_ID, DEFAULT_PROFILE } from './ProfileContext';

export interface Comment {
  id: number;
  author: string;
  av: string;
  authorId?: string;
  text: string;
  time: string;
}

export interface Post {
  id: string;
  author: string;
  av: string;
  authorId: string;
  time: string;
  type: TrashType;
  title: string;
  content: string;
  img: string;
  likes: number;
  commentList: Comment[];
  shares: number;
  liked: boolean;
  saved: boolean; // ← tambah

}

interface PostsContextType {
  posts: Post[];
  addPost: (post: Omit<Post, 'id'>) => void;
  updatePost: (id: string, updates: Partial<Post>) => void; // ✅ string
  deletePost: (id: string) => void;                         // ✅ string
  likePost: (id: string) => Promise<void>;                       // ✅ string
  addComment: (postId: string, text: string) => Promise<void>;       // ✅ string
  savePost: (id: string) => Promise<void>; // ← tambah

}

const PostsContext = createContext<PostsContextType | undefined>(undefined);
const API_BASE  = import.meta.env.VITE_API_URL ?? 'https://soft-eng-project-trashform.vercel.app';


type PostsProviderProps = {
  children: React.ReactNode
  initialPosts?: any[] 
}
function isCurrentUserContent(author: string, authorId?: string, profileName?: string) {
  return (
    authorId === CURRENT_USER_ID ||
    author === profileName ||
    author === DEFAULT_PROFILE.name
  );
}

export function PostsProvider({ children }: PostsProviderProps) {
  const { profile,isLoggedIn } = useProfile();
  const profileRef = useRef(profile);
  const [posts, setPosts] = useState<Post[]>([]);
  
  const { authFetch } = useProfile();


  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await authFetch(`${API_BASE}/home`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed fetch posts');
      }

      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ FIX: Hapus `posts` dari dependency — hanya fetch sekali saat mount
  // useEffect(() => {
  //   fetchPosts();
  // }, []);
  useEffect(() => {
    if (isLoggedIn) {
      fetchPosts(); // login → fetch dengan token baru
    } else {
      setPosts([]); // logout → bersihkan posts
    }
  }, [isLoggedIn]); // ← watch isLoggedIn, bukan posts


  // Sinkronkan nama & avatar di postingan/komentar milik user saat profil berubah
  useEffect(() => {
    const prev = profileRef.current;
    if (prev.name === profile.name && prev.av === profile.av) return;

    setPosts((current) =>
      current.map((post) => {
        if (!isCurrentUserContent(post.author, post.authorId, prev.name)) return post;
        return {
          ...post,
          authorId: CURRENT_USER_ID,
          author: profile.name,
          av: profile.av,
          commentList: post.commentList.map((c) =>
            isCurrentUserContent(c.author, c.authorId, prev.name)
              ? { ...c, authorId: CURRENT_USER_ID, author: profile.name, av: profile.av }
              : c
          ),
        };
      })
    );
    profileRef.current = profile;
  }, [profile.name, profile.av]);

  const addPost = (newPost: Omit<Post, 'id'>) => {
    // ✅ FIX: Generate UUID untuk string id, bukan Math.max
    const id = crypto.randomUUID();
    setPosts((prev) => [{ ...newPost, id }, ...prev]);
  };

  // ✅ FIX: Semua parameter id diubah ke string
  const updatePost = (id: string, updates: Partial<Post>) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deletePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  // const likePost = (id: string) => {
  //   setPosts((prev) =>
  //     prev.map((p) => {
  //       if (p.id === id) {
  //         return {
  //           ...p,
  //           liked: !p.liked,
  //           likes: p.liked ? p.likes - 1 : p.likes + 1,
  //         };
  //       }
  //       return p;
  //     })
  //   );
  // };

  const likePost = async (id: string) => {
    const token = localStorage.getItem('token');

    // Optimistic update — langsung update UI dulu
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );

    try {
      const res = await authFetch(`${API_BASE}/posts/${id}/likes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to like post');

      const data = await res.json(); // { liked: bool, likes: number }

      // Sync dengan data real dari server
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, liked: data.liked, likes: data.likes } : p
        )
      );
    } catch (err) {
      console.error(err);
      // Rollback jika gagal
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
            : p
        )
      );
    }
  };

  const addComment = async (postId: string, text: string) => {
    const token = localStorage.getItem('token');

    try {
      const res = await authFetch(`${API_BASE}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error('Failed to add comment');

      const newComment = await res.json(); // CommentResponse dari backend

      setPosts((prev) =>
        prev.map((p) =>
          p.id !== postId
            ? p
            : { ...p, commentList: [...p.commentList, newComment] }
        )
      );
    } catch (err) {
      console.error(err);
    }
  };
  // const addComment = (postId: string, text: string) => {
  //   setPosts((prev) =>
  //     prev.map((p) => {
  //       if (p.id !== postId) return p;
  //       const commentId = Math.max(0, ...p.commentList.map((c) => c.id)) + 1;
  //       const newComment: Comment = {
  //         id: commentId,
  //         author: profile.name,
  //         av: profile.av,
  //         authorId: CURRENT_USER_ID,
  //         text,
  //         time: 'Baru saja',
  //       };
  //       return { ...p, commentList: [...p.commentList, newComment] };
  //     })
  //   );
  // };
  const savePost = async (id: string) => {
    const token = localStorage.getItem('token');

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, saved: !p.saved } : p
      )
    );

    try {
      const res = await authFetch(`${API_BASE}/posts/${id}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to save post');
      const data = await res.json(); // { saved: bool }

      // Sync dengan server
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, saved: data.saved } : p
        )
      );
    } catch (err) {
      console.error(err);
      // Rollback
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, saved: !p.saved } : p
        )
      );
    }
  };

  const value: PostsContextType = {
    posts,
    addPost,
    updatePost,
    deletePost,
    likePost,
    addComment,
    savePost
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
}