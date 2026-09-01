import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ApkItem, CourseItem, Category, Order, User, AppSettings, Lesson } from '../../types';
import { 
  ShieldCheck, 
  Download, 
  PlayCircle, 
  Layers, 
  Receipt, 
  Users, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  Upload, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Save, 
  Check, 
  Sparkles,
  ExternalLink,
  Lock,
  ListPlus,
  Loader2,
  MessageCircle,
  Send
} from 'lucide-react';
import { WhatsAppOrdersSection } from './WhatsAppOrdersSection';
import { AutoImportSection } from './AutoImportSection';
import { Zap } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, addToast, categories, setCategories, settings, setSettings } = useApp();
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'whatsapp-orders' | 'auto-import' | 'apks' | 'courses' | 'categories' | 'orders' | 'users' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalApks: 0,
    totalCourses: 0,
    totalPurchases: 0,
    totalDownloads: 0,
    totalRevenue: 0,
    recentUsers: [],
    recentPurchases: [],
    recentDownloads: [],
    revenueByGateway: {}
  });

  // Entities
  const [apks, setApks] = useState<ApkItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Modals & Form states
  const [editingApk, setEditingApk] = useState<Partial<ApkItem> | null>(null);
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [apkThumbFile, setApkThumbFile] = useState<File | null>(null);
  const [apkUploading, setApkUploading] = useState(false);

  const [editingCourse, setEditingCourse] = useState<Partial<CourseItem> | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [courseSaving, setCourseSaving] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [savingSettings, setSavingSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, apksRes, coursesRes, ordersRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminApks(),
        api.getAdminCourses(),
        api.getAdminOrders(),
        api.getAdminUsers()
      ]);

      setStats(statsRes);
      setApks(apksRes.apks || []);
      setCourses(coursesRes.courses || []);
      setOrders(ordersRes.orders || []);
      setUsersList(usersRes.users || []);
    } catch (err: any) {
      console.error('Admin data load error:', err);
      addToast({
        type: 'error',
        title: 'Data Load Error',
        message: err.message || 'Failed to load admin stats.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="text-center py-24 px-4 bg-slate-900/40 rounded-3xl border border-slate-800">
        <ShieldCheck className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400 mt-1">
          You must be signed in with an Administrator account to view this control panel.
        </p>
      </div>
    );
  }

  // Handle APK Save / Upload
  const handleSaveApk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApk?.title || !editingApk?.category) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Title and Category are required.' });
      return;
    }

    setApkUploading(true);
    try {
      let fileUrl = editingApk.fileUrl || '';
      let fileName = editingApk.fileName || 'app-release.apk';
      let fileSize = editingApk.fileSize || '25.0 MB';
      let sha256Checksum = editingApk.sha256Checksum || '';
      let thumbnail = editingApk.thumbnail || 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=800&auto=format&fit=crop&q=80';

      // If file is selected, upload via multipart
      if (apkFile || apkThumbFile) {
        const formData = new FormData();
        if (apkFile) formData.append('apkFile', apkFile);
        if (apkThumbFile) formData.append('thumbnailFile', apkThumbFile);

        const uploadRes = await api.uploadFile(formData);
        if (uploadRes.apk) {
          fileUrl = uploadRes.apk.fileUrl;
          fileName = uploadRes.apk.fileName;
          fileSize = uploadRes.apk.fileSize;
          sha256Checksum = uploadRes.apk.checksum;
        }
        if (uploadRes.thumbnail) {
          thumbnail = uploadRes.thumbnail.url;
        }
      }

      const payload: Partial<ApkItem> = {
        ...editingApk,
        fileUrl: fileUrl || editingApk.fileUrl || '/downloads/sample.apk',
        fileName,
        fileSize,
        thumbnail,
        sha256Checksum: sha256Checksum || editingApk.sha256Checksum
      };

      if (editingApk.id) {
        await api.updateAdminApk(editingApk.id, payload);
        addToast({ type: 'success', title: 'APK Updated', message: 'Application package saved successfully.' });
      } else {
        await api.createAdminApk(payload);
        addToast({ type: 'success', title: 'APK Published', message: 'New application package published.' });
      }

      setEditingApk(null);
      setApkFile(null);
      setApkThumbFile(null);
      loadAllAdminData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Upload Failed', message: err.message || 'Could not save APK.' });
    } finally {
      setApkUploading(false);
    }
  };

  const handleDeleteApk = async (id: string) => {
    if (!confirm('Are you sure you want to delete this APK package permanently?')) return;
    try {
      await api.deleteAdminApk(id);
      addToast({ type: 'success', title: 'APK Deleted', message: 'Package removed from directory.' });
      loadAllAdminData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  // Handle Course Save
  const handleOpenCourseEditor = async (course?: CourseItem) => {
    if (course) {
      try {
        const details = await api.getCourseDetail(course.id);
        setEditingCourse(details);
        setCourseLessons(details.lessons || []);
      } catch (err) {
        setEditingCourse(course);
        setCourseLessons([]);
      }
    } else {
      setEditingCourse({
        title: '',
        description: '',
        longDescription: '',
        category: categories[0]?.name || 'Web Development',
        instructor: user?.name || 'Lead Instructor',
        instructorBio: 'Full-Stack Software Engineer & Instructor',
        durationMinutes: 180,
        level: 'All Levels',
        accessType: 'PAID',
        price: 350,
        currency: 'BDT',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
        skills: ['React', 'TypeScript', 'Node.js']
      });
      setCourseLessons([]);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse?.title || !editingCourse?.category) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Title and Category are required.' });
      return;
    }

    setCourseSaving(true);
    try {
      const payload: Partial<CourseItem> = {
        ...editingCourse,
        lessons: courseLessons,
        totalLessons: courseLessons.length
      };

      if (editingCourse.id) {
        await api.updateAdminCourse(editingCourse.id, payload);
        addToast({ type: 'success', title: 'Course Updated', message: 'Course & lessons saved.' });
      } else {
        await api.createAdminCourse(payload);
        addToast({ type: 'success', title: 'Course Created', message: 'Masterclass published.' });
      }

      setEditingCourse(null);
      setCourseLessons([]);
      loadAllAdminData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setCourseSaving(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course and all its lessons?')) return;
    try {
      await api.deleteAdminCourse(id);
      addToast({ type: 'success', title: 'Course Deleted', message: 'Course removed.' });
      loadAllAdminData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  // Order Management
  const handleUpdateOrderStatus = async (orderId: string, status: 'PAID' | 'CANCELLED') => {
    try {
      await api.updateAdminOrderStatus(orderId, status);
      addToast({
        type: 'success',
        title: `Order marked as ${status}`,
        message: `Order status and user access rights updated.`
      });
      loadAllAdminData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Update Failed', message: err.message });
    }
  };

  // Category Management
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await api.createAdminCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim()
      });
      setCategories([...categories, res.category]);
      setNewCatName('');
      setNewCatDesc('');
      addToast({ type: 'success', title: 'Category Created', message: 'Category added to platform.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.deleteAdminCategory(id);
      setCategories(categories.filter(c => c.id !== id));
      addToast({ type: 'success', title: 'Category Deleted', message: 'Category removed.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api.updateAdminSettings(tempSettings);
      setSettings(res.settings);
      addToast({ type: 'success', title: 'Settings Saved', message: 'System configurations updated.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Root Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Admin Master Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage APK binaries, video courses, syllabus lessons, mobile payments, and security.
          </p>
        </div>

        <button
          onClick={loadAllAdminData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition-all self-start cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Admin Nav Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        {(() => {
          const pendingWhatsAppCount = (orders || []).filter(
            (o) => (o.paymentGateway === 'WhatsApp' || o.id.startsWith('WA-') || !!o.customerWhatsApp) && o.status === 'PENDING'
          ).length;

          return [
            { id: 'overview', label: 'Overview Stats', icon: <TrendingUp className="w-4 h-4" /> },
            { 
              id: 'auto-import', 
              label: 'Auto Import & Pricing', 
              icon: <Zap className="w-4 h-4 text-indigo-400" /> 
            },
            { 
              id: 'whatsapp-orders', 
              label: `Manual WhatsApp Orders`, 
              badge: pendingWhatsAppCount, 
              icon: <MessageCircle className="w-4 h-4 fill-current" /> 
            },
            { id: 'apks', label: `Manage APKs (${apks?.length || 0})`, icon: <Download className="w-4 h-4" /> },
            { id: 'courses', label: `Video Courses (${courses?.length || 0})`, icon: <PlayCircle className="w-4 h-4" /> },
            { id: 'categories', label: `Categories (${categories?.length || 0})`, icon: <Layers className="w-4 h-4" /> },
            { id: 'orders', label: `Orders & Ledger (${orders?.length || 0})`, icon: <Receipt className="w-4 h-4" /> },
            { id: 'users', label: `Users (${usersList?.length || 0})`, icon: <Users className="w-4 h-4" /> },
            { id: 'settings', label: 'System & Gateway Config', icon: <SettingsIcon className="w-4 h-4" /> }
          ].map((tab) => {
            const isTabActive = activeAdminTab === tab.id;
            const hasBadge = tab.badge && tab.badge > 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveAdminTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isTabActive
                    ? tab.id === 'auto-import'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : tab.id === 'whatsapp-orders'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {hasBadge ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          });
        })()}
      </div>

      {/* TAB 1: OVERVIEW STATS */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          {/* WhatsApp Orders Notification Banner in Overview */}
          {(() => {
            const pendingWhatsAppCount = (orders || []).filter(
              (o) => (o.paymentGateway === 'WhatsApp' || o.id.startsWith('WA-') || !!o.customerWhatsApp) && o.status === 'PENDING'
            ).length;

            return (
              <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900/80 to-slate-900/80 p-5 sm:p-6 rounded-3xl border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/20">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <MessageCircle className="w-6 h-6 fill-current" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>Manual WhatsApp Orders & Delivery Hub</span>
                      {pendingWhatsAppCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 animate-pulse">
                          {pendingWhatsAppCount} Pending Delivery
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          All Fulfilled
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xl">
                      Review manual payments, approve pending WhatsApp orders with 1-click unlock, and automatically trigger instant delivery messages with library access instructions.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveAdminTab('whatsapp-orders')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 shrink-0 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Open WhatsApp Hub</span>
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            );
          })()}

          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>Total Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </p>
              <p className="text-2xl font-extrabold text-white font-mono">{stats.totalRevenue.toLocaleString()} BDT</p>
              <p className="text-[10px] text-emerald-400">{stats.totalPurchases} completed purchases</p>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>Total APKs</span>
                <Download className="w-4 h-4 text-indigo-400" />
              </p>
              <p className="text-2xl font-extrabold text-white font-mono">{stats.totalApks}</p>
              <p className="text-[10px] text-slate-400">{stats.totalDownloads.toLocaleString()} total downloads</p>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>Video Courses</span>
                <PlayCircle className="w-4 h-4 text-violet-400" />
              </p>
              <p className="text-2xl font-extrabold text-white font-mono">{stats.totalCourses}</p>
              <p className="text-[10px] text-slate-400">Streamable masterclasses</p>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>Registered Users</span>
                <Users className="w-4 h-4 text-amber-400" />
              </p>
              <p className="text-2xl font-extrabold text-white font-mono">{stats.totalUsers}</p>
              <p className="text-[10px] text-slate-400">Active community</p>
            </div>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-indigo-900/40 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                <span>Auto Content Import</span>
              </h3>
              <p className="text-xs text-slate-400">
                Inspect public URLs to import APKs and video courses with SHA-256 validation, Gemini AI metadata, and auto-pricing.
              </p>
              <button
                onClick={() => setActiveAdminTab('auto-import')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Open Auto Importer</span>
              </button>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Upload New APK Package</span>
              </h3>
              <p className="text-xs text-slate-400">
                Publish a new Android application package or update existing binaries with automatic checksum calculation.
              </p>
              <button
                onClick={() => {
                  setEditingApk({
                    title: '',
                    description: '',
                    category: categories[0]?.name || 'Tools',
                    version: '1.0.0',
                    developer: user?.name || 'Verified Dev',
                    accessType: 'FREE',
                    price: 0,
                    currency: 'BDT',
                    packageId: 'com.apphub.app',
                    minAndroidVersion: 'Android 8.0+',
                    thumbnail: 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=800&auto=format&fit=crop&q=80',
                    changelog: ['Initial verified release']
                  });
                  setActiveAdminTab('apks');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish New APK</span>
              </button>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-violet-400" />
                <span>Create Video Masterclass</span>
              </h3>
              <p className="text-xs text-slate-400">
                Design a structured video course with multiple streamable lessons, free preview modules, and pricing.
              </p>
              <button
                onClick={() => {
                  handleOpenCourseEditor();
                  setActiveAdminTab('courses');
                }}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Course</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: AUTO IMPORT & PRICING */}
      {activeAdminTab === 'auto-import' && (
        <AutoImportSection onRefreshCatalog={loadAllAdminData} />
      )}

      {/* TAB: MANUAL WHATSAPP ORDERS */}
      {activeAdminTab === 'whatsapp-orders' && (
        <WhatsAppOrdersSection
          orders={orders}
          apks={apks}
          courses={courses}
          adminWhatsApp={settings?.adminWhatsApp || '+8801329179522'}
          adminName={settings?.adminName || 'Tanvir'}
          onRefresh={loadAllAdminData}
          onSelectTab={(t) => setActiveAdminTab(t as any)}
        />
      )}

      {/* TAB 2: APK MANAGER */}
      {activeAdminTab === 'apks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">APK Packages Directory</h2>
            <button
              onClick={() => setEditingApk({
                title: '',
                description: '',
                category: categories[0]?.name || 'Tools',
                version: '1.0.0',
                developer: user?.name || 'Verified Dev',
                accessType: 'FREE',
                price: 0,
                currency: 'BDT',
                packageId: 'com.apphub.app',
                minAndroidVersion: 'Android 8.0+',
                thumbnail: 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=800&auto=format&fit=crop&q=80',
                changelog: ['Initial verified release']
              })}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New APK</span>
            </button>
          </div>

          {/* List Table */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">App</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Version & Size</th>
                    <th className="p-3.5">Access / Price</th>
                    <th className="p-3.5">Downloads</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {apks.map((apk) => (
                    <tr key={apk.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 flex items-center gap-3">
                        <img src={apk.thumbnail} alt={apk.title} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <p className="font-bold text-white truncate max-w-xs">{apk.title}</p>
                          <p className="text-[10px] text-slate-400">{apk.developer}</p>
                        </div>
                      </td>
                      <td className="p-3.5">{apk.category}</td>
                      <td className="p-3.5 font-mono">{apk.version} ({apk.fileSize})</td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          apk.accessType === 'FREE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {apk.accessType === 'FREE' ? 'FREE' : `${apk.price} ${apk.currency}`}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">{apk.downloadsCount}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setEditingApk(apk)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                          title="Edit APK"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteApk(apk.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                          title="Delete APK"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* APK Editor Modal */}
      {editingApk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="fixed inset-0" onClick={() => !apkUploading && setEditingApk(null)} />
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-extrabold text-white">
                {editingApk.id ? 'Edit APK Package' : 'Upload & Publish New APK'}
              </h2>
              <button onClick={() => !apkUploading && setEditingApk(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveApk} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">APK Title *</label>
                  <input
                    type="text"
                    required
                    value={editingApk.title || ''}
                    onChange={(e) => setEditingApk({ ...editingApk, title: e.target.value })}
                    placeholder="e.g. Flutter Tools Pro"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Category *</label>
                  <select
                    value={editingApk.category || categories[0]?.name}
                    onChange={(e) => setEditingApk({ ...editingApk, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Short Description</label>
                <textarea
                  value={editingApk.description || ''}
                  onChange={(e) => setEditingApk({ ...editingApk, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Version</label>
                  <input
                    type="text"
                    value={editingApk.version || '1.0.0'}
                    onChange={(e) => setEditingApk({ ...editingApk, version: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Access Type</label>
                  <select
                    value={editingApk.accessType || 'FREE'}
                    onChange={(e) => setEditingApk({ ...editingApk, accessType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  >
                    <option value="FREE">100% Free</option>
                    <option value="PAID">Paid / Premium</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Price (BDT)</label>
                  <input
                    type="number"
                    value={editingApk.price || 0}
                    onChange={(e) => setEditingApk({ ...editingApk, price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Developer</label>
                  <input
                    type="text"
                    value={editingApk.developer || ''}
                    onChange={(e) => setEditingApk({ ...editingApk, developer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  />
                </div>
              </div>

              {/* Upload binary or URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Upload APK Binary (.apk)
                  </label>
                  <input
                    type="file"
                    accept=".apk,application/vnd.android.package-archive"
                    onChange={(e) => setApkFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    OR Direct Download URL
                  </label>
                  <input
                    type="url"
                    value={editingApk.fileUrl || ''}
                    onChange={(e) => setEditingApk({ ...editingApk, fileUrl: e.target.value })}
                    placeholder="https://storage.googleapis.com/.../app.apk"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  />
                </div>
              </div>

              {/* Thumbnail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Upload Thumbnail Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setApkThumbFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    OR Thumbnail Image URL
                  </label>
                  <input
                    type="url"
                    value={editingApk.thumbnail || ''}
                    onChange={(e) => setEditingApk({ ...editingApk, thumbnail: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingApk(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={apkUploading}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  {apkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save & Publish APK</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: VIDEO COURSES MANAGER */}
      {activeAdminTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Video Courses & Academy</h2>
            <button
              onClick={() => handleOpenCourseEditor()}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Course</span>
            </button>
          </div>

          {/* List Table */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Course</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Instructor</th>
                    <th className="p-3.5">Access / Price</th>
                    <th className="p-3.5">Lessons</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 flex items-center gap-3">
                        <img src={course.thumbnail} alt={course.title} className="w-12 h-8 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-white truncate max-w-xs">{course.title}</p>
                          <p className="text-[10px] text-slate-400">{course.level}</p>
                        </div>
                      </td>
                      <td className="p-3.5">{course.category}</td>
                      <td className="p-3.5">{course.instructor}</td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          course.accessType === 'FREE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {course.accessType === 'FREE' ? 'FREE' : `${course.price} ${course.currency}`}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">{course.totalLessons || 5}</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenCourseEditor(course)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                          title="Edit Course & Lessons"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Course & Lessons Editor Modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="fixed inset-0" onClick={() => !courseSaving && setEditingCourse(null)} />
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-extrabold text-white">
                {editingCourse.id ? 'Edit Masterclass & Syllabus' : 'Create New Video Course'}
              </h2>
              <button onClick={() => !courseSaving && setEditingCourse(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={editingCourse.title || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    placeholder="e.g. Kotlin Android Mastery"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Category *</label>
                  <select
                    value={editingCourse.category || categories[0]?.name}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Course Overview Description</label>
                <textarea
                  value={editingCourse.description || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Instructor</label>
                  <input
                    type="text"
                    value={editingCourse.instructor || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Access Type</label>
                  <select
                    value={editingCourse.accessType || 'PAID'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, accessType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  >
                    <option value="FREE">100% Free</option>
                    <option value="PAID">Paid Course</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Price (BDT)</label>
                  <input
                    type="number"
                    value={editingCourse.price || 0}
                    onChange={(e) => setEditingCourse({ ...editingCourse, price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Level</label>
                  <select
                    value={editingCourse.level || 'All Levels'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Thumbnail URL</label>
                <input
                  type="url"
                  value={editingCourse.thumbnail || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              {/* Lesson Manager inside Course Editor */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ListPlus className="w-4 h-4 text-violet-400" />
                    <span>Course Lessons Syllabus ({courseLessons.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const newLesson: Lesson = {
                        id: `lesson-${Date.now()}`,
                        courseId: editingCourse.id || '',
                        title: `Lesson ${courseLessons.length + 1}: Introduction`,
                        duration: '10:00',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        isFreePreview: courseLessons.length === 0,
                        position: courseLessons.length + 1,
                        description: 'Overview of lesson concepts'
                      };
                      setCourseLessons([...courseLessons, newLesson]);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Lesson</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {courseLessons.map((lesson, idx) => (
                    <div key={lesson.id || idx} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-violet-400 font-bold">#{idx + 1}</span>
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => {
                            const updated = [...courseLessons];
                            updated[idx].title = e.target.value;
                            setCourseLessons(updated);
                          }}
                          placeholder="Lesson Title"
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100 text-xs"
                        />
                        <input
                          type="text"
                          value={lesson.duration}
                          onChange={(e) => {
                            const updated = [...courseLessons];
                            updated[idx].duration = e.target.value;
                            setCourseLessons(updated);
                          }}
                          placeholder="12:30"
                          className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-100 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setCourseLessons(courseLessons.filter((_, i) => i !== idx))}
                          className="p-1 rounded text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={lesson.videoUrl || ''}
                          onChange={(e) => {
                            const updated = [...courseLessons];
                            updated[idx].videoUrl = e.target.value;
                            setCourseLessons(updated);
                          }}
                          placeholder="Video URL (YouTube / Vimeo / Google Drive / MP4 stream)"
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-100 text-xs"
                        />
                        <label className="flex items-center gap-1.5 text-[11px] text-emerald-400 shrink-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!lesson.isFreePreview}
                            onChange={(e) => {
                              const updated = [...courseLessons];
                              updated[idx].isFreePreview = e.target.checked;
                              setCourseLessons(updated);
                            }}
                            className="rounded bg-slate-900 border-slate-800 text-emerald-500 cursor-pointer"
                          />
                          <span>Free Preview</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={courseSaving}
                  className="px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-violet-600/30 cursor-pointer"
                >
                  {courseSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Masterclass & Syllabus</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORIES MANAGER */}
      {activeAdminTab === 'categories' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create Category Form */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Create New Category</span>
              </h3>
              <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. AI & Machine Learning"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Description</label>
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Brief description"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </form>
            </div>

            {/* List Existing Categories */}
            <div className="md:col-span-2 bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 font-bold text-white text-xs">
                Active Categories ({categories?.length || 0})
              </div>
              <div className="divide-y divide-slate-800/60">
                {(categories || []).map((cat) => (
                  <div key={cat.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{cat.name}</p>
                      <p className="text-[11px] text-slate-400">{cat.description || 'No description'}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ORDERS & TRANSACTIONS LEDGER */}
      {activeAdminTab === 'orders' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                All Transactions & Orders Ledger
              </h3>
              <span className="text-[11px] text-slate-400">{orders?.length || 0} total records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Order ID</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Item</th>
                    <th className="p-3.5">Gateway & TrxID</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Approve / Cancel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(orders || []).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono font-bold text-indigo-300">
                        #{order.id.substring(0, 8)}
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-200">{order.userName}</p>
                        <p className="text-[10px] text-slate-400">{order.userEmail}</p>
                      </td>
                      <td className="p-3.5 font-medium">{order.itemTitle}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          {order.paymentGateway === 'WhatsApp' ? (
                            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                              <MessageCircle className="w-3 h-3 fill-current" />
                            </span>
                          ) : null}
                          <p className="font-bold text-slate-200">{order.paymentGateway}</p>
                        </div>
                        <p className="text-[10px] font-mono text-emerald-400">{order.transactionId || (order.customerWhatsApp ? `WA: ${order.customerWhatsApp}` : 'Awaiting TrxID')}</p>
                      </td>
                      <td className="p-3.5 font-mono font-extrabold text-white">{order.amount} {order.currency}</td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          order.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : order.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        {order.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => {
                                if (order.paymentGateway === 'WhatsApp' || order.customerWhatsApp) {
                                  setActiveAdminTab('whatsapp-orders');
                                } else {
                                  handleUpdateOrderStatus(order.id, 'PAID');
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                            >
                              {order.paymentGateway === 'WhatsApp' ? 'Fulfill in WA Hub' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                              className="px-2 py-1 rounded-lg bg-rose-600/20 text-rose-400 text-[10px] cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {order.status === 'PAID' && (order.paymentGateway === 'WhatsApp' || order.customerWhatsApp) && (
                          <button
                            onClick={() => setActiveAdminTab('whatsapp-orders')}
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-semibold cursor-pointer"
                          >
                            WA Delivery
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: USERS MANAGER */}
      {activeAdminTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 font-bold text-white text-xs">
              Registered Accounts ({usersList?.length || 0})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(usersList || []).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 flex items-center gap-3">
                        <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt={u.name} className="w-8 h-8 rounded-full bg-slate-800" />
                        <span className="font-bold text-white">{u.name}</span>
                      </td>
                      <td className="p-3.5 font-mono">{u.email}</td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SYSTEM SETTINGS & PAYMENT GATEWAY CONFIG */}
      {activeAdminTab === 'settings' && (
        <div className="max-w-2xl bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white">System & Payment Gateway Configuration</h2>
            <p className="text-xs text-slate-400 mt-0.5">Customize website branding and bKash / Nagad mobile accounts.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Admin / Owner Name</label>
                <input
                  type="text"
                  value={tempSettings.adminName || 'Tanvir'}
                  onChange={(e) => setTempSettings({ ...tempSettings, adminName: e.target.value })}
                  placeholder="e.g., Tanvir"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-emerald-400 block mb-1">WhatsApp Order Number</label>
                <input
                  type="text"
                  value={tempSettings.adminWhatsApp || '+8801329179522'}
                  onChange={(e) => setTempSettings({ ...tempSettings, adminWhatsApp: e.target.value })}
                  placeholder="+8801329179522"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Site Name</label>
              <input
                type="text"
                value={tempSettings.siteName}
                onChange={(e) => setTempSettings({ ...tempSettings, siteName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Top Announcement Banner</label>
              <input
                type="text"
                value={tempSettings.noticeBanner || ''}
                onChange={(e) => setTempSettings({ ...tempSettings, noticeBanner: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-banner-chk"
                checked={!!tempSettings.showNoticeBanner}
                onChange={(e) => setTempSettings({ ...tempSettings, showNoticeBanner: e.target.checked })}
                className="rounded bg-slate-950 border-slate-800 text-indigo-600 cursor-pointer"
              />
              <label htmlFor="show-banner-chk" className="text-slate-300 cursor-pointer">
                Display Announcement Banner across site
              </label>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Mobile Financial Services (MFS) Gateway Numbers
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-pink-400 block mb-1">bKash Merchant No.</label>
                  <input
                    type="text"
                    value={tempSettings.bKashNumber || ''}
                    onChange={(e) => setTempSettings({ ...tempSettings, bKashNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-orange-400 block mb-1">Nagad Merchant No.</label>
                  <input
                    type="text"
                    value={tempSettings.nagadNumber || ''}
                    onChange={(e) => setTempSettings({ ...tempSettings, nagadNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-purple-400 block mb-1">Rocket Merchant No.</label>
                  <input
                    type="text"
                    value={tempSettings.rocketNumber || ''}
                    onChange={(e) => setTempSettings({ ...tempSettings, rocketNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="sandbox-mode-chk"
                checked={!!tempSettings.sandboxEnabled}
                onChange={(e) => setTempSettings({ ...tempSettings, sandboxEnabled: e.target.checked })}
                className="rounded bg-slate-950 border-slate-800 text-amber-500 cursor-pointer"
              />
              <label htmlFor="sandbox-mode-chk" className="text-amber-300 cursor-pointer font-semibold">
                Enable Instant Sandbox Simulator for Test Purchases
              </label>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer mt-4"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save System Settings</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
