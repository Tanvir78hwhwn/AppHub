import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, X, ShieldAlert } from 'lucide-react';

export const NoticeBanner: React.FC = () => {
  const { settings } = useApp();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !settings.showNoticeBanner || !settings.noticeBanner) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 border-b border-indigo-500/20 px-4 py-2 text-xs sm:text-sm text-indigo-100 flex items-center justify-between gap-3 sticky top-0 z-40 backdrop-blur-md">
      <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1 justify-center text-center">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <span className="font-medium tracking-wide">{settings.noticeBanner}</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 shrink-0"
        title="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
