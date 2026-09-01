import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Download, 
  PlayCircle, 
  FolderLock, 
  ShieldCheck, 
  User as UserIcon, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Menu, 
  X,
  Sparkles,
  Layers,
  ShoppingBag,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { ViewTab } from '../types';

export const Navbar: React.FC = () => {
  const { 
    user, 
    isLoggedIn, 
    isAdmin, 
    activeTab, 
    setActiveTab, 
    searchQuery, 
    setSearchQuery, 
    logout, 
    setAuthModalOpen, 
    setAuthModalTab,
    setUserProfileOpen,
    purchasedApkIds,
    enrolledCourseIds
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Explore', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'apks', label: 'APKs & Apps', icon: <Download className="w-4 h-4" /> },
    { id: 'courses', label: 'Video Courses', icon: <PlayCircle className="w-4 h-4" /> },
    { id: 'free', label: '100% Free Zone', icon: <Layers className="w-4 h-4" /> },
    ...(isLoggedIn ? [{ 
      id: 'library' as ViewTab, 
      label: 'My Library', 
      icon: <FolderLock className="w-4 h-4" />,
      badge: ((purchasedApkIds?.length || 0) + (enrolledCourseIds?.length || 0)) || undefined
    }] : [])
  ];

  const handleTabClick = (tab: ViewTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => handleTabClick('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  AppHub
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  Academy
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Digital APKs & Video Courses</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {isAdmin && (
              <button
                id="nav-link-admin"
                onClick={() => handleTabClick('admin')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search APKs, Kotlin, React, Tools..."
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* User Auth Buttons / Profile Menu */}
          <div className="flex items-center gap-2.5">
            {isLoggedIn && user ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition-all"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover bg-slate-700"
                  />
                  <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline-block">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown */}
                {userDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 py-1 text-sm animate-in fade-in zoom-in-95">
                      <div className="px-3.5 py-2.5 border-b border-slate-800">
                        <p className="font-semibold text-slate-100 text-xs truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Administrator
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          handleTabClick('library');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 text-left"
                      >
                        <FolderLock className="w-4 h-4 text-indigo-400" />
                        <span>My Library & Downloads</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserProfileOpen(true);
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 text-left"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Profile & Security</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            handleTabClick('admin');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-amber-300 hover:bg-amber-500/10 text-left"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      <div className="border-t border-slate-800 my-1" />

                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-login"
                  onClick={() => {
                    setAuthModalTab('login');
                    setAuthModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700 transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
                <button
                  id="btn-register"
                  onClick={() => {
                    setAuthModalTab('register');
                    setAuthModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Register</span>
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps, APKs, courses..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none"
            />
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-800 space-y-1 animate-in slide-in-from-top-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                  activeTab === item.id
                    ? 'bg-indigo-600/20 text-indigo-400 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500 text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            {isAdmin && (
              <button
                onClick={() => handleTabClick('admin')}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-amber-500/10 font-medium"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
