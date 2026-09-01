import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ApkItem } from '../types';
import { ApkCard } from './ApkCard';
import { Download, Search, Filter, SlidersHorizontal, Sparkles, RefreshCw } from 'lucide-react';

export const ApkExplorer: React.FC = () => {
  const { selectedCategory, setSelectedCategory, categories } = useApp();
  const [apks, setApks] = useState<ApkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [accessType, setAccessType] = useState<'all' | 'FREE' | 'PAID'>('all');
  const [sort, setSort] = useState<'newest' | 'popular' | 'priceAsc' | 'priceDesc'>('newest');

  const fetchApks = () => {
    setLoading(true);
    api.getApks({
      search: search || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      accessType: accessType !== 'all' ? accessType : undefined,
      sort
    })
      .then(res => {
        setApks(res.apks || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching APKs:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApks();
  }, [search, selectedCategory, accessType, sort]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
            <Download className="w-4 h-4" />
            <span>Application Package Archive (APK)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Android APK Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Clean, developer-verified APK binaries. 100% free and premium software packages.
          </p>
        </div>

        {/* Search input */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, developer, or package..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.name
                  ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Right filters: Access & Sort */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Access type: All / Free / Paid */}
          <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => setAccessType('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                accessType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setAccessType('FREE')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                accessType === 'FREE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setAccessType('PAID')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                accessType === 'PAID' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paid
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Downloaded</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* APK Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-72 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse p-4" />
          ))}
        </div>
      ) : apks.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">Showing {apks.length} APK package{apks.length === 1 ? '' : 's'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {apks.map((apk) => (
              <ApkCard key={apk.id} apk={apk} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/30 border border-slate-800">
          <Download className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No APKs Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            No packages matched your search criteria or category filter. Try clearing filters.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
              setAccessType('all');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
