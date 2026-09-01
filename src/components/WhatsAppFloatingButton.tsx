import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MessageCircle, X, ExternalLink, Send, Sparkles } from 'lucide-react';
import { ADMIN_NAME, ADMIN_WHATSAPP_NUMBER, getCleanWhatsAppNumber } from '../utils/whatsapp';

export const WhatsAppFloatingButton: React.FC = () => {
  const { settings, user } = useApp();
  const [openPopup, setOpenPopup] = useState(false);
  const [customMsg, setCustomMsg] = useState('Hi Tanvir, I am browsing your website and want to buy an APK / Video Course.');

  const adminName = settings?.adminName || ADMIN_NAME;
  const adminWhatsApp = settings?.adminWhatsApp || ADMIN_WHATSAPP_NUMBER;
  const cleanPhone = getCleanWhatsAppNumber(adminWhatsApp);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMsg = `${customMsg.trim()}${user ? `\n(From: ${user.name} - ${user.email})` : ''}`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMsg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpenPopup(false);
  };

  const quickMessages = [
    `Hi ${adminName}, I want to buy an APK file.`,
    `Hi ${adminName}, I want to enroll in a video course.`,
    `Hi ${adminName}, I want to send payment via bKash / Nagad to 01329179522.`,
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* WhatsApp Quick Chat Modal */}
      {openPopup && (
        <div className="mb-3 w-80 sm:w-96 bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center font-extrabold shadow-md">
                <MessageCircle className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm leading-tight">Chat with {adminName}</h4>
                <p className="text-[11px] text-emerald-100 font-mono">{adminWhatsApp} • Online</p>
              </div>
            </div>
            <button
              onClick={() => setOpenPopup(false)}
              className="p-1 rounded-full hover:bg-emerald-700/50 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 bg-slate-950/90 text-xs">
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 text-slate-300 space-y-1">
              <p className="font-semibold text-white">👋 Hello! How can I help you today?</p>
              <p className="text-[11px] text-slate-400">
                You can ask questions, request custom APKs, or send payment confirmations for instant unlock.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Quick Messages:</p>
              <div className="flex flex-col gap-1">
                {quickMessages.map((msg, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCustomMsg(msg)}
                    className="text-left p-2 rounded-xl bg-slate-900 hover:bg-emerald-950/40 hover:border-emerald-500/30 border border-slate-800 text-slate-300 hover:text-emerald-300 text-[11px] transition-all cursor-pointer truncate"
                  >
                    "{msg}"
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSend} className="space-y-2 pt-1">
              <textarea
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                rows={3}
                placeholder="Type your message here..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none resize-none"
              />

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp Message to {adminName}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        id="btn-floating-whatsapp"
        onClick={() => setOpenPopup(!openPopup)}
        className="group relative flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl shadow-emerald-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        title={`Direct WhatsApp with ${adminName} (${adminWhatsApp})`}
      >
        <span className="relative flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-40"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-slate-950"></span>
        </span>

        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="text-xs font-bold hidden sm:inline-block">Order on WhatsApp</span>
      </button>
    </div>
  );
};
