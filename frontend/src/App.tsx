"use client";
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import ScanModal from './components/ScanModal';
import PostCard from './components/PostCard';
import ProfilePage from './components/ProfilePage';
import ResultPage from './components/ResultPage';
import SavedPage from './components/SavedPage';
import CreatePostPage from './components/CreatePostPage';
import { MOCK_POSTS, TRENDING } from './lib/mockData';
import { PostsProvider, usePosts } from './context/PostsContext';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { UserStatsProvider, useUserStats } from './context/UserStatsContext';
import { getWeeklyImpact } from './lib/achievements';
import LoginPage from './components/LoginPage';
import { FollowProvider } from './context/FollowContext';
import { Leaf } from 'lucide-react';


// ─── Types (mirror dari Pydantic backend) ─────────────────────────────────────
export type TrashType   = 'Organik' | 'Anorganik' | 'B3';
export type Difficulty  = 'Mudah' | 'Sedang' | 'Sulit';
export type WarningIcon = 'flame' | 'drop' | 'warning';
export type PageId      = 'home' | 'profile' | 'saved' | 'create' | 'result';

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

// ─── Desktop Layout Home Page ─────────────────────────────────────────────────

function AppContent() {
  const { isLoggedIn, isOwnPost,isAuthLoading } = useProfile();
  const [scanOpen, setScanOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [profileUserId, setProfileUserId] = useState<string>('me');
  const [analysisResult, setAnalysisResult] = useState<TrashAnalysisResult | null>(null);
  const [analysisImageUrl, setAnalysisImageUrl] = useState<string | null>(null);
  const { posts } = usePosts();
  const { stats, recordScan } = useUserStats();

  const ownPostCount = posts.filter((p) => isOwnPost(p.author, p.authorId)).length;
  const weeklyImpact = getWeeklyImpact(stats, ownPostCount);

  useEffect(() => {
    return () => {
      if (analysisImageUrl) URL.revokeObjectURL(analysisImageUrl);
    };
  }, [analysisImageUrl]);

  const openProfile = (userId: string) => {
    setProfileUserId(userId);
    setCurrentPage('profile');
  };

  const openOwnProfile = () => openProfile('me');


  // added part
  if (isAuthLoading) {
    return (
      <div className="h-screen bg-[#edf5ee] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#2fd57f] flex items-center justify-center shadow-md shadow-[#8bd9b0]/40 animate-pulse">
            <Leaf size={28} className="text-[#113b2a]" />
          </div>
          <p className="text-[13px] text-[#60766a]">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#edf5ee]">
      <Sidebar
        onScanClick={() => setScanOpen(true)}
        onNavigate={(page) => {
          if (page === 'profile') openOwnProfile();
          else setCurrentPage(page);
        }}
        currentPage={currentPage === 'profile' && profileUserId === 'me' ? 'profile' : currentPage}
      />

      {/* Main — scroll di tepi kanan; feed + panel kanan ikut scroll bersama */}
      <main className="flex-1 min-h-0 overflow-y-auto min-w-0">
        {currentPage === 'home' ? (
          <div className="flex items-start w-full min-h-full">
            {/* Feed — postingan di tengah kolom */}
            <div className="flex-[1.6] min-w-0 flex flex-col items-center border-r border-[#dbe7dc] pb-8">

              {/* <StoryReel stories={MOCK_STORIES} /> */}

              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onViewProfile={openProfile}
                />
              ))}
            </div>

            {/* Panel kanan — Dampak sticky saat scroll */}
            <aside className="w-[320px] flex-shrink-0 hidden xl:block border-l border-[#dbe7dc] bg-[#F8FAF5] sticky top-0 h-screen overflow-y-auto">
              <div className="sticky top-0 z-10 px-6 pt-6 pb-4 bg-[#F8FAF5]">
                <div className="bg-[#e9f2ea] border border-[#d7e6d9] rounded-3xl p-5">
                  <p className="text-[12px] tracking-[0.12em] font-semibold text-[#1b5c43] mb-4 uppercase">Dampak minggu ini</p>
                  <div className="flex flex-col gap-3">
                    {weeklyImpact.map((s) => (
                      <div key={s.key} className="bg-white rounded-2xl px-4 py-3 border border-[#e6efdf]">
                        <div className="text-3xl leading-none font-semibold text-[#1b5c43]">{s.val}</div>
                        <div className="text-[11px] text-[#436d58] uppercase tracking-wide mt-1">{s.key}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-8">
                <p className="text-[11px] font-semibold text-[#506256] uppercase tracking-[0.16em] mb-3">Trending sekarang</p>
                <div>
                  {TRENDING.map((t, i) => (
                    <div
                      key={t.tag}
                      className="flex items-center gap-3 py-2.5 border-b border-[#dbe7dc] last:border-0 cursor-pointer hover:bg-[#e5efe6] -mx-1 px-1 rounded transition-colors"
                    >
                      <span className="text-[16px] font-semibold text-[#516458] w-6">{i + 1}</span>
                      <div>
                        <p className="text-[12px] leading-none font-semibold text-[#173928]">{t.tag}</p>
                        <p className="text-[12px] text-[#5f7367]">{t.posts} postingan</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        ) : currentPage === 'profile' ? (
          <ProfilePage
            userId={profileUserId}
            onViewProfile={openProfile}
            onBack={
              profileUserId !== 'me'
                ? () => {
                    setProfileUserId('me');
                    setCurrentPage('home');
                  }
                : undefined
            }
          />
        ) : currentPage === 'saved' ? (
          <SavedPage />
        ) : currentPage === 'create' ? (
          <CreatePostPage onBackToFeed={() => setCurrentPage('home')} />
        ) : (
          <ResultPage
            result={analysisResult}
            imageUrl={analysisImageUrl}
            onBackHome={() => setCurrentPage('home')}
          />
        )}
      </main>

      <ScanModal
        isOpen={scanOpen}
        onClose={() => setScanOpen(false)}
        onAnalyzeSuccess={(result, imageUrl) => {
          recordScan(result);
          setAnalysisResult(result);
          setAnalysisImageUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return imageUrl;
          });
          setCurrentPage('result');
        }}
      />
    </div>
  );
}

function AppWithPosts() {
  const { sessionKey } = useProfile();
  return (
    <FollowProvider key={sessionKey}>
      <UserStatsProvider key={sessionKey}>
        <PostsProvider key={sessionKey} initialPosts={MOCK_POSTS}>
          <AppContent />
        </PostsProvider>
      </UserStatsProvider>
    </FollowProvider>
  );
}

export default function App() {
  return (
    <ProfileProvider>
      <AppWithPosts />
    </ProfileProvider>
  );
}
