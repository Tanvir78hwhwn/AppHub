import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getWhatsAppBuyUrl, redirectToWhatsApp, ADMIN_NAME, ADMIN_WHATSAPP_NUMBER } from '../utils/whatsapp';
import { 
  X, 
  Download, 
  Tag, 
  ShieldCheck, 
  HardDrive, 
  Calendar, 
  Smartphone, 
  Layers, 
  Copy, 
  Check, 
  Sparkles, 
  CheckCircle2,
  FileCode,
  ListOrdered,
  MessageCircle,
  ExternalLink,
  CreditCard
} from 'lucide-react';

export const ApkDetailModal: React.FC = () => {
  const { selectedApk, setSelectedApk, startDownload, setCheckoutItem, hasAccess, user, settings, addToast } = useApp();
  const [copiedHash, setCopiedHash] = useState(false);

  if (!selectedApk) return null;

  const isUnlocked = hasAccess(selectedApk.id, 'apk', selectedApk.accessType);
  const adminName = settings?.adminName || ADMIN_NAME;
  const adminWhatsApp = settings?.adminWhatsApp || ADMIN_WHATSAPP_NUMBER;

  const handleCopyChecksum = () => {
    if (selectedApk.sha256Checksum) {
      navigator.clipboard.writeText(selectedApk.sha256Checksum);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleBuyOnWhatsApp = () => {
    const url = getWhatsAppBuyUrl({
      item: selectedApk,
      type: 'apk',
      user,
      phone: adminWhatsApp,
      adminName
    });
    
    // Automatically redirect user to WhatsApp Web or App with pre-filled message
    redirectToWhatsApp(url);
    
    addToast({
      type: 'success',
      title: 'Redirecting to WhatsApp...',
      message: `Connecting with ${adminName} (${adminWhatsApp}) to complete your purchase.`
    });
  };

  const handleAction = () => {
    if (isUnlocked || selectedApk.accessType === 'FREE') {
      startDownload(selectedApk);
    } else {
      // Auto-generate WhatsApp message and redirect immediately
      handleBuyOnWhatsApp();
    }
  };

  const handleOpenAlternativeCheckout = () => {
    setCheckoutItem({ item: selectedApk, type: 'apk' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="fixed inset-0" 
        onClick={() => setSelectedApk(null)} 
      />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 my-8">
        {/* Header Image with close button */}
        <div className="relative h-56 sm:h-64 w-full bg-slate-950">
          <img
            src={selectedApk.thumbnail}
            alt={selectedApk.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          <button
            onClick={() => setSelectedApk(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/80 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges on banner */}
          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-950/90 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
              {selectedApk.category}
            </span>

            {selectedApk.accessType === 'FREE' ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-white shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                FREE DOWNLOAD
              </span>
            ) : isUnlocked ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-indigo-500 text-white shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
                PURCHASED & UNLOCKED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-mono shadow-md">
                {selectedApk.price} {selectedApk.currency}
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Title & Developer */}
          <div>
            <h2 className="text-2xl font-extrabold text-white leading-tight">
              {selectedApk.title}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
              <span className="text-slate-300 font-medium">{selectedApk.developer}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Clean Release
              </span>
            </div>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Version</p>
              <p className="text-slate-200 font-bold font-mono mt-0.5">{selectedApk.version}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">File Size</p>
              <p className="text-slate-200 font-bold mt-0.5 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                {selectedApk.fileSize}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Updated</p>
              <p className="text-slate-200 font-bold mt-0.5">
                {new Date(selectedApk.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Downloads</p>
              <p className="text-slate-200 font-bold mt-0.5">{selectedApk.downloadsCount.toLocaleString()}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {selectedApk.description}
            </p>
            {selectedApk.detailedNotes && (
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                {selectedApk.detailedNotes}
              </p>
            )}
          </div>

          {/* Requirements & Package info */}
          <div className="space-y-2 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Technical Details</h4>
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Package ID:</span>
                <span className="font-mono text-slate-200">{selectedApk.packageId || 'com.apphub.release'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Min OS Requirement:</span>
                <span>{selectedApk.minAndroidVersion || 'Android 8.0 or higher'}</span>
              </div>
              {selectedApk.sha256Checksum && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">SHA-256 Hash:</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                    <span>{selectedApk.sha256Checksum.substring(0, 16)}...</span>
                    <button
                      onClick={handleCopyChecksum}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Copy SHA-256 Checksum"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Changelog */}
          {selectedApk.changelog && selectedApk.changelog.length > 0 && (
            <div className="space-y-2 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5" />
                <span>What's New in {selectedApk.version}</span>
              </h4>
              <ul className="space-y-1 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 text-slate-300">
                {selectedApk.changelog.map((log, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{log}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-slate-400">Price & Access</p>
              <p className="text-base font-extrabold text-white font-mono">
                {selectedApk.accessType === 'FREE' ? 'Free Download' : `${selectedApk.price} ${selectedApk.currency}`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              {isUnlocked ? (
                <button
                  id="modal-apk-action-btn"
                  onClick={handleAction}
                  className="py-3 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download APK Now</span>
                </button>
              ) : selectedApk.accessType === 'FREE' ? (
                <button
                  id="modal-apk-action-btn"
                  onClick={handleAction}
                  className="py-3 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Free Download</span>
                </button>
              ) : (
                <>
                  <button
                    id="modal-apk-action-btn"
                    onClick={handleAction}
                    className="py-3 px-6 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2.5 shadow-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    title="Click to auto-generate WhatsApp order and redirect directly to WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Buy on WhatsApp ({selectedApk.price} {selectedApk.currency})</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAlternativeCheckout}
                    className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                    title="Pay with bKash, Nagad, or Cards directly"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Other Payment Methods</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
