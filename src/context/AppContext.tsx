import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { User, ApkItem, CourseItem, Category, ViewTab, AppSettings } from '../types';
import { api } from '../services/api';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  settings: Partial<AppSettings>;
  setSettings: React.Dispatch<React.SetStateAction<Partial<AppSettings>>>;
  purchasedApkIds: string[];
  enrolledCourseIds: string[];
  toasts: Toast[];
  
  // Modals & Active items
  selectedApk: ApkItem | null;
  setSelectedApk: (apk: ApkItem | null) => void;
  selectedCourse: CourseItem | null;
  setSelectedCourse: (course: CourseItem | null) => void;
  activePlayer: { courseId: string; lessonId?: string } | null;
  setActivePlayer: (player: { courseId: string; lessonId?: string } | null) => void;
  checkoutItem: { item: ApkItem | CourseItem; type: 'apk' | 'course' } | null;
  setCheckoutItem: (item: { item: ApkItem | CourseItem; type: 'apk' | 'course' } | null) => void;
  
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: 'login' | 'register';
  setAuthModalTab: (tab: 'login' | 'register') => void;
  forgotPasswordOpen: boolean;
  setForgotPasswordOpen: (open: boolean) => void;
  userProfileOpen: boolean;
  setUserProfileOpen: (open: boolean) => void;
  
  // Actions
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasAccess: (itemId: string, type: 'apk' | 'course', accessType: 'FREE' | 'PAID') => boolean;
  startDownload: (apk: ApkItem) => Promise<void>;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  triggerSuccessCelebration: () => void;
  
  // Global search trigger
  openSearch: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('apphub_token'));
  const [activeTab, setActiveTab] = useState<ViewTab>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Partial<AppSettings>>({
    siteName: 'AppHub & Academy',
    siteTagline: 'Verified Digital Downloads & Video Courses',
    primaryCurrency: 'BDT'
  });
  const [purchasedApkIds, setPurchasedApkIds] = useState<string[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);

  // Modals state
  const [selectedApk, setSelectedApk] = useState<ApkItem | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [activePlayer, setActivePlayer] = useState<{ courseId: string; lessonId?: string } | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<{ item: ApkItem | CourseItem; type: 'apk' | 'course' } | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast = { ...t, id };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, t.duration || 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const triggerSuccessCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  // Fetch current user and entitlements
  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('apphub_token');
    if (!currentToken) {
      setUser(null);
      setPurchasedApkIds([]);
      setEnrolledCourseIds([]);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setPurchasedApkIds(res.purchasedApkIds || []);
      setEnrolledCourseIds(res.enrolledCourseIds || []);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      localStorage.removeItem('apphub_token');
      setToken(null);
      setUser(null);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshUser();
    api.getCategories().then(setCategories).catch(console.error);
    api.getHomeContent().then(res => {
      if (res.settings) setSettings(res.settings);
    }).catch(console.error);
  }, [refreshUser]);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    localStorage.setItem('apphub_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    await refreshUser();
    addToast({
      type: 'success',
      title: `Welcome back, ${res.user.name}!`,
      message: res.user.role === 'admin' ? 'Logged in with Super Admin privileges.' : 'You are now signed in.'
    });
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await api.register({ name, email, password: pass });
    localStorage.setItem('apphub_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    await refreshUser();
    addToast({
      type: 'success',
      title: 'Registration Successful!',
      message: 'Your account is ready. Welcome to AppHub & Academy!'
    });
    triggerSuccessCelebration();
  };

  const logout = () => {
    localStorage.removeItem('apphub_token');
    setToken(null);
    setUser(null);
    setPurchasedApkIds([]);
    setEnrolledCourseIds([]);
    if (activeTab === 'admin' || activeTab === 'library') {
      setActiveTab('home');
    }
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been safely signed out.'
    });
  };

  const hasAccess = useCallback((itemId: string, type: 'apk' | 'course', accessType: 'FREE' | 'PAID'): boolean => {
    if (accessType === 'FREE') return true;
    if (user?.role === 'admin') return true;
    if (!user) return false;

    if (type === 'apk') {
      return purchasedApkIds.includes(itemId);
    } else {
      return enrolledCourseIds.includes(itemId);
    }
  }, [user, purchasedApkIds, enrolledCourseIds]);

  const startDownload = async (apk: ApkItem) => {
    if (!user) {
      setAuthModalTab('login');
      setAuthModalOpen(true);
      addToast({
        type: 'warning',
        title: 'Account Required',
        message: 'Please log in or create a free account to download APK files.'
      });
      return;
    }

    if (apk.accessType === 'PAID' && !hasAccess(apk.id, 'apk', 'PAID')) {
      setCheckoutItem({ item: apk, type: 'apk' });
      return;
    }

    try {
      addToast({
        type: 'info',
        title: 'Preparing Download',
        message: `Generating cryptographic token for ${apk.fileName}...`,
        duration: 2500
      });

      const res = await api.generateApkDownloadToken(apk.id);
      
      // Trigger browser download via dynamic link
      const link = document.createElement('a');
      link.href = res.downloadUrl;
      link.setAttribute('download', res.fileName || 'app-release.apk');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        type: 'success',
        title: 'Download Started!',
        message: `${apk.title} ${apk.version} (${apk.fileSize}) is downloading. SHA-256 verified.`
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: err.message || 'Could not initiate secure download.'
      });
    }
  };

  const openSearch = () => {
    const input = document.getElementById('global-search-input');
    if (input) {
      input.focus();
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!user,
        isAdmin: user?.role === 'admin',
        activeTab,
        setActiveTab,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        categories,
        setCategories,
        settings,
        setSettings,
        purchasedApkIds,
        enrolledCourseIds,
        toasts,
        selectedApk,
        setSelectedApk,
        selectedCourse,
        setSelectedCourse,
        activePlayer,
        setActivePlayer,
        checkoutItem,
        setCheckoutItem,
        authModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        forgotPasswordOpen,
        setForgotPasswordOpen,
        userProfileOpen,
        setUserProfileOpen,
        login,
        register,
        logout,
        refreshUser,
        hasAccess,
        startDownload,
        addToast,
        removeToast,
        triggerSuccessCelebration,
        openSearch
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
