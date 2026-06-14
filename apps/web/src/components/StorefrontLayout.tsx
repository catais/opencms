'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface StorefrontThemeContextType {
  activeThemeSlug: string;
  themeConfig: any;
  plugins: any[];
}

export const StorefrontThemeContext = createContext<StorefrontThemeContextType>({
  activeThemeSlug: 'minimal-saas',
  themeConfig: null,
  plugins: [],
});

export const useStorefrontTheme = () => useContext(StorefrontThemeContext);

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeThemeSlug, setActiveThemeSlug] = useState<string>('minimal-saas');
  const [themeConfig, setThemeConfig] = useState<any>(null);
  const [plugins, setPlugins] = useState<any[]>([]);

  // Sync cart count from local storage on load
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('opencms_cart') || '[]');
        const count = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);
        setCartCount(count);
      } catch (e) {
        setCartCount(0);
      }
    };
    
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('opencms_cart_updated', updateCartCount);

    // Sync dark mode style setting
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('opencms_cart_updated', updateCartCount);
    };
  }, []);

  // Intercept and redirect to installation wizard if system is not installed
  useEffect(() => {
    const checkInstallation = async () => {
      if (pathname === '/install') return;
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
  }, [pathname]);

  // Fetch active theme and active plugins
  useEffect(() => {
    const fetchThemeAndPlugins = async () => {
      try {
        const themeRes = await fetch(`/api/theme/active?_t=${Date.now()}`, { cache: 'no-store' });
        const themeData = await themeRes.json();
        if (themeData.success && themeData.data) {
          setActiveThemeSlug(themeData.data.slug || 'minimal-saas');
          setThemeConfig(themeData.data.config);
          
          // Force override dark mode state for Retro and Midnight
          if (themeData.data.slug === 'dark-midnight') {
            setIsDarkMode(true);
            document.documentElement.classList.add('dark');
          } else if (themeData.data.slug === 'retro-coffee') {
            setIsDarkMode(false);
            document.documentElement.classList.remove('dark');
          }
        }

        const pluginsRes = await fetch(`/api/plugins/active?_t=${Date.now()}`, { cache: 'no-store' });
        const pluginsData = await pluginsRes.json();
        if (pluginsData.success && Array.isArray(pluginsData.data)) {
          setPlugins(pluginsData.data);
        }
      } catch (err) {
        console.error('Error fetching theme/plugins:', err);
      }
    };

    fetchThemeAndPlugins();

    window.addEventListener('opencms_theme_changed', fetchThemeAndPlugins);
    window.addEventListener('opencms_plugins_changed', fetchThemeAndPlugins);

    return () => {
      window.removeEventListener('opencms_theme_changed', fetchThemeAndPlugins);
      window.removeEventListener('opencms_plugins_changed', fetchThemeAndPlugins);
    };
  }, [pathname]);

  // Sync Page Titles with SEO Optimizer Pro configuration
  useEffect(() => {
    const getPageTitle = (path: string): string => {
      if (path === '/') return 'Home';
      if (path === '/shop') return 'Shop Catalog';
      if (path === '/blog') return 'Blog';
      if (path === '/cart') return 'Your Cart';
      if (path === '/checkout') return 'Secure Checkout';
      if (path === '/account') return 'My Account';
      if (path.startsWith('/blog/')) return 'Blog Post';
      if (path.startsWith('/shop/')) return 'Product Details';
      return 'Page';
    };

    const seoPlugin = plugins.find(p => p.slug === 'seo-optimizer' && p.isActive);
    const pageTitle = getPageTitle(pathname);
    
    if (seoPlugin) {
      const template = seoPlugin.settings?.metaTemplate || '%title% | %site_name%';
      const formattedTitle = template
        .replace('%title%', pageTitle)
        .replace('%site_name%', 'OpenCMS')
        .replace('%tagline%', 'The Ultimate Modern Headless System');
      document.title = formattedTitle;
    } else {
      document.title = `${pageTitle} | OpenCMS Storefront`;
    }
  }, [pathname, plugins]);

  const toggleTheme = () => {
    if (activeThemeSlug !== 'minimal-saas') return; // Enforce static theme environments for stylized Retro and Dark Midnight
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop Catalog', href: '/shop' },
    { name: 'Blog', href: '/blog' },
    { name: 'Account Portal', href: '/account' },
    { name: 'Admin Dashboard', href: '/admin' },
  ];

  const primaryColor = themeConfig?.primaryColor || '#2563EB';
  const secondaryColor = themeConfig?.secondaryColor || '#0F172A';
  const backgroundColor = themeConfig?.backgroundColor || (isDarkMode ? '#090D16' : '#F8FAFC');
  const textColor = themeConfig?.textColor || (isDarkMode ? '#E2E8F0' : '#1E293B');
  const fontFamily = themeConfig?.fontFamily || 'Inter, sans-serif';

  return (
    <StorefrontThemeContext.Provider value={{ activeThemeSlug, themeConfig, plugins }}>
      <div className={`min-h-screen flex flex-col theme-font theme-bg-override transition-colors duration-300 ${
        isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        
        {/* Dynamic Style Block */}
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=Georgia:ital,wght@0,400;0,700;1,400&family=Share+Tech+Mono&display=swap');
          
          :root {
            --theme-primary: ${primaryColor};
            --theme-secondary: ${secondaryColor};
            --theme-background: ${backgroundColor};
            --theme-text: ${textColor};
            --theme-font: ${fontFamily};
            --theme-border-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};
            --theme-header-bg: ${isDarkMode ? 'rgba(9, 13, 22, 0.85)' : 'rgba(255, 255, 255, 0.85)'};
          }

          .theme-font, body, input, select, textarea, button {
            font-family: var(--theme-font), system-ui, -apple-system, sans-serif !important;
          }

          .theme-bg-override {
            background-color: var(--theme-background) !important;
            color: var(--theme-text) !important;
          }

          body {
            background-color: var(--theme-background) !important;
            color: var(--theme-text) !important;
          }

          .theme-primary-bg {
            background-color: var(--theme-primary) !important;
          }

          .theme-primary-text {
            color: var(--theme-primary) !important;
          }

          .theme-primary-border {
            border-color: var(--theme-primary) !important;
          }

          header.theme-header {
            background-color: var(--theme-header-bg) !important;
            border-color: var(--theme-border-color) !important;
          }

          .theme-nav-link:hover {
            color: var(--theme-primary) !important;
          }

          /* --- Retro Coffee Override Styles --- */
          ${activeThemeSlug === 'retro-coffee' ? `
            :root {
              --theme-primary: #B45309;
              --theme-secondary: #78350F;
              --theme-background: #FEF3C7;
              --theme-text: #451A03;
              --theme-font: 'Georgia', serif;
            }
            body, .theme-font, p, span, input, select, button, textarea {
              font-family: 'Georgia', serif !important;
            }
            .theme-card {
              border: 3px solid #451A03 !important;
              border-radius: 0px !important;
              background-color: #FFFDF5 !important;
              box-shadow: 5px 5px 0px 0px #451A03 !important;
              color: #451A03 !important;
              transition: all 0.15s ease !important;
            }
            .theme-card:hover {
              transform: translate(-3px, -3px) !important;
              box-shadow: 8px 8px 0px 0px #451A03 !important;
            }
            .theme-btn, .theme-button, .theme-btn-primary {
              background-color: #B45309 !important;
              color: #FEF3C7 !important;
              border: 3px solid #451A03 !important;
              border-radius: 0px !important;
              box-shadow: 4px 4px 0px 0px #451A03 !important;
              font-weight: 800 !important;
              transition: all 0.1s ease !important;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .theme-btn:hover, .theme-button:hover, .theme-btn-primary:hover {
              transform: translate(-1px, -1px) !important;
              box-shadow: 5px 5px 0px 0px #451A03 !important;
              filter: brightness(1.05) !important;
            }
            .theme-btn:active, .theme-button:active, .theme-btn-primary:active {
              transform: translate(3px, 3px) !important;
              box-shadow: 1px 1px 0px 0px #451A03 !important;
            }
            .theme-border {
              border: 3px solid #451A03 !important;
              border-radius: 0px !important;
            }
            header.theme-header {
              background-color: #FEF3C7 !important;
              border-bottom: 4px solid #451A03 !important;
              color: #451A03 !important;
            }
            footer.theme-footer {
              background-color: #FFFBEB !important;
              border-top: 4px solid #451A03 !important;
              color: #451A03 !important;
            }
          ` : activeThemeSlug === 'dark-midnight' ? `
            /* --- Dark Midnight Override Styles --- */
            :root {
              --theme-primary: #6366F1;
              --theme-secondary: #0E1322;
              --theme-background: #090D16;
              --theme-text: #E2E8F0;
              --theme-font: 'system-ui', sans-serif;
            }
            body, .theme-font {
              font-family: 'system-ui', -apple-system, sans-serif !important;
            }
            .theme-card {
              border: 1px solid rgba(99, 102, 241, 0.25) !important;
              border-radius: 0.75rem !important;
              background-color: #0E1322 !important;
              box-shadow: 0 0 15px rgba(99, 102, 241, 0.05) !important;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            .theme-card:hover {
              border-color: rgba(99, 102, 241, 0.6) !important;
              box-shadow: 0 0 25px rgba(99, 102, 241, 0.35) !important;
              transform: translateY(-3px) !important;
            }
            .theme-btn, .theme-button, .theme-btn-primary {
              background-color: #6366F1 !important;
              color: #ffffff !important;
              border: 1px solid rgba(255, 255, 255, 0.15) !important;
              border-radius: 0.5rem !important;
              box-shadow: 0 0 15px rgba(99, 102, 241, 0.2) !important;
              transition: all 0.2s ease !important;
            }
            .theme-btn:hover, .theme-button:hover, .theme-btn-primary:hover {
              box-shadow: 0 0 25px rgba(99, 102, 241, 0.5) !important;
              background-color: #4F46E5 !important;
              transform: translateY(-1px) !important;
            }
            .theme-border {
              border-color: rgba(99, 102, 241, 0.2) !important;
            }
            header.theme-header {
              background-color: rgba(9, 13, 22, 0.9) !important;
              border-bottom: 1px solid rgba(99, 102, 241, 0.2) !important;
              backdrop-blur: 12px;
            }
            footer.theme-footer {
              background-color: #05070B !important;
              border-top: 1px solid rgba(99, 102, 241, 0.2) !important;
            }
          ` : `
            /* --- Minimal SaaS Styles (Default) --- */
            .theme-card {
              border: 1px solid rgba(0, 0, 0, 0.06) !important;
              border-radius: 1rem !important;
              background-color: #ffffff !important;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
              transition: all 0.2s ease !important;
            }
            .theme-card:hover {
              transform: translateY(-2px) !important;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
            }
            .theme-btn, .theme-button, .theme-btn-primary {
              background-color: var(--theme-primary) !important;
              color: #ffffff !important;
              border-radius: 0.75rem !important;
              transition: all 0.2s ease !important;
            }
            .theme-btn:hover, .theme-button:hover, .theme-btn-primary:hover {
              filter: brightness(0.95) !important;
              transform: translateY(-1px) !important;
            }
            .theme-border {
              border-color: rgba(0, 0, 0, 0.06) !important;
            }
            header.theme-header {
              background-color: rgba(255, 255, 255, 0.85) !important;
              border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
            }
            footer.theme-footer {
              background-color: rgba(255, 255, 255, 0.4) !important;
              border-top: 1px solid rgba(0, 0, 0, 0.06) !important;
            }
          `}
        ` }} />

        {/* Top Header Navigation */}
        <header className={`h-20 ${activeThemeSlug === 'retro-coffee' ? 'relative border-b-4 border-[#451A03]' : 'sticky border-b backdrop-blur-md'} top-0 z-40 transition-colors theme-header ${
          isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/85 border-slate-100'
        }`}>
          <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className={`h-9 w-9 ${activeThemeSlug === 'retro-coffee' ? 'rounded-none border-2 border-[#451A03] bg-[#B45309]' : activeThemeSlug === 'dark-midnight' ? 'rounded-md bg-indigo-600 shadow-[0_0_10px_#6366F1]' : 'rounded-xl theme-primary-bg shadow-md shadow-blue-600/20'} flex items-center justify-center text-white font-extrabold`}>
                O
              </div>
              <span className={`font-extrabold text-xl tracking-tight ${activeThemeSlug === 'retro-coffee' ? 'text-[#451A03]' : 'text-slate-900 dark:text-white'}`}>
                Open{activeThemeSlug === 'retro-coffee' ? <span className="text-[#B45309]">CMS</span> : <span className="theme-primary-text">CMS</span>}
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link, idx) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={idx}
                    href={link.href}
                    className={`text-sm font-semibold transition-colors theme-nav-link ${
                      active 
                        ? (activeThemeSlug === 'retro-coffee' ? 'text-[#B45309] font-black underline decoration-[#B45309] decoration-2' : 'theme-primary-text font-bold') 
                        : (activeThemeSlug === 'retro-coffee' ? 'text-[#451A03]' : 'text-slate-600 dark:text-slate-300')
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Controls */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              {activeThemeSlug === 'minimal-saas' && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-colors"
                >
                  <i className={isDarkMode ? 'ri-sun-line text-lg' : 'ri-moon-line text-lg'}></i>
                </button>
              )}

              {/* Theme specific decorations */}
              {activeThemeSlug === 'retro-coffee' && (
                <span className="hidden lg:inline text-xxs font-bold text-[#B45309] bg-[#FDE68A] border-2 border-[#451A03] px-2 py-1">
                  ☕ Open 8am - 10pm
                </span>
              )}

              {activeThemeSlug === 'dark-midnight' && (
                <span className="hidden lg:inline text-xxs font-mono text-[#6366F1] bg-[#1E1B4B] border border-[#6366F1]/30 px-2 py-1 rounded">
                  SYS: ONLINE
                </span>
              )}

              {/* Shopping Cart button */}
              <Link
                href="/cart"
                className={`p-2 transition-colors relative flex items-center gap-1.5 ${
                  activeThemeSlug === 'retro-coffee' 
                    ? 'border-2 border-[#451A03] rounded-none bg-[#FFFDF5] text-[#451A03] font-bold' 
                    : activeThemeSlug === 'dark-midnight'
                    ? 'border border-indigo-500/30 rounded bg-[#0E1322] text-slate-200'
                    : `border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${isDarkMode ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'}`
                }`}
              >
                <i className="ri-shopping-cart-2-line text-lg"></i>
                <span className="hidden sm:inline text-xs font-bold">Cart</span>
                {cartCount > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 h-5 w-5 text-white rounded-full flex items-center justify-center text-3xs font-extrabold shadow-sm ${
                    activeThemeSlug === 'retro-coffee' ? 'bg-[#B45309] border border-[#451A03]' : 'theme-primary-bg shadow-blue-500/30'
                  }`}>
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile hamburger menu */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-lg transition-colors md:hidden ${
                  activeThemeSlug === 'retro-coffee' ? 'border-2 border-[#451A03] text-[#451A03]' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <i className={isMobileMenuOpen ? 'ri-close-line text-xl' : 'ri-menu-3-line text-xl'}></i>
              </button>
            </div>

          </div>
        </header>

        {/* Mobile Menu Dropdown Panel */}
        {isMobileMenuOpen && (
          <div className={`md:hidden border-b py-4 px-4 flex flex-col gap-4 absolute top-20 left-0 w-full z-30 shadow-md ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`} style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border-color)' }}>
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm font-semibold py-1.5 theme-nav-link ${
                  pathname === link.href ? 'theme-primary-text font-bold' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}

        {/* Main Content Layout Block */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Global Footer */}
        <footer className={`border-t py-12 px-4 md:px-6 transition-colors theme-footer ${
          isDarkMode ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-500'
        }`}>
          <div className={`max-w-7xl mx-auto grid grid-cols-1 ${
            activeThemeSlug === 'retro-coffee' ? 'md:grid-cols-3' : activeThemeSlug === 'dark-midnight' ? 'md:grid-cols-2' : 'md:grid-cols-4'
          } gap-8`}>
            
            {/* Col 1: Brand & Logo */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2">
                <div className={`h-8 w-8 ${activeThemeSlug === 'retro-coffee' ? 'rounded-none border-2 border-[#451A03] bg-[#B45309]' : 'rounded-lg theme-primary-bg'} flex items-center justify-center text-white font-extrabold`}>
                  O
                </div>
                <span className={`font-extrabold text-lg ${activeThemeSlug === 'retro-coffee' ? 'text-[#451A03]' : 'text-slate-900 dark:text-white'}`}>
                  Open{activeThemeSlug === 'retro-coffee' ? <span className="text-[#B45309]">CMS</span> : <span className="theme-primary-text">CMS</span>}
                </span>
              </Link>
              <p className="text-xs leading-relaxed max-w-xs">
                A premium, open-source headless CMS and e-commerce layout platform built with Next.js, TypeScript, and Tailwind CSS. Modern, lightning fast, and secure.
              </p>
              <div className="flex gap-3 text-slate-400">
                <i className="ri-github-fill text-lg cursor-pointer hover:text-blue-500"></i>
                <i className="ri-twitter-x-fill text-lg cursor-pointer hover:text-blue-500"></i>
                <i className="ri-youtube-fill text-lg cursor-pointer hover:text-blue-500"></i>
              </div>
            </div>

            {/* Col 2: Storefront Links */}
            <div className="space-y-3">
              <span className={`text-xs font-bold uppercase tracking-wider ${activeThemeSlug === 'retro-coffee' ? 'text-[#451A03]' : 'text-slate-800 dark:text-slate-200'}`}>Shop Catalog</span>
              <ul className="text-xs space-y-2">
                <li><Link href="/shop" className="hover:underline">Apparel & Shirts</Link></li>
                <li><Link href="/shop" className="hover:underline">Audio Gadgets</Link></li>
                <li><Link href="/shop" className="hover:underline">Software Licences</Link></li>
                <li><Link href="/shop" className="hover:underline">Featured Releases</Link></li>
              </ul>
            </div>

            {/* Col 3: Resources (Omitted in Midnight theme) */}
            {activeThemeSlug !== 'dark-midnight' && (
              <div className="space-y-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${activeThemeSlug === 'retro-coffee' ? 'text-[#451A03]' : 'text-slate-800 dark:text-slate-200'}`}>Developer Resources</span>
                <ul className="text-xs space-y-2">
                  <li><Link href="/admin/developers" className="hover:underline">API Documentation</Link></li>
                  <li><Link href="/admin/developers" className="hover:underline">REST Webhook Setup</Link></li>
                  <li><Link href="/admin/developers" className="hover:underline">Developer Keys</Link></li>
                  <li><Link href="/admin/plugins" className="hover:underline">Plugin Core Guides</Link></li>
                </ul>
              </div>
            )}

            {/* Col 4: Newsletter Subscription (Only in Minimal SaaS) */}
            {activeThemeSlug === 'minimal-saas' && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Subscribe</span>
                <p className="text-xs">Stay updated with the latest in OpenCMS.</p>
                <div className="flex rounded-lg overflow-hidden border dark:border-slate-800">
                  <input
                    type="email"
                    placeholder="developer@opencms.com"
                    className="bg-slate-50 dark:bg-slate-800 text-xs px-3 py-2 w-full focus:outline-none"
                  />
                  <button className="theme-primary-bg text-white text-xs px-3 font-semibold theme-button">
                    Join
                  </button>
                </div>
              </div>
            )}

          </div>

          <div className={`max-w-7xl mx-auto border-t mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xxs ${activeThemeSlug === 'retro-coffee' ? 'border-[#451A03] text-[#451A03]/80' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`}>
            <p>© 2026 OpenCMS Core. Rebuilding the web, one block at a time.</p>
            <div className="flex gap-4">
              <span className="cursor-pointer hover:underline">Privacy Policy</span>
              <span className="cursor-pointer hover:underline">Terms of Service</span>
              <span className="cursor-pointer hover:underline">Sitemap index</span>
            </div>
          </div>
        </footer>

      </div>
    </StorefrontThemeContext.Provider>
  );
}
