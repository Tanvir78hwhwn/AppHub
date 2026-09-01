import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ApkItem, CourseItem, Category } from '../types';
import { ApkCard } from './ApkCard';
import { CourseCard } from './CourseCard';
import { 
  Sparkles, 
  Download, 
  PlayCircle, 
  ShieldCheck, 
  CheckCircle, 
  ArrowRight, 
  Layers, 
  TrendingUp, 
  Lock, 
  Code, 
  Smartphone, 
  Zap,
  Tag
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const { 
    setActiveTab, 
    setSelectedCategory, 
    searchQuery, 
    setSearchQuery, 
    categories 
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [homeData, setHomeData] = useState<{
    featuredApks: ApkItem[];
    latestApks: ApkItem[];
    freeApks: ApkItem[];
    paidApks: ApkItem[];
    featuredCourses: CourseItem[];
    freeCourses: CourseItem[];
    paidCourses: CourseItem[];
    stats: { totalApks: number; totalCourses: number; totalDownloads: number };
  }>({
    featuredApks: [],
    latestApks: [],
    freeApks: [],
    paidApks: [],
    featuredCourses: [],
    freeCourses: [],
    paidCourses: [],
    stats: { totalApks: 0, totalCourses: 0, totalDownloads: 0 }
  });

  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'free' | 'paid' | 'apks' | 'courses'>('all');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.getHomeContent()
      .then(res => {
        if (isMounted) {
          setHomeData({
            featuredApks: res.featuredApks || [],
            latestApks: res.latestApks || [],
            freeApks: res.freeApks || [],
            paidApks: res.paidApks || [],
            featuredCourses: res.featuredCourses || [],
            freeCourses: res.freeCourses || [],
            paidCourses: res.paidCourses || [],
            stats: res.stats || { totalApks: 0, totalCourses: 0, totalDownloads: 0 }
          });
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load home content:', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const handleCategoryClick = (catName: string) => {
    setSelectedCategory(catName);
    setActiveTab('apks');
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-10 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Verified APKs & In-Depth Developer Video Courses</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">
            Download Clean APKs & Master <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-amber-300 bg-clip-text text-transparent">Full-Stack Tech</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8 max-w-2xl">
            Access secure, verified Android application packages and step-by-step masterclasses with streamable lessons. Free and premium content with instant mobile banking unlocks.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="hero-btn-explore-apks"
              onClick={() => setActiveTab('apks')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Explore APKs</span>
            </button>

            <button
              id="hero-btn-explore-courses"
              onClick={() => setActiveTab('courses')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-sm transition-all cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-violet-400" />
              <span>Watch Video Courses</span>
            </button>

            <button
              id="hero-btn-free-zone"
              onClick={() => setActiveTab('free')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 font-semibold text-sm transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>100% Free Downloads</span>
            </button>
          </div>

          {/* Trust & Verification Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-8 mt-8 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>SHA-256 Verified Binaries</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Instant bKash & Card Unlock</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Clean Legitimate Content</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Bar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Browse by Category</span>
          </h2>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleCategoryClick('all')}
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all"
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5"
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Filter Tabs Bar (All / Free / Paid / APKs / Courses) */}
      <section className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1 sm:gap-2">
          {[
            { id: 'all', label: 'All Content' },
            { id: 'apks', label: 'APKs Only' },
            { id: 'courses', label: 'Courses Only' },
            { id: 'free', label: '100% Free' },
            { id: 'paid', label: 'Premium Paid' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilterTab === tab.id
                  ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setActiveTab('apks')}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hidden sm:flex"
        >
          <span>View All Directory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* Dynamic Content Display based on Filter Tab */}
      {activeFilterTab === 'free' && (
        <section className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>100% Free APK Downloads</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {homeData.freeApks.map(apk => (
                <ApkCard key={apk.id} apk={apk} />
              ))}
            </div>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-emerald-400" />
                <span>Free Open Video Courses</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {homeData.freeCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {activeFilterTab === 'paid' && (
        <section className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <span>Premium Paid APK Tools</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {homeData.paidApks.map(apk => (
                <ApkCard key={apk.id} apk={apk} />
              ))}
            </div>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Lock className="w-5 h-5 text-violet-400" />
                <span>Premium Video Masterclasses</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {homeData.paidCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {activeFilterTab === 'all' && (
        <>
          {/* Featured Content Highlights */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Featured APKs & Developer Tools</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Top-rated Android tools and utilities ready for immediate download</p>
              </div>
              <button
                onClick={() => setActiveTab('apks')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <span>See all ({homeData.stats.totalApks})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {homeData.featuredApks.map((apk) => (
                <ApkCard key={apk.id} apk={apk} />
              ))}
            </div>
          </section>

          {/* Featured Video Courses */}
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-violet-400" />
                  <span>Video Courses & Masterclasses</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Stream high-definition lessons and master mobile & cloud architecture</p>
              </div>
              <button
                onClick={() => setActiveTab('courses')}
                className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
              >
                <span>See all ({homeData.stats.totalCourses})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {homeData.featuredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>

          {/* Latest Uploads Section */}
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span>Latest Uploads & Updates</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Recently published software releases and new video modules</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {homeData.latestApks.slice(0, 3).map((apk) => (
                <ApkCard key={apk.id} apk={apk} />
              ))}
            </div>
          </section>
        </>
      )}

      {activeFilterTab === 'apks' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-100">All Android APK Releases</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...homeData.featuredApks, ...homeData.latestApks]
              .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
              .map(apk => (
                <ApkCard key={apk.id} apk={apk} />
              ))}
          </div>
        </section>
      )}

      {activeFilterTab === 'courses' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-100">All Masterclasses & Video Courses</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...homeData.featuredCourses, ...homeData.freeCourses, ...homeData.paidCourses]
              .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
              .map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
};
