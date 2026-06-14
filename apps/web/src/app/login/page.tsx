'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync with system dark mode configuration
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Intercept and redirect to installation wizard if system is not installed
  useEffect(() => {
    const checkInstallation = async () => {
      try {
        const res = await fetch('/api/install/status');
        const data = await res.json();
        if (data && data.installed === false) {
          window.location.href = '/install';
        }
      } catch (err) {
        console.error('Failed to check installation status:', err);
      }
    };
    checkInstallation();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please specify both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const res = await response.json();

      if (!response.ok) {
        setErrorMsg(res.message || 'Authentication failed. Please verify credentials.');
      } else {
        setSuccessMsg('Authenticated! Entering admin dashboard...');
        // Save token or login details in local state if needed
        localStorage.setItem('opencms_admin_email', res.data.user.email);
        
        // Wait a split second to display beautiful success micro-animation
        setTimeout(() => {
          router.push('/admin');
        }, 800);
      }
    } catch (err) {
      setErrorMsg('A network error occurred. Failed to connect to authenticating servers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = async () => {
    setEmail('admin@opencms.com');
    setPassword('admin123');
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@opencms.com', password: 'admin123' }),
      });

      const res = await response.json();

      if (!response.ok) {
        setErrorMsg(res.message || 'Authentication failed. Please verify credentials.');
      } else {
        setSuccessMsg('Authenticated! Entering admin dashboard...');
        localStorage.setItem('opencms_admin_email', res.data.user.email);
        
        // Wait a split second to display beautiful success micro-animation
        setTimeout(() => {
          router.push('/admin');
        }, 800);
      }
    } catch (err) {
      setErrorMsg('A network error occurred. Failed to connect to authenticating servers.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center px-4 relative transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
    }`}>
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl relative z-10 space-y-6">
        
        {/* Brand / Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="h-11 w-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
              O
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-900 dark:text-white">
              Open<span className="text-blue-600">CMS</span>
            </span>
          </Link>
          <p className="text-xxs text-slate-400 uppercase tracking-widest font-black">Management Gateway</p>
        </div>

        {/* Info or Alerts */}
        {errorMsg && (
          <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-3.5 text-xxs font-semibold flex items-center gap-2 animate-shake">
            <i className="ri-error-warning-line text-xs"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl p-3.5 text-xxs font-semibold flex items-center gap-2">
            <i className="ri-checkbox-circle-line text-xs animate-bounce"></i>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Input Fields Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider pl-1">Email Address</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <i className="ri-mail-line"></i>
              </span>
              <input
                type="email"
                required
                disabled={isLoading}
                placeholder="admin@opencms.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center pl-1">
              <label className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Password</label>
              <span className="text-3xs text-blue-500 hover:underline cursor-pointer">Forgot?</span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <i className="ri-lock-line"></i>
              </span>
              <input
                type="password"
                required
                disabled={isLoading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl font-bold text-xs text-center transition-all shadow-md shadow-blue-500/15 flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <>
                <i className="ri-loader-4-line animate-spin text-sm"></i>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Enter Administration</span>
                <i className="ri-arrow-right-line"></i>
              </>
            )}
          </button>
        </form>

        {/* Quick Sandbox Login credentials helper */}
        <div className="border-t dark:border-slate-800/80 pt-5 space-y-3">
          <p className="text-4xs text-slate-400 uppercase tracking-widest text-center font-bold">Sandbox testing tools</p>
          <div 
            onClick={handleQuickFill}
            className="p-3 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/20 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
          >
            <div className="space-y-0.5 text-left">
              <p className="text-[10px] font-bold text-blue-500">Auto-Fill Administrator Credentials</p>
              <p className="text-[9px] font-mono text-slate-400">admin@opencms.com / admin123</p>
            </div>
            <i className="ri-magic-line text-blue-500 text-sm group-hover:rotate-12 transition-transform"></i>
          </div>
        </div>

      </div>

      {/* Back to Public Site */}
      <Link 
        href="/" 
        className="mt-6 text-xxs text-slate-400 hover:text-blue-500 flex items-center gap-1 transition-colors relative z-10"
      >
        <i className="ri-arrow-left-s-line"></i> Back to Public Storefront
      </Link>
    </div>
  );
}
