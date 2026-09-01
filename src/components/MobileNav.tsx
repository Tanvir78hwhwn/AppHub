import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Download, PlayCircle, FolderLock, ShieldCheck, User as UserIcon } from 'lucide-react';
import { ViewTab } from '../types';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, isLoggedIn, isAdmin, setAuthModalOpen, setAuthModalTab, setUserProfileOpen } = useApp();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      <button
        id="mobile-tab-home"
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all ${
          activeTab === 'home' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-[10px]">Explore</span>
      </button>

      <button
        id="mobile-tab-apks"
        onClick={() => setActiveTab('apks')}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all ${
          activeTab === 'apks' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Download className="w-5 h-5" />
        <span className="text-[10px]">APKs</span>
      </button>

      <button
        id="mobile-tab-courses"
        onClick={() => setActiveTab('courses')}
        className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all ${
          activeTab === 'courses' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <PlayCircle className="w-5 h-5" />
        <span className="text-[10px]">Courses</span>
      </button>

      {isLoggedIn ? (
        <button
          id="mobile-tab-library"
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all ${
            activeTab === 'library' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderLock className="w-5 h-5" />
          <span className="text-[10px]">Library</span>
        </button>
      ) : (
        <button
          id="mobile-tab-auth"
          onClick={() => {
            setAuthModalTab('login');
            setAuthModalOpen(true);
          }}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-slate-400 hover:text-slate-200"
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px]">Login</span>
        </button>
      )}

      {isAdmin && (
        <button
          id="mobile-tab-admin"
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all ${
            activeTab === 'admin' ? 'text-amber-400 font-semibold' : 'text-amber-500/70 hover:text-amber-400'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px]">Admin</span>
        </button>
      )}
    </nav>
  );
};
