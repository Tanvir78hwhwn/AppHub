import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { X, KeyRound, Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

export const ForgotPasswordModal: React.FC = () => {
  const { forgotPasswordOpen, setForgotPasswordOpen, setAuthModalOpen, setAuthModalTab, addToast } = useApp();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState('');

  if (!forgotPasswordOpen) return null;

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      setSimulatedCode(res.demoResetToken || '123456');
      setCode(res.demoResetToken || '123456');
      setStep('reset');
      addToast({
        type: 'info',
        title: 'Verification Code Sent',
        message: 'A verification token has been generated. (Auto-filled for demo).'
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Request Failed',
        message: err.message || 'Could not process password reset.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.resetPassword({
        email: email.trim(),
        resetToken: code.trim(),
        newPassword
      });
      addToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been changed. Please log in.'
      });
      setForgotPasswordOpen(false);
      setAuthModalTab('login');
      setAuthModalOpen(true);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Reset Failed',
        message: err.message || 'Invalid code or password.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="fixed inset-0" onClick={() => setForgotPasswordOpen(false)} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Reset Password</h3>
          </div>
          <button
            onClick={() => setForgotPasswordOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'request' ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <p className="text-xs text-slate-300">
              Enter your registered account email to receive a password reset verification token.
            </p>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset Token</span>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300">
              Demo Code: <span className="font-mono font-bold text-white">{simulatedCode}</span>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Verification Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save New Password</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
