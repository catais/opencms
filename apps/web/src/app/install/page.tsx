'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Step = 'language' | 'welcome' | 'form' | 'progress' | 'success';

export default function InstallPage() {
  const [step, setStep] = useState<Step>('language');
  const [language, setLanguage] = useState('en_US');
  
  // Form fields
  const [siteTitle, setSiteTitle] = useState('My OpenCMS Site');
  const [adminEmail, setAdminEmail] = useState('admin@opencms.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('Admin Strator');
  const [showPassword, setShowPassword] = useState(false);
  const [discourageSearch, setDiscourageSearch] = useState(false);
  
  // Progress state
  const [logs, setLogs] = useState<string[]>([]);
  const [isInstalling, setIsLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [installError, setInstallError] = useState('');

  // Styling dark mode helper
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // Password generator helper
  const generateSecurePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let pass = '';
    for (let i = 0; i < 14; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminPassword(pass);
    setShowPassword(true);
  };

  // Password strength assessor
  const getPasswordStrength = () => {
    if (!adminPassword) return { score: 0, label: 'No Password', color: 'bg-slate-300 dark:bg-slate-700', text: 'text-slate-400' };
    const len = adminPassword.length;
    const hasNum = /\d/.test(adminPassword);
    const hasUpper = /[A-Z]/.test(adminPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(adminPassword);

    if (len >= 10 && hasNum && hasUpper && hasSpecial) {
      return { score: 4, label: 'Superb (Very Secure)', color: 'bg-emerald-500', text: 'text-emerald-500' };
    }
    if (len >= 8 && hasNum && (hasUpper || hasSpecial)) {
      return { score: 3, label: 'Strong', color: 'bg-blue-500', text: 'text-blue-500' };
    }
    if (len >= 6 && (hasNum || hasUpper)) {
      return { score: 2, label: 'Medium', color: 'bg-amber-500', text: 'text-amber-500' };
    }
    return { score: 1, label: 'Weak (Dangerous)', color: 'bg-rose-500', text: 'text-rose-500' };
  };

  const strength = getPasswordStrength();

  // Simulated log writer + POST trigger
  const runInstallTrigger = async () => {
    setStep('progress');
    setIsLoading(true);
    setInstallError('');
    setLogs([]);
    setProgressPercent(5);

    const logPhrases = [
      '[SYS] Initializing setup socket...',
      '[SYS] Checking database workspace target configurations...',
      '[SYS] Provisioning SQLite tables and primary constraints via Prisma Schema push...',
      '[SYS] Synchronizing entity types: Category, Tag, Post, Page, Product, Order...',
      '[SYS] SQLite databases tables mapped and structured perfectly.',
      '[SYS] Seed script executed: deploying default configurations...',
      '[SYS] Injecting global permissions schemas...',
      '[SYS] Injecting user roles: Super Admin, Store Manager, Customer, Developer...',
      '[SYS] Seeding product portfolios: Apparel (Premium Hoodies, T-Shirts)...',
      '[SYS] Seeding device catalogs: UltraTech Wireless Headphones, Desk Architect Lamps...',
      '[SYS] Catalog configurations linked with assets and mock media.',
      '[SYS] Generating standard static page resources (About, FAQ, Contact)...',
      '[SYS] Seeding default sitemaps and search optimization metadata...',
      '[SYS] Overwriting core workspace metadata with customized parameters...',
      '[SYS] Site Workspace set to: ' + siteTitle,
      '[SYS] Compiling customized administrator accounts: ' + adminEmail,
      '[SYS] Hashing custom credentials with secure bcrypt routines...',
      '[SYS] Custom super administrator setup completed successfully.',
      '[SYS] Purging database staging cache layers...',
      '[SYS] OpenCMS installation completed. Ready to deploy storefront!',
    ];

    // Write log lines in a staggered fashion for incredible visual fidelity
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < logPhrases.length - 2) {
        setLogs(prev => [...prev, logPhrases[logIndex]]);
        setProgressPercent(prev => Math.min(prev + 5, 85));
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 450);

    try {
      const response = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteTitle,
          adminEmail,
          adminPassword,
          adminName,
        }),
      });

      const result = await response.json();

      // Stop staggered log timer, push final logs immediately and complete progress
      clearInterval(logInterval);

      if (!response.ok) {
        setInstallError(result.message || 'Database provisioning failed. Check console for logs.');
        setIsLoading(false);
      } else {
        // Write the remaining logs
        setLogs(prev => [
          ...prev,
          ...logPhrases.slice(logIndex),
        ]);
        setProgressPercent(100);
        
        setTimeout(() => {
          setIsLoading(false);
          setStep('success');
        }, 1200);
      }
    } catch (err: any) {
      clearInterval(logInterval);
      setInstallError('Connection failed. Server failed to execute shell migration routines.');
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center px-4 relative transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
    }`}>
      {/* Ambient background glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* Main Container */}
      <div className="w-full max-w-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        
        {/* WordPress Style Top Header Accent */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 w-full" />
        
        <div className="p-8 sm:p-12 space-y-8">
          
          {/* Brand Logo Header */}
          <div className="text-center space-y-2 pb-6 border-b border-slate-200/40 dark:border-slate-800/40">
            <div className="inline-flex items-center gap-3">
              <div className="h-12 w-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-md shadow-blue-500/20">
                W
              </div>
              <span className="font-black text-3xl tracking-tight text-slate-900 dark:text-white">
                Open<span className="text-blue-600">CMS</span>
              </span>
              <span className="text-2xs bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 px-2.5 py-1 rounded-full font-black tracking-wider uppercase">Setup Wizard</span>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pt-2">The Famous 5-Minute Core Installation</p>
          </div>

          {/* ================= STEP 1: LANGUAGE SELECTION ================= */}
          {step === 'language' && (
            <div className="space-y-6 text-center py-4">
              <div className="space-y-3">
                <i className="ri-global-line text-5xl text-blue-500 animate-pulse"></i>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Setup Language</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">Choose your preferred locale configuration for your core administrator site setup and catalog structures.</p>
              </div>

              <div className="max-w-xs mx-auto">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full text-xs px-4 py-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                >
                  <option value="en_US">English (United States)</option>
                  <option value="fr_FR">Français (France)</option>
                  <option value="es_ES">Español (España)</option>
                  <option value="de_DE">Deutsch (Deutschland)</option>
                  <option value="ja_JP">日本語 (日本)</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setStep('welcome')}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/15 flex items-center justify-center gap-1.5 mx-auto transition-transform active:scale-95"
                >
                  <span>Continue</span>
                  <i className="ri-arrow-right-line"></i>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: WELCOME SCREEN ================= */}
          {step === 'welcome' && (
            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <i className="ri-shield-keyhole-line text-blue-500"></i>
                  Welcome to OpenCMS
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Thank you for trying out OpenCMS! We are excited to guide you through our lightning-fast 5-minute setup sequence.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 space-y-4 text-xxs leading-relaxed text-slate-400">
                <p>
                  Because OpenCMS uses a high-performance, local **SQLite** database, we do not require you to manually fill in database hostnames, MySQL socket ports, or raw database usernames. 
                </p>
                <p>
                  Our smart backend automatically pushes database schema tables on-the-fly and initializes full roles, sample blog posts, custom themes, and complete commerce catalogs.
                </p>
                <div className="flex gap-4 pt-2 border-t border-slate-200/40 dark:border-slate-800/40 text-blue-500 font-bold">
                  <span className="flex items-center gap-1"><i className="ri-checkbox-circle-fill"></i> No MySQL Needed</span>
                  <span className="flex items-center gap-1"><i className="ri-checkbox-circle-fill"></i> Seeding Auto-Integrated</span>
                  <span className="flex items-center gap-1"><i className="ri-checkbox-circle-fill"></i> Complete under 10 seconds</span>
                </div>
              </div>

              <div className="pt-6 flex justify-between items-center">
                <button
                  onClick={() => setStep('language')}
                  className="text-xxs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('form')}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/15 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>Let’s Go!</span>
                  <i className="ri-arrow-right-line"></i>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: INFORMATION NEEDED FORM ================= */}
          {step === 'form' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Information needed</h2>
                <p className="text-xs text-slate-400">Please provide the following details. Don’t worry, you can always change these settings later in your administration panel.</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); runInstallTrigger(); }} className="space-y-4">
                
                {/* Site Title */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider pl-1">Site Title</label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="My OpenCMS Site"
                      value={siteTitle}
                      onChange={(e) => setSiteTitle(e.target.value)}
                      className="w-full text-xs px-4 py-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    />
                    <p className="text-[10px] text-slate-400 pl-1 pt-1">The name of your new website. Used in the header banners.</p>
                  </div>
                </div>

                {/* Administrator Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider pl-1">Admin Name</label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Admin Strator"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full text-xs px-4 py-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    />
                    <p className="text-[10px] text-slate-400 pl-1 pt-1">The display name of the primary Super Administrator.</p>
                  </div>
                </div>

                {/* Username / Email */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider pl-1">Admin Email</label>
                  <div className="md:col-span-2">
                    <input
                      type="email"
                      required
                      placeholder="admin@opencms.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full text-xs px-4 py-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                    />
                    <p className="text-[10px] text-slate-400 pl-1 pt-1">Double check this email. Your session notifications are sent here.</p>
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start pt-1">
                  <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider pl-1 pt-3">Password</label>
                  <div className="md:col-span-2 space-y-2">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Choose a strong password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full text-xs pl-4 pr-24 py-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200"
                      />
                      
                      {/* Password Action utilities inside input */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate-400 hover:text-slate-600 text-xs p-1"
                        >
                          <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                        </button>
                        <button
                          type="button"
                          onClick={generateSecurePassword}
                          className="text-xxs bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 hover:bg-blue-500/20 px-2 py-1 rounded font-black uppercase tracking-wider transition-colors"
                        >
                          Auto
                        </button>
                      </div>
                    </div>

                    {/* Password Strength indicator */}
                    {adminPassword && (
                      <div className="space-y-1 pl-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-400 uppercase">Strength:</span>
                          <span className={strength.text}>{strength.label}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${strength.color}`} 
                            style={{ width: `${(strength.score / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Engine Visibility */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center pt-2">
                  <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider pl-1">Visibility</label>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <input
                      id="discourageSearch"
                      type="checkbox"
                      checked={discourageSearch}
                      onChange={(e) => setDiscourageSearch(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="discourageSearch" className="text-xxs font-bold text-slate-400 cursor-pointer select-none">
                      Discourage search engines from indexing this site
                    </label>
                  </div>
                </div>

                {/* Controls */}
                <div className="pt-6 flex justify-between items-center border-t border-slate-200/40 dark:border-slate-800/40">
                  <button
                    type="button"
                    onClick={() => setStep('welcome')}
                    className="text-xxs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/15 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                  >
                    <i className="ri-key-2-line"></i>
                    <span>Install OpenCMS</span>
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* ================= STEP 4: INSTALLATION PROGRESS (TERMINAL) ================= */}
          {step === 'progress' && (
            <div className="space-y-6">
              <div className="space-y-1.5 text-center">
                <div className="inline-flex items-center gap-2 text-xs font-black text-blue-500 uppercase tracking-widest pl-1">
                  <i className="ri-loader-4-line animate-spin text-sm"></i>
                  Installing OpenCMS Core
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Seeding & Preparing Database</h2>
                <p className="text-xs text-slate-400">Please do not close this window or refresh the page while SQLite completes migration sequences.</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 pl-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pl-1">
                  <span>DEPLOYMENT PROGRESS:</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* simulated log window */}
              <div className="space-y-2">
                <div className="flex justify-between items-center pl-1 text-[10px] font-bold text-slate-400">
                  <span>LOG TERMINAL OUTPUT:</span>
                  <span className="flex items-center gap-1"><i className="ri-terminal-box-line"></i> SQLite Session</span>
                </div>
                <div className="bg-slate-950 text-slate-300 font-mono text-[10px] rounded-2xl p-5 h-44 overflow-y-auto space-y-1.5 shadow-inner border border-slate-900 leading-normal scrollbar-thin">
                  {logs.map((log, index) => (
                    <div key={index} className="animate-fade-in flex gap-2">
                      <span className="text-blue-500 font-bold select-none">&gt;</span>
                      <span className={log.includes('successfully') || log.includes('seeded') || log.includes('completed') ? 'text-emerald-400' : ''}>
                        {log}
                      </span>
                    </div>
                  ))}
                  {isInstalling && (
                    <div className="flex gap-1 items-center text-blue-400 font-bold animate-pulse pt-1 pl-1">
                      <span>_</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Box if install crashes */}
              {installError && (
                <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-xs font-semibold space-y-2">
                  <div className="flex items-center gap-2 text-rose-500">
                    <i className="ri-error-warning-line text-lg"></i>
                    <span className="font-bold">Installation Error Occurred</span>
                  </div>
                  <p className="text-slate-400 text-xxs font-normal pl-7 leading-relaxed">{installError}</p>
                  <button
                    onClick={() => setStep('form')}
                    className="mt-3 ml-7 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xxs font-bold transition-all"
                  >
                    Return to Form
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 5: SUCCESS CARD ================= */}
          {step === 'success' && (
            <div className="space-y-6 py-4 animate-scale-up">
              
              <div className="text-center space-y-3 pb-2">
                <div className="h-16 w-16 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/5">
                  <i className="ri-checkbox-circle-fill animate-bounce"></i>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">OpenCMS Installed Successfully!</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  OpenCMS has been configured, migrated, and seeded perfectly. Thank you, and enjoy your new platform!
                </p>
              </div>

              {/* Configuration Credentials Details */}
              <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 space-y-4">
                <p className="text-xxs uppercase font-extrabold text-slate-400 tracking-wider">Onboarding Credentials Summary</p>
                
                <div className="space-y-3 text-xs">
                  
                  {/* Site Title */}
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-200/40 dark:border-slate-800/40">
                    <span className="text-slate-400 font-bold text-xxs uppercase">Site Title</span>
                    <span className="col-span-2 font-bold text-slate-800 dark:text-slate-200">{siteTitle}</span>
                  </div>

                  {/* Username / Email */}
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-200/40 dark:border-slate-800/40">
                    <span className="text-slate-400 font-bold text-xxs uppercase">Username (Email)</span>
                    <span className="col-span-2 font-mono font-bold text-blue-500">{adminEmail}</span>
                  </div>

                  {/* Password reminder */}
                  <div className="grid grid-cols-3 gap-2 py-1.5">
                    <span className="text-slate-400 font-bold text-xxs uppercase">Password</span>
                    <span className="col-span-2 font-bold text-slate-400">Your chosen password</span>
                  </div>

                </div>
              </div>

              {/* ENTRYPOINT SHORTCUT LINKS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                
                {/* Public Storefront URL Card */}
                <Link 
                  href="/"
                  className="p-5 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/20 rounded-2xl group transition-all text-left flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-xxs font-extrabold text-blue-500 uppercase tracking-widest">Public Frontend</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Visit Storefront</p>
                    <p className="text-[10px] text-slate-400 font-mono">/</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:translate-x-1 transition-transform">
                    <i className="ri-external-link-line text-lg"></i>
                  </div>
                </Link>

                {/* Admin Dashboard URL Card */}
                <Link 
                  href="/login"
                  className="p-5 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20 rounded-2xl group transition-all text-left flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-xxs font-extrabold text-emerald-500 uppercase tracking-widest">Admin Control Panel</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Log In to Admin</p>
                    <p className="text-[10px] text-slate-400 font-mono">/admin</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:translate-x-1 transition-transform">
                    <i className="ri-key-2-line text-lg"></i>
                  </div>
                </Link>

              </div>
              
            </div>
          )}

        </div>
      </div>

      {/* setup footer info */}
      <p className="mt-8 text-3xs text-slate-400 uppercase tracking-widest font-black">
        OpenCMS v1.0.0 — Designed for modern performance.
      </p>
    </div>
  );
}
