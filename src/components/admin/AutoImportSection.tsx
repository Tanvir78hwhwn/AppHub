import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { 
  ImportItem, 
  ImportSource, 
  ImportJob, 
  PricingRule, 
  PricingSettings, 
  AutoImportStats,
  ImportItemStatus
} from '../../types';
import { 
  Download, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Play, 
  Clock, 
  Tag, 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  Search, 
  Filter, 
  ExternalLink, 
  Sliders, 
  Check, 
  HelpCircle,
  FileCode,
  Video,
  BookOpen,
  Radio,
  Eye,
  ArrowRight,
  ShieldAlert,
  Copy,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AutoImportSectionProps {
  onRefreshCatalog?: () => void;
}

export const AutoImportSection: React.FC<AutoImportSectionProps> = ({ onRefreshCatalog }) => {
  const { addToast } = useApp();

  // Active sub-tab
  const [subTab, setSubTab] = useState<'inspect' | 'queue' | 'sources' | 'scheduler' | 'pricing'>('inspect');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [syncingScheduler, setSyncingScheduler] = useState(false);

  // Data states
  const [stats, setStats] = useState<AutoImportStats>({
    totalImports: 0,
    successfulImports: 0,
    failedImports: 0,
    duplicates: 0,
    securityFailures: 0,
    publishedAutomatically: 0,
    waitingForReview: 0
  });

  const [items, setItems] = useState<ImportItem[]>([]);
  const [sources, setSources] = useState<ImportSource[]>([]);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [pricingSettings, setPricingSettings] = useState<PricingSettings>({
    currency: 'BDT',
    defaultApkPrice: 49,
    defaultVideoPrice: 99,
    defaultCoursePrice: 149,
    minPrice: 10,
    maxPrice: 5000,
    allowAutomaticPricing: true,
    allowSourcePrice: true,
    requireApprovalForAutomaticPricing: false,
    automationMode: 'REVIEW FIRST',
    schedulerInterval: '1h',
    maxApkSizeMb: 250,
    maxVideoSizeMb: 500,
    maxDownloadTimeSeconds: 60,
    maxRedirects: 5
  });
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);

  // Inspect URL state
  const [inputUrl, setInputUrl] = useState('');
  const [detectedResource, setDetectedResource] = useState<Partial<ImportItem> | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<{ isDuplicate: boolean; reason?: string; existingId?: string; existingTitle?: string } | null>(null);
  const [securityPreview, setSecurityPreview] = useState<{ status: string; details: string } | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  // Queue filters
  const [queueFilter, setQueueFilter] = useState<string>('all');
  const [queueSearch, setQueueSearch] = useState<string>('');

  // Source modal state
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [editingSource, setEditingSource] = useState<Partial<ImportSource> | null>(null);

  // Rule modal state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<PricingRule> | null>(null);

  // Inspect detail modal
  const [viewingItem, setViewingItem] = useState<ImportItem | null>(null);

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, itemsRes, sourcesRes, jobsRes, pricingRes] = await Promise.all([
        api.getAutoImportStats(),
        api.getImportItems(),
        api.getImportSources(),
        api.getImportJobs(),
        api.getPricingConfig()
      ]);

      if (statsRes?.stats) setStats(statsRes.stats);
      if (itemsRes?.items) setItems(itemsRes.items);
      if (sourcesRes?.sources) setSources(sourcesRes.sources);
      if (jobsRes?.jobs) setJobs(jobsRes.jobs);
      if (pricingRes?.settings) setPricingSettings(pricingRes.settings);
      if (pricingRes?.rules) setPricingRules(pricingRes.rules);
    } catch (err: any) {
      console.error('Failed to load auto-import data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Inspect a URL
  const handleInspectUrl = async (urlToInspect?: string) => {
    const url = urlToInspect || inputUrl;
    if (!url.trim()) {
      addToast({ type: 'warning', title: 'Input Required', message: 'Please enter a URL to inspect.' });
      return;
    }

    setInspecting(true);
    setDetectionError(null);
    setDetectedResource(null);
    setDuplicateInfo(null);
    setSecurityPreview(null);

    try {
      const res = await api.detectImportResource(url.trim());
      if (res.success && res.resource) {
        setDetectedResource(res.resource);
        setDuplicateInfo(res.duplicateInfo || null);
        setSecurityPreview(res.securityPreview || null);
        addToast({
          type: 'success',
          title: 'Resource Detected',
          message: `Successfully extracted metadata for "${res.resource.title}".`
        });
      } else {
        setDetectionError(res.error || 'Failed to extract downloadable content from URL.');
      }
    } catch (err: any) {
      setDetectionError(err.message || 'Inspection failed. Please ensure the URL is accessible.');
      addToast({ type: 'error', title: 'Inspection Failed', message: err.message });
    } finally {
      setInspecting(false);
    }
  };

  // AI Enhance title & descriptions
  const handleAiEnhance = async () => {
    if (!detectedResource || !detectedResource.title) return;
    setAiGenerating(true);
    try {
      const res = await api.enhanceMetadataWithAi({
        rawTitle: detectedResource.title,
        rawDescription: detectedResource.description,
        contentType: detectedResource.contentType,
        sourceUrl: detectedResource.sourceUrl
      });

      if (res.generated) {
        setDetectedResource(prev => ({
          ...prev,
          title: res.generated.title || prev?.title,
          description: res.generated.description || prev?.description,
          fullDescription: res.generated.fullDescription || prev?.fullDescription,
          category: res.generated.category || prev?.category,
          tags: res.generated.tags || prev?.tags,
          seoTitle: res.generated.seoTitle || prev?.seoTitle,
          seoDescription: res.generated.seoDescription || prev?.seoDescription
        }));
        addToast({
          type: 'success',
          title: 'AI Enhancement Complete',
          message: 'Generated professional metadata, tags, and category with Gemini AI.'
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'AI Generation Failed', message: err.message });
    } finally {
      setAiGenerating(false);
    }
  };

  // Execute Import
  const handleExecuteImport = async (forceAutoPublish = false) => {
    if (!detectedResource || !detectedResource.sourceUrl) return;
    setSavingItem(true);
    try {
      const res = await api.executeImport(detectedResource, undefined, forceAutoPublish);
      addToast({
        type: 'success',
        title: forceAutoPublish ? 'Imported & Published' : 'Saved to Queue',
        message: forceAutoPublish
          ? `"${res.item.title}" is now published and live in the catalog!`
          : `"${res.item.title}" saved to Pending Review queue.`
      });

      setDetectedResource(null);
      setInputUrl('');
      setDuplicateInfo(null);
      setSecurityPreview(null);
      loadData();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Import Failed', message: err.message });
    } finally {
      setSavingItem(false);
    }
  };

  // Publish Pending item
  const handlePublishItem = async (id: string) => {
    try {
      await api.publishImportItem(id);
      addToast({ type: 'success', title: 'Item Published', message: 'Content approved and added to live catalog.' });
      loadData();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Publish Error', message: err.message });
    }
  };

  // Reject item
  const handleRejectItem = async (id: string) => {
    try {
      await api.rejectImportItem(id);
      addToast({ type: 'info', title: 'Item Rejected', message: 'Item status set to Rejected.' });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Reject Error', message: err.message });
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this import record?')) return;
    try {
      await api.deleteImportItem(id);
      addToast({ type: 'info', title: 'Deleted', message: 'Import item removed.' });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Error', message: err.message });
    }
  };

  // Source Actions
  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource || !editingSource.name || !editingSource.baseUrl) return;

    try {
      if (editingSource.id) {
        await api.updateImportSource(editingSource.id, editingSource);
        addToast({ type: 'success', title: 'Source Updated', message: 'Content source settings updated.' });
      } else {
        await api.addImportSource(editingSource);
        addToast({ type: 'success', title: 'Source Added', message: 'New content source registered.' });
      }
      setShowSourceModal(false);
      setEditingSource(null);
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Source Error', message: err.message });
    }
  };

  const handlePollSource = async (id: string) => {
    try {
      addToast({ type: 'info', title: 'Polling Source', message: 'Checking source for new downloadable content...' });
      const res = await api.pollImportSourceNow(id);
      addToast({ type: 'success', title: 'Poll Completed', message: 'Source polling finished.' });
      loadData();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Poll Error', message: err.message });
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this source?')) return;
    try {
      await api.deleteImportSource(id);
      addToast({ type: 'info', title: 'Source Deleted', message: 'Source removed.' });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Error', message: err.message });
    }
  };

  // Scheduler Run Now
  const handleRunScheduler = async () => {
    setSyncingScheduler(true);
    try {
      addToast({ type: 'info', title: 'Scheduler Triggered', message: 'Running automatic import cycle across all sources...' });
      await api.runSchedulerNow();
      addToast({ type: 'success', title: 'Sync Completed', message: 'Automated import cycle finished.' });
      loadData();
      if (onRefreshCatalog) onRefreshCatalog();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Scheduler Error', message: err.message });
    } finally {
      setSyncingScheduler(false);
    }
  };

  // Save Pricing Settings
  const handleSavePricingSettings = async (updates: Partial<PricingSettings>) => {
    try {
      const res = await api.updatePricingConfig(updates);
      setPricingSettings(res.settings);
      addToast({ type: 'success', title: 'Pricing Settings Saved', message: 'Platform pricing & automation rules updated.' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Error', message: err.message });
    }
  };

  // Save Pricing Rule
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !editingRule.contentType || editingRule.price === undefined) return;

    try {
      if (editingRule.id) {
        await api.updatePricingRule(editingRule.id, editingRule);
        addToast({ type: 'success', title: 'Rule Updated', message: 'Tiered pricing rule updated.' });
      } else {
        await api.addPricingRule(editingRule);
        addToast({ type: 'success', title: 'Rule Added', message: 'New tiered pricing rule created.' });
      }
      setShowRuleModal(false);
      setEditingRule(null);
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Rule Error', message: err.message });
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await api.deletePricingRule(id);
      addToast({ type: 'info', title: 'Rule Deleted', message: 'Pricing rule deleted.' });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete Error', message: err.message });
    }
  };

  // Filtered queue items
  const filteredQueueItems = items.filter(item => {
    if (queueFilter !== 'all' && item.status !== queueFilter) return false;
    if (queueSearch.trim()) {
      const q = queueSearch.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.sourceUrl.toLowerCase().includes(q) || (item.category && item.category.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6" id="auto-import-hub">
      {/* 1. Header Banner & Stats Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border border-indigo-900/40 p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Automatic Content Pipeline
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Mode: {pricingSettings.automationMode}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Auto Import & Dynamic Pricing System
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Inspect public URLs, extract APKs and video courses, verify security signatures (SHA-256), enhance metadata with Gemini AI, and apply tiered BDT pricing automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunScheduler}
              disabled={syncingScheduler}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold rounded-xl text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncingScheduler ? 'animate-spin' : ''}`} />
              {syncingScheduler ? 'Running Sync...' : 'Sync Sources Now'}
            </button>
            <button
              onClick={loadData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 5-Card Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-indigo-900/40">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
            <p className="text-xs text-slate-400 font-medium">Total Imported</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.totalImports}</p>
          </div>
          <div className="bg-amber-950/30 rounded-xl p-3 border border-amber-800/30">
            <p className="text-xs text-amber-300 font-medium">Waiting Review</p>
            <p className="text-xl font-bold text-amber-400 mt-0.5">{stats.waitingForReview}</p>
          </div>
          <div className="bg-emerald-950/30 rounded-xl p-3 border border-emerald-800/30">
            <p className="text-xs text-emerald-300 font-medium">Live Catalog</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{stats.successfulImports}</p>
          </div>
          <div className="bg-indigo-950/30 rounded-xl p-3 border border-indigo-800/30">
            <p className="text-xs text-indigo-300 font-medium">Auto-Published</p>
            <p className="text-xl font-bold text-indigo-300 mt-0.5">{stats.publishedAutomatically}</p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80">
            <p className="text-xs text-slate-400 font-medium">Duplicates Handled</p>
            <p className="text-xl font-bold text-slate-300 mt-0.5">{stats.duplicates}</p>
          </div>
          <div className="bg-rose-950/30 rounded-xl p-3 border border-rose-800/30">
            <p className="text-xs text-rose-300 font-medium">Security Flagged</p>
            <p className="text-xl font-bold text-rose-400 mt-0.5">{stats.securityFailures}</p>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 sm:space-x-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => setSubTab('inspect')}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            subTab === 'inspect'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          Universal URL Inspector
        </button>
        <button
          onClick={() => setSubTab('queue')}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            subTab === 'queue'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Import Queue & Catalog
          {stats.waitingForReview > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white">
              {stats.waitingForReview}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab('sources')}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            subTab === 'sources'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          Trusted Sources ({sources.length})
        </button>
        <button
          onClick={() => setSubTab('scheduler')}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            subTab === 'scheduler'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Scheduler & Job Logs
        </button>
        <button
          onClick={() => setSubTab('pricing')}
          className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            subTab === 'pricing'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Pricing Engine Rules
        </button>
      </div>

      {/* ========================================================
          SUB-TAB 1: UNIVERSAL URL INSPECTOR & METADATA PREVIEW
          ======================================================== */}
      {subTab === 'inspect' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-500" />
              Universal Content Importer
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Enter any publicly accessible direct URL (APK file, YouTube video/playlist, video course lesson, or mirror). The system verifies SSRF safety, scans binary structures, and estimates pricing in BDT.
            </p>

            {/* URL Input Form */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="url"
                  placeholder="https://... (e.g. direct APK link, YouTube course, video file)"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInspectUrl()}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              </div>
              <button
                onClick={() => handleInspectUrl()}
                disabled={inspecting || !inputUrl.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 min-w-[140px]"
              >
                {inspecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Inspecting...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Detect & Inspect
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo Test Presets */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quick Test Samples:</span>
              <button
                type="button"
                onClick={() => {
                  const sample = 'https://github.com/termux/termux-app/releases/download/v0.118.0/termux-app_v0.118.0+github-debug_universal.apk';
                  setInputUrl(sample);
                  handleInspectUrl(sample);
                }}
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              >
                📦 Termux Linux Terminal APK
              </button>
              <button
                type="button"
                onClick={() => {
                  const sample = 'https://www.youtube.com/watch?v=kYJzXv0vF9Y';
                  setInputUrl(sample);
                  handleInspectUrl(sample);
                }}
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              >
                🎓 Android Jetpack Compose Video Course
              </button>
              <button
                type="button"
                onClick={() => {
                  const sample = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
                  setInputUrl(sample);
                  handleInspectUrl(sample);
                }}
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition"
              >
                🎥 Direct MP4 Video Stream
              </button>
            </div>

            {/* Detection Error Banner */}
            {detectionError && (
              <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-rose-900 dark:text-rose-300">Detection Notice</p>
                  <p className="text-rose-700 dark:text-rose-400 mt-0.5">{detectionError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Detected Resource Live Preview & Editor Card */}
          {detectedResource && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-6 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Inspection Passed • Ready for Import
                  </span>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    Import Preview & Metadata Editor
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAiEnhance}
                    disabled={aiGenerating}
                    className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${aiGenerating ? 'animate-spin' : ''}`} />
                    {aiGenerating ? 'Generating with Gemini...' : 'Enhance with Gemini AI'}
                  </button>
                  <button
                    onClick={() => handleExecuteImport(false)}
                    disabled={savingItem}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
                  >
                    Save as Pending
                  </button>
                  <button
                    onClick={() => handleExecuteImport(true)}
                    disabled={savingItem}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Publish to Live Catalog
                  </button>
                </div>
              </div>

              {/* Duplicate Warning */}
              {duplicateInfo?.isDuplicate && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900 dark:text-amber-300">Duplicate Resource Flagged</p>
                    <p className="text-amber-700 dark:text-amber-400 mt-0.5">{duplicateInfo.reason}</p>
                  </div>
                </div>
              )}

              {/* Grid with Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Thumbnail and Core Badges */}
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video relative bg-slate-100 dark:bg-slate-800">
                    <img
                      src={detectedResource.thumbnail || 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?auto=format&fit=crop&w=600&q=80'}
                      alt="Thumbnail Preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2.5 py-1 text-xs font-bold rounded-lg bg-black/70 text-white backdrop-blur-sm uppercase">
                      {detectedResource.contentType}
                    </span>
                  </div>

                  {/* Security Status Box */}
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Security Signature Verified</span>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      {detectedResource.securityDetails || 'Static package structure validated.'}
                    </p>
                    {detectedResource.sha256Checksum && (
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate" title={detectedResource.sha256Checksum}>
                        SHA-256: {detectedResource.sha256Checksum}
                      </p>
                    )}
                  </div>

                  {/* Pricing Engine Evaluation Box */}
                  <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-indigo-500" />
                        Pricing Engine
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                        {detectedResource.accessType}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Access Type</label>
                        <select
                          value={detectedResource.accessType}
                          onChange={(e) => setDetectedResource(prev => ({ ...prev, accessType: e.target.value as any, calculatedPrice: e.target.value === 'FREE' ? 0 : (prev?.calculatedPrice || 49) }))}
                          className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                        >
                          <option value="PAID">PAID</option>
                          <option value="FREE">FREE (0 BDT)</option>
                        </select>
                      </div>

                      {detectedResource.accessType === 'PAID' && (
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Price (BDT)</label>
                          <input
                            type="number"
                            value={detectedResource.calculatedPrice}
                            onChange={(e) => setDetectedResource(prev => ({ ...prev, calculatedPrice: Number(e.target.value) }))}
                            className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right 2 Columns: Editable Metadata Form */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={detectedResource.title || ''}
                      onChange={(e) => setDetectedResource(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Category
                      </label>
                      <select
                        value={detectedResource.category || 'Developer Tools'}
                        onChange={(e) => setDetectedResource(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      >
                        <option value="Developer Tools">Developer Tools</option>
                        <option value="Android Mastery">Android Mastery</option>
                        <option value="Productivity & Office">Productivity & Office</option>
                        <option value="Web & Full-Stack">Web & Full-Stack</option>
                        <option value="Media & Audio">Media & Audio</option>
                        <option value="Security & Utilities">Security & Utilities</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Content Type
                      </label>
                      <select
                        value={detectedResource.contentType || 'apk'}
                        onChange={(e) => setDetectedResource(prev => ({ ...prev, contentType: e.target.value as any }))}
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      >
                        <option value="apk">Android APK Package</option>
                        <option value="course">Video Course (Multi-lesson)</option>
                        <option value="video">Single Video Tutorial</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Short Summary Description
                    </label>
                    <textarea
                      rows={2}
                      value={detectedResource.description || ''}
                      onChange={(e) => setDetectedResource(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Full Markdown Overview
                    </label>
                    <textarea
                      rows={3}
                      value={detectedResource.fullDescription || ''}
                      onChange={(e) => setDetectedResource(prev => ({ ...prev, fullDescription: e.target.value }))}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Course Lessons Editor if Course */}
                  {detectedResource.contentType === 'course' && detectedResource.lessons && (
                    <div className="pt-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                        Parsed Course Lessons ({detectedResource.lessons.length})
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {detectedResource.lessons.map((lesson, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                                {idx + 1}
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white truncate">{lesson.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-mono">{lesson.duration}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${lesson.isFreePreview ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                                {lesson.isFreePreview ? 'PREVIEW' : 'LOCKED'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags and Version */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1">Version:</span>
                      <input
                        type="text"
                        value={detectedResource.version || 'v1.0.0'}
                        onChange={(e) => setDetectedResource(prev => ({ ...prev, version: e.target.value }))}
                        className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">File Size:</span>
                      <input
                        type="text"
                        value={detectedResource.fileSize || '35 MB'}
                        onChange={(e) => setDetectedResource(prev => ({ ...prev, fileSize: e.target.value }))}
                        className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Developer:</span>
                      <input
                        type="text"
                        value={detectedResource.developer || 'Verified Community'}
                        onChange={(e) => setDetectedResource(prev => ({ ...prev, developer: e.target.value }))}
                        className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: IMPORT QUEUE & CATALOG TABLE
          ======================================================== */}
      {subTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'PENDING_REVIEW', label: 'Waiting Review' },
                { id: 'PUBLISHED', label: 'Published' },
                { id: 'SECURITY_REVIEW', label: 'Security Review' },
                { id: 'DUPLICATE', label: 'Duplicates' },
                { id: 'REJECTED', label: 'Rejected' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setQueueFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    queueFilter === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search queue..."
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Queue Items Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Content</th>
                    <th className="py-3 px-4">Type & Category</th>
                    <th className="py-3 px-4">Pricing</th>
                    <th className="py-3 px-4">Security / Hash</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredQueueItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        No import records match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredQueueItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.thumbnail || 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?auto=format&fit=crop&w=120&q=80'}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                            />
                            <div className="max-w-xs">
                              <p className="font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-slate-400 hover:text-indigo-500 truncate block flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                <span className="truncate">{item.sourceUrl}</span>
                              </a>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                            {item.contentType}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1">{item.category}</p>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`font-bold ${item.accessType === 'FREE' ? 'text-emerald-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                            {item.accessType === 'FREE' ? 'FREE' : `${item.calculatedPrice} ${item.currency}`}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${
                            item.securityStatus === 'PASSED'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : item.securityStatus === 'SECURITY_REVIEW'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          }`}>
                            {item.securityStatus === 'PASSED' && <ShieldCheck className="w-3 h-3" />}
                            {item.securityStatus}
                          </span>
                          {item.sha256Checksum && (
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5 truncate max-w-[120px]" title={item.sha256Checksum}>
                              {item.sha256Checksum.slice(0, 10)}...
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : item.status === 'PENDING_REVIEW'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : item.status === 'DUPLICATE'
                              ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                              : item.status === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : 'bg-purple-500/10 text-purple-600 border border-purple-500/30'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status !== 'PUBLISHED' && (
                              <button
                                onClick={() => handlePublishItem(item.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition"
                                title="Approve & Publish"
                              >
                                Approve
                              </button>
                            )}
                            {item.status === 'PENDING_REVIEW' && (
                              <button
                                onClick={() => handleRejectItem(item.id)}
                                className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-700 dark:text-rose-300 rounded-lg text-[11px] font-semibold transition"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              onClick={() => setViewingItem(item)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg transition"
                              title="Inspect Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: TRUSTED CONTENT SOURCES
          ======================================================== */}
      {subTab === 'sources' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configured Content Sources</h3>
              <p className="text-sm text-slate-500">Automate recurring feed polls or periodic package catalog ingestion.</p>
            </div>
            <button
              onClick={() => {
                setEditingSource({
                  name: '',
                  baseUrl: '',
                  type: 'feed',
                  enabled: true,
                  trusted: false,
                  allowedContentTypes: ['apk', 'course'],
                  defaultCategory: 'Developer Tools',
                  pricingMode: 'AUTOMATIC',
                  defaultPrice: 49
                });
                setShowSourceModal(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Content Source
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map(source => (
              <div
                key={source.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">{source.name}</h4>
                      {source.trusted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          TRUSTED
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${source.enabled ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                        {source.enabled ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-1 break-all">{source.baseUrl}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Category</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{source.defaultCategory}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Pricing Mode</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{source.pricingMode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Default Price</span>
                    <span className="font-semibold text-indigo-600">{source.defaultPrice} BDT</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Last polled: {source.lastPolledAt ? new Date(source.lastPolledAt).toLocaleString() : 'Never'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePollSource(source.id)}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Poll Now
                    </button>
                    <button
                      onClick={() => {
                        setEditingSource(source);
                        setShowSourceModal(true);
                      }}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: SCHEDULER & JOBS LOG
          ======================================================== */}
      {subTab === 'scheduler' && (
        <div className="space-y-6">
          {/* Automation Mode Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Automation Modes & Scheduler Interval</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  mode: 'MANUAL' as const,
                  title: 'Manual Only',
                  desc: 'Import is only triggered when an administrator inspects a URL or manually clicks Poll Now.'
                },
                {
                  mode: 'REVIEW FIRST' as const,
                  title: 'Review First (Recommended)',
                  desc: 'Scheduled jobs automatically download and inspect content, queuing items in Pending Review for 1-click approval.'
                },
                {
                  mode: 'FULL AUTO' as const,
                  title: 'Full Auto (Trusted)',
                  desc: 'Trusted sources bypass the review queue and publish directly to the live digital catalog after security checks.'
                }
              ].map(card => (
                <div
                  key={card.mode}
                  onClick={() => handleSavePricingSettings({ automationMode: card.mode })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                    pricingSettings.automationMode === card.mode
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{card.title}</span>
                    {pricingSettings.automationMode === card.mode && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* Scheduler Interval Picker */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Background Poll Interval:</span>
                <select
                  value={pricingSettings.schedulerInterval}
                  onChange={(e) => handleSavePricingSettings({ schedulerInterval: e.target.value as any })}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="DISABLED">Disabled</option>
                  <option value="15m">Every 15 Minutes</option>
                  <option value="30m">Every 30 Minutes</option>
                  <option value="1h">Every 1 Hour</option>
                  <option value="6h">Every 6 Hours</option>
                  <option value="12h">Every 12 Hours</option>
                  <option value="24h">Every 24 Hours</option>
                </select>
              </div>

              <button
                onClick={handleRunScheduler}
                disabled={syncingScheduler}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                Run Scheduler Sync Now
              </button>
            </div>
          </div>

          {/* Job History Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Recent Automation Job Runs</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Source</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Started At</th>
                    <th className="py-2.5 px-4">Discovered</th>
                    <th className="py-2.5 px-4">Imported</th>
                    <th className="py-2.5 px-4">Skipped / Failed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-500">
                        No automated job history recorded yet.
                      </td>
                    </tr>
                  ) : (
                    jobs.map(job => (
                      <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{job.sourceName}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            job.status === 'RUNNING' ? 'bg-indigo-100 text-indigo-800 animate-pulse' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono">{new Date(job.startedAt).toLocaleTimeString()}</td>
                        <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">{job.foundCount}</td>
                        <td className="py-2.5 px-4 text-emerald-600 font-bold">+{job.importedCount}</td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {job.skippedCount} skipped • {job.failedCount} failed
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 5: PRICING ENGINE RULES
          ======================================================== */}
      {subTab === 'pricing' && (
        <div className="space-y-6">
          {/* Base Defaults Config */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Platform Base Pricing Defaults</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Currency</label>
                <input
                  type="text"
                  value={pricingSettings.currency}
                  onChange={(e) => setPricingSettings(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Default APK Price</label>
                <input
                  type="number"
                  value={pricingSettings.defaultApkPrice}
                  onChange={(e) => setPricingSettings(prev => ({ ...prev, defaultApkPrice: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm font-bold text-indigo-600 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Default Video Price</label>
                <input
                  type="number"
                  value={pricingSettings.defaultVideoPrice}
                  onChange={(e) => setPricingSettings(prev => ({ ...prev, defaultVideoPrice: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm font-bold text-indigo-600 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Default Course Price</label>
                <input
                  type="number"
                  value={pricingSettings.defaultCoursePrice}
                  onChange={(e) => setPricingSettings(prev => ({ ...prev, defaultCoursePrice: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm font-bold text-indigo-600 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowAutoPricing"
                  checked={pricingSettings.allowAutomaticPricing}
                  onChange={(e) => setPricingSettings(prev => ({ ...prev, allowAutomaticPricing: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="allowAutoPricing" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Allow Automatic Tier Calculation on Import
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowSourcePricing"
                  checked={pricingSettings.allowSourcePrice}
                  onChange={(e) => setPricingSettings(prev => ({ ...prev, allowSourcePrice: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="allowSourcePricing" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Honor detected source price if within range
                </label>
              </div>
            </div>

            <button
              onClick={() => handleSavePricingSettings(pricingSettings)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow"
            >
              Save Pricing Defaults
            </button>
          </div>

          {/* Tiered Rules Manager */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Tiered Rules Matrix</h4>
                <p className="text-xs text-slate-500">Calculates price dynamically based on lesson counts or video length.</p>
              </div>
              <button
                onClick={() => {
                  setEditingRule({
                    contentType: 'course',
                    minLessons: 1,
                    maxLessons: 5,
                    price: 49,
                    currency: pricingSettings.currency || 'BDT',
                    enabled: true
                  });
                  setShowRuleModal(true);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Pricing Rule
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Content Type</th>
                    <th className="py-2.5 px-4">Condition (Lessons / Duration)</th>
                    <th className="py-2.5 px-4">Applied Price</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pricingRules.map(rule => (
                    <tr key={rule.id}>
                      <td className="py-3 px-4 font-bold uppercase">{rule.contentType}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {rule.minLessons !== undefined && rule.maxLessons !== undefined ? (
                          <span>{rule.minLessons} to {rule.maxLessons} lessons</span>
                        ) : rule.minDurationMinutes !== undefined ? (
                          <span>{rule.minDurationMinutes} - {rule.maxDurationMinutes || '∞'} minutes</span>
                        ) : (
                          <span>Default standard match</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-600">{rule.price} {rule.currency}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rule.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {rule.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            setShowRuleModal(true);
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded mr-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded"
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

      {/* ========================================================
          MODAL: ADD / EDIT CONTENT SOURCE
          ======================================================== */}
      {showSourceModal && editingSource && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingSource.id ? 'Edit Content Source' : 'Register New Content Source'}
            </h3>

            <form onSubmit={handleSaveSource} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Source Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Authorized APK Feed"
                  value={editingSource.name || ''}
                  onChange={(e) => setEditingSource(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Base Feed / Mirror URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={editingSource.baseUrl || ''}
                  onChange={(e) => setEditingSource(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Source Type</label>
                  <select
                    value={editingSource.type || 'feed'}
                    onChange={(e) => setEditingSource(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="feed">JSON / RSS Feed</option>
                    <option value="apk">APK Release Host</option>
                    <option value="course">Video Course Hub</option>
                    <option value="video">Video Channel</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Default Category</label>
                  <select
                    value={editingSource.defaultCategory || 'Developer Tools'}
                    onChange={(e) => setEditingSource(prev => ({ ...prev, defaultCategory: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Developer Tools">Developer Tools</option>
                    <option value="Android Mastery">Android Mastery</option>
                    <option value="Productivity & Office">Productivity & Office</option>
                    <option value="Web & Full-Stack">Web & Full-Stack</option>
                    <option value="Media & Audio">Media & Audio</option>
                    <option value="Security & Utilities">Security & Utilities</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Pricing Mode</label>
                  <select
                    value={editingSource.pricingMode || 'AUTOMATIC'}
                    onChange={(e) => setEditingSource(prev => ({ ...prev, pricingMode: e.target.value as any }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  >
                    <option value="AUTOMATIC">AUTOMATIC (Engine rules)</option>
                    <option value="FREE">Always FREE</option>
                    <option value="PAID">Fixed Paid</option>
                    <option value="REVIEW">Hold for Manual Review</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Default Price (BDT)</label>
                  <input
                    type="number"
                    value={editingSource.defaultPrice || 49}
                    onChange={(e) => setEditingSource(prev => ({ ...prev, defaultPrice: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="srcTrusted"
                    checked={editingSource.trusted || false}
                    onChange={(e) => setEditingSource(prev => ({ ...prev, trusted: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="srcTrusted" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Mark as Trusted Source (Allows FULL AUTO mode publishing)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="srcEnabled"
                    checked={editingSource.enabled !== false}
                    onChange={(e) => setEditingSource(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="srcEnabled" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Source Active & Enabled for Background Sync
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSourceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow"
                >
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD / EDIT PRICING RULE
          ======================================================== */}
      {showRuleModal && editingRule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingRule.id ? 'Edit Pricing Rule' : 'Add Tiered Pricing Rule'}
            </h3>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Target Content Type</label>
                <select
                  value={editingRule.contentType || 'course'}
                  onChange={(e) => setEditingRule(prev => ({ ...prev, contentType: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="course">Course</option>
                  <option value="apk">APK</option>
                  <option value="video">Single Video</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Min Lessons</label>
                  <input
                    type="number"
                    value={editingRule.minLessons ?? ''}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, minLessons: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Max Lessons</label>
                  <input
                    type="number"
                    value={editingRule.maxLessons ?? ''}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, maxLessons: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Calculated Price (BDT)</label>
                <input
                  type="number"
                  required
                  value={editingRule.price ?? 49}
                  onChange={(e) => setEditingRule(prev => ({ ...prev, price: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm font-bold text-indigo-600 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ruleEnabled"
                  checked={editingRule.enabled !== false}
                  onChange={(e) => setEditingRule(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="ruleEnabled" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Rule Enabled
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
