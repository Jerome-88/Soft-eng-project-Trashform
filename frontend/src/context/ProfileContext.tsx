import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js'

export const CURRENT_USER_ID = 'me';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)


export interface UserProfile {
  name: string;
  username: string;
  location: string;
  bio: string;
  avatar: string | null;
  av: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://soft-eng-project-trashform.vercel.app';


export const DEFAULT_PROFILE: UserProfile = {
  name: 'EEVEE',
  username: '@eeve_berkarya',
  location: 'Jakarta Selatan',
  bio: 'Mengubah sampah jadi karya bernilai. Eco warrior sejak 2022. Berbagi tips upcycling setiap hari.',
  avatar: null,
  av: 'EV',
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function normalizeUsername(username: string): string {
  const trimmed = username.trim();
  if (!trimmed) return DEFAULT_PROFILE.username;
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

export function usernameDisplay(username: string): string {
  return username.startsWith('@') ? username.slice(1) : username;
}

function buildProfile(data: Partial<UserProfile>): UserProfile {
  const name = data.name?.trim() || DEFAULT_PROFILE.name;
  return {
    name,
    username: data.username !== undefined ? normalizeUsername(data.username) : DEFAULT_PROFILE.username,
    location: data.location?.trim() || DEFAULT_PROFILE.location,
    bio: data.bio ?? DEFAULT_PROFILE.bio,
    avatar: data.avatar ?? null,
    av: getInitials(name),
  };
}

export type ProfileUpdate = {
  name?: string;
  username?: string;
  location?: string;
  bio?: string;
  avatar?: string | null;
};

interface ProfileContextType {
  profile: UserProfile;
  isLoggedIn: boolean;
  sessionKey: number;
  isAuthLoading: boolean  // tambah ini
  updateProfile: (updates: ProfileUpdate) => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<any> 
  register: (email: string, password: string, username: string) => Promise<void>; // ← tambah
  isOwnPost: (author: string, authorId?: string) => boolean;
  isOwnComment: (author: string, authorId?: string) => boolean;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;


}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  // const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') !== 'false');
  const [sessionKey, setSessionKey] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // ← default true

  
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const authFetch = useCallback(async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options?.headers,
      },
    });

    if (res.status === 401) {
      // Token expired → auto logout
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setSessionKey((k) => k + 1);
      throw new Error('Session expired');
    }

    return res;
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        return;
      }

      //Fetch profile sekalian validasi token
      const res = await authFetch(`${API_BASE}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        return;
      }

      const p = await res.json();

      //Set profile dari API
      setProfile({
        name: p.name,
        username: p.username,
        location: '',
        bio: p.bio ?? '',
        avatar: p.avatar ?? null,
        av: p.av,
      });
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem('token'); 
        setIsLoggedIn(false);
      } finally {
        setIsAuthLoading(false); 
      }
    };

    checkAuth();
  }, []);

  const isOwnPost = useCallback(
    (author: string, authorId?: string) =>
      authorId === CURRENT_USER_ID ||
      author === profile.name ||
      author === DEFAULT_PROFILE.name,
    [profile.name]
  );

  const isOwnComment = isOwnPost;

  const updateProfile = (updates: ProfileUpdate) => {
    setProfile((prev) =>
      buildProfile({
        ...prev,
        ...updates,
        name: updates.name !== undefined ? updates.name : prev.name,
        username: updates.username !== undefined ? updates.username : prev.username,
        location: updates.location !== undefined ? updates.location : prev.location,
        bio: updates.bio !== undefined ? updates.bio : prev.bio,
        avatar: updates.avatar !== undefined ? updates.avatar : prev.avatar,
      })
    );
  };

  const logout = () => {
    localStorage.removeItem('userProfile');
    localStorage.removeItem('posts');
    localStorage.removeItem('userStats');
    localStorage.removeItem('following');
    localStorage.setItem('isLoggedIn', 'false');
    setProfile(DEFAULT_PROFILE);
    setIsLoggedIn(false);
    setSessionKey((k) => k + 1);
  };

//   const login = async (email: string, password: string) => {
//   const { data, error } = await supabase.auth.signInWithPassword({ email, password })
//   if (error) throw error
//   localStorage.setItem('isLoggedIn', 'true');
//   localStorage.setItem('token', data.session.access_token);
//   setIsLoggedIn(true);
//   return data
// }
const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  localStorage.setItem('token', data.session.access_token);

  // ✅ Fetch profile dari API setelah login
  try {
    const res = await fetch(`${API_BASE}/profile/me`, {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    if (res.ok) {
      const p = await res.json();
      setProfile({
        name: p.name,
        username: p.username,
        location: '',
        bio: p.bio ?? '',
        avatar: p.avatar ?? null,
        av: p.av,
      });
    }
  } catch (err) {
    console.error('Failed to fetch profile after login', err);
  }

  setIsLoggedIn(true);
  return data;
};

const register = async (email: string, password: string, username: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username, 
      },
    },
  });

  if (error) throw new Error(error.message);
  // Trigger DB otomatis insert ke tabel profile
};

  return (
    <ProfileContext.Provider
      value={{ profile, isLoggedIn, sessionKey, isAuthLoading,updateProfile, logout, login,register, isOwnPost, isOwnComment,authFetch }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within ProfileProvider');
  return context;
}


