import React from 'react';
import { useApp } from '../context/AppContext';
import { Download, PlayCircle, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-12 pb-16 lg:pb-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Download className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-white">AppHub Academy</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Legitimate digital distribution platform for Android application packages (APKs) and full-stack software video masterclasses.
            </p>
          </div>

          {/* Col 2: Content Directory */}
          <div className="space-y-2">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">Directory</p>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => setActiveTab('apks')} className="hover:text-indigo-300">
                  Android APK Binaries
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('courses')} className="hover:text-indigo-300">
                  Video Masterclasses
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('free')} className="hover:text-indigo-300">
                  100% Free Downloads
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('library')} className="hover:text-indigo-300">
                  Student & User Library
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Payment & Security */}
          <div className="space-y-2">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">Payment & Direct WhatsApp</p>
            <ul className="space-y-1.5 text-slate-400">
              <li className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span>💬 WhatsApp: +8801329179522 (Tanvir)</span>
              </li>
              <li>bKash / Nagad / Rocket: 01329179522</li>
              <li>Instant 1-Click Order Message</li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>SHA-256 Checksums Verified</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Compliance & Legal */}
          <div className="space-y-2">
            <p className="font-bold text-white uppercase tracking-wider text-[11px]">Compliance</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Designed exclusively for authorized open-source releases, developer utilities, and original education content.
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} AppHub Academy Platform. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Crafted for Android Engineers & Creators</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
