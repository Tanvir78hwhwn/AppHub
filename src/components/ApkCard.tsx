import React from 'react';
import { ApkItem } from '../types';
import { useApp } from '../context/AppContext';
import { Download, CheckCircle2, ShieldCheck, HardDrive, Tag, Sparkles } from 'lucide-react';

interface ApkCardProps {
  apk: ApkItem;
}

export const ApkCard: React.FC<ApkCardProps> = ({ apk }) => {
  const { setSelectedApk, startDownload, setCheckoutItem, hasAccess } = useApp();
  const isUnlocked = hasAccess(apk.id, 'apk', apk.accessType);

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnlocked) {
      startDownload(apk);
    } else {
      setCheckoutItem({ item: apk, type: 'apk' });
    }
  };

  return (
    <div
      id={`apk-card-${apk.id}`}
      onClick={() => setSelectedApk(apk)}
      className="group relative bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-950/30 flex flex-col justify-between cursor-pointer"
    >
      {/* Top Banner / Image & Badges */}
      <div>
        <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3.5 bg-slate-950 border border-slate-800">
          <img
            src={apk.thumbnail}
            alt={apk.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

          {/* Access Badge (FREE or PAID) */}
          <div className="absolute top-2.5 right-2.5">
            {apk.accessType === 'FREE' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur-md shadow-md">
                <Sparkles className="w-3 h-3" />
                FREE
              </span>
            ) : isUnlocked ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/90 text-white backdrop-blur-md shadow-md">
                <CheckCircle2 className="w-3 h-3" />
                UNLOCKED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 backdrop-blur-md shadow-md font-mono">
                {apk.price} {apk.currency}
              </span>
            )}
          </div>

          {/* Category Chip */}
          <div className="absolute bottom-2.5 left-2.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 border border-slate-700/60 backdrop-blur-md">
              {apk.category}
            </span>
          </div>
        </div>

        {/* Title and Short Description */}
        <h3 className="font-bold text-slate-100 text-base leading-snug group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
          {apk.title}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {apk.description}
        </p>
      </div>

      {/* Meta Specs & Action Button */}
      <div className="pt-3 border-t border-slate-800/80 mt-auto">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
          <span className="font-mono font-medium text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded">
            {apk.version}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-slate-500" />
            {apk.fileSize}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3 text-slate-500" />
            {apk.downloadsCount.toLocaleString()} DLs
          </span>
        </div>

        <button
          id={`btn-apk-action-${apk.id}`}
          onClick={handleAction}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
            isUnlocked
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
          }`}
        >
          {isUnlocked ? (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Download APK</span>
            </>
          ) : (
            <>
              <Tag className="w-3.5 h-3.5" />
              <span>Buy Now ({apk.price} {apk.currency})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
