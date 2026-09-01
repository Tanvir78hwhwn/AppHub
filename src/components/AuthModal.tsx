import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Loader2
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    authModalTab, 
    setAuthModalTab, 
    setForgotPasswordOpen,
    login, 
    register, 
    addToast 
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authModalTab === 'login') {
        await login(email.trim(), password);
        addToast({
          type: 'success',
          title: 'Welcome Back!',
          message: 'You have logged in successfully.'
        });
      } else {
        if (!name.trim()) {
          addToast({
            type: 'error',
            title: 'Name Required',
            message: 'Please enter your full name.'
          });
          setLoading(false);
          return;
        }
        await register(email.trim(), password, name.trim());
        addToast({
          type: 'success',
          title: 'Account Created',
          message: 'Your account is ready! Welcome to AppHub.'
        });
      }
      setAuthModalOpen(false);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: authModalTab === 'login' ? 'Login Failed' : 'Registration Failed',
        message: err.message || 'Please check your credentials.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setEmail('admin@apphub.local');
      setPassword('admin123');
      setAuthModalTab('login');
    } else {
      setEmail('user@apphub.local');
      setPassword('user123');
      setAuthModalTab('login');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="fixed inset-0" 
        onClick={() => setAuthModalOpen(false)} 
      />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              {authModalTab === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                {authModalTab === 'login' ? 'Sign In to AppHub' : 'Create Free Account'}
              </h2>
              <p className="text-[10px] text-slate-400">Unlock downloads and video masterclasses</p>
            </div>
          </div>

          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex rounded-xl m-4 p-1 bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => setAuthModalTab('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              authModalTab === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthModalTab('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              authModalTab === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Form Body */}
        <div className="px-6 pb-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authModalTab === 'register' && (
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-300">Password</label>
                {authModalTab === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalOpen(false);
                      setForgotPasswordOpen(true);
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : authModalTab === 'login' ? (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill helper */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider text-center">
              Quick One-Click Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Fill Admin Demo</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('user')}
                className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Fill User Demo</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
