'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarItem {
  name: string;
  href: string;
  icon: string;
  badge?: string | number;
}

interface NavGroup {
  groupName: string;
  items: SidebarItem[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState('OpenCMS Sandbox Site');
  const [isWorkspaceDropdownOpen, setIsWorkspaceWorkspaceDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [activePlugins, setActivePlugins] = useState<any[]>([]);

  // Initialize Dark Mode based on localStorage
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

  // Fetch active plugins to display on sidebar
  const fetchActivePlugins = async () => {
    try {
      const res = await fetch('/api/admin/plugins?_t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const active = (json.data || []).filter((p: any) => p.isActive);
          setActivePlugins(active);
        }
      }
    } catch (err) {
      console.error('Error fetching active plugins for sidebar:', err);
    }
  };

  useEffect(() => {
    fetchActivePlugins();

    if (typeof window !== 'undefined') {
      window.addEventListener('opencms_plugins_changed', fetchActivePlugins);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('opencms_plugins_changed', fetchActivePlugins);
      }
    };
  }, []);

  const toggleDarkMode = () => {
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

  const menuGroups: NavGroup[] = [
    {
      groupName: 'Core',
      items: [
        { name: 'Dashboard', href: '/admin', icon: 'ri-dashboard-line' },
        { name: 'Media Library', href: '/admin/media', icon: 'ri-image-line' },
      ],
    },
    {
      groupName: 'CMS Content',
      items: [
        { name: 'Pages', href: '/admin/pages', icon: 'ri-file-copy-2-line' },
        { name: 'Blog Posts', href: '/admin/posts', icon: 'ri-article-line' },
      ],
    },
    {
      groupName: 'WooCommerce Store',
      items: [
        { name: 'Products', href: '/admin/products', icon: 'ri-shopping-bag-3-line' },
        { name: 'Orders', href: '/admin/orders', icon: 'ri-bill-line', badge: 1 },
        { name: 'Customers', href: '/admin/customers', icon: 'ri-user-shared-line' },
        { name: 'Coupons', href: '/admin/coupons', icon: 'ri-coupon-3-line' },
      ],
    },
    {
      groupName: 'Extensibility',
      items: [
        { name: 'Themes', href: '/admin/themes', icon: 'ri-palette-line' },
        { name: 'Plugins/Apps', href: '/admin/plugins', icon: 'ri-plug-2-line' },
      ],
    },
    ...(activePlugins.length > 0
      ? [
          {
            groupName: 'Active Plugins',
            items: activePlugins.map(p => ({
              name: p.name,
              href: `/admin/plugins/setup/${p.slug}`,
              icon: 'ri-plug-fill',
            })),
          },
        ]
      : []),
    {
      groupName: 'System Tools',
      items: [
        { name: 'Users & Roles', href: '/admin/users', icon: 'ri-shield-user-line' },
        { name: 'Developers Panel', href: '/admin/developers', icon: 'ri-code-s-slash-line' },
        { name: 'Settings', href: '/admin/settings', icon: 'ri-settings-4-line' },
      ],
    },
  ];

  const handleLogout = () => {
    // Clear cookie and redirect
    document.cookie = 'opencms_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* 1. Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r transition-all duration-300 ease-in-out shrink-0 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        } ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-inherit shrink-0">
          {!isSidebarCollapsed && (
            <Link href="/admin" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                O
              </div>
              <span className="font-extrabold text-xl tracking-tight text-blue-600">OpenCMS</span>
            </Link>
          )}
          {isSidebarCollapsed && (
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold mx-auto">
              O
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 ${
              isSidebarCollapsed ? 'mx-auto' : ''
            }`}
          >
            <i className={isSidebarCollapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'}></i>
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isSidebarCollapsed && (
                <span className="text-xxs uppercase tracking-wider font-semibold text-slate-400 px-3">
                  {group.groupName}
                </span>
              )}
              {isSidebarCollapsed && <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />}
              {group.items.map((item, iIdx) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={iIdx}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative ${
                      active
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <i className={`${item.icon} text-lg ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600'}`}></i>
                    {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                    
                    {/* Badge */}
                    {!isSidebarCollapsed && item.badge && (
                      <span className="ml-auto bg-blue-600 text-white text-xxs px-1.5 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip for collapsed sidebar */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-16 z-50 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* 2. Mobile Sidebar Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          
          <aside className={`relative flex flex-col w-72 h-full p-4 border-r ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  O
                </div>
                <span className="font-extrabold text-xl text-blue-600">OpenCMS</span>
              </Link>
              <button onClick={() => setIsMobileOpen(false)} className="p-1 rounded bg-slate-100 dark:bg-slate-800">
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto space-y-4">
              {menuGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <span className="text-xxs uppercase tracking-wider font-semibold text-slate-400 px-3">
                    {group.groupName}
                  </span>
                  {group.items.map((item, iIdx) => (
                    <Link
                      key={iIdx}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <i className={`${item.icon} text-lg`}></i>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* 3. Main Frame container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar Header */}
        <header className={`h-16 flex items-center justify-between px-4 border-b shrink-0 z-30 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden text-slate-500"
          >
            <i className="ri-menu-line text-xl"></i>
          </button>

          {/* Workspace Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsWorkspaceWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border border-transparent hover:border-slate-200 dark:hover:border-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <i className="ri-global-line text-blue-500"></i>
              <span className="truncate max-w-[120px] md:max-w-none">{activeWorkspace}</span>
              <i className="ri-arrow-down-s-line text-slate-400"></i>
            </button>
            {isWorkspaceDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsWorkspaceWorkspaceDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-56 rounded-xl border p-1 shadow-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 z-20">
                  <button
                    onClick={() => {
                      setActiveWorkspace('OpenCMS Sandbox Site');
                      setIsWorkspaceWorkspaceDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span>OpenCMS Sandbox Site</span>
                    {activeWorkspace === 'OpenCMS Sandbox Site' && <i className="ri-check-line text-blue-500 font-bold"></i>}
                  </button>
                  <button
                    onClick={() => {
                      setActiveWorkspace('Boutique Shopify Store');
                      setIsWorkspaceWorkspaceDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span>Boutique Shopify Store</span>
                    {activeWorkspace === 'Boutique Shopify Store' && <i className="ri-check-line text-blue-500 font-bold"></i>}
                  </button>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  <Link href="/admin/settings" className="w-full block px-3 py-2 text-xxs text-slate-400 hover:text-blue-500 text-left">
                    <i className="ri-add-circle-line mr-1"></i> Add new site/workspace
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Right Header Navigation Utilities */}
          <div className="flex items-center gap-3">
            {/* Global search */}
            <div className="hidden lg:flex items-center gap-2 border px-3 py-1.5 rounded-lg w-64 bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
              <i className="ri-search-2-line text-slate-400"></i>
              <input
                type="text"
                placeholder="Quick search (⌘K)..."
                className="bg-transparent text-xs w-full focus:outline-none text-slate-600 dark:text-slate-200"
              />
            </div>

            {/* Dark Mode button */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-colors"
            >
              <i className={isDarkMode ? 'ri-sun-line' : 'ri-moon-line'}></i>
            </button>

            {/* Notifications panel */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-colors relative"
              >
                <i className="ri-notification-3-line"></i>
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              </button>
              {isNotificationOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotificationOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border p-2 shadow-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 z-20">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Recent Notifications</span>
                      <span className="text-xxs text-blue-500 cursor-pointer">Mark all read</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto mt-1 space-y-1">
                      <div className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex gap-3 text-left cursor-pointer">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                          <i className="ri-shopping-cart-2-line"></i>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">New Order #OC-1003 placed</p>
                          <p className="text-xxs text-slate-400 mt-0.5">By Peter Parker - $47.36</p>
                        </div>
                      </div>
                      <div className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex gap-3 text-left cursor-pointer">
                        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                          <i className="ri-alert-line"></i>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Low Stock Alert</p>
                          <p className="text-xxs text-slate-400 mt-0.5">Ergonomic Desktop Lamp is low on stock (3 remaining)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  A
                </div>
              </button>
              {isProfileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border p-1 shadow-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 z-20">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Admin Strator</p>
                      <p className="text-xxs text-slate-400">admin@opencms.com</p>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <i className="ri-user-line text-slate-400"></i> View Storefront Account
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <i className="ri-settings-line text-slate-400"></i> Settings
                      </Link>
                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <i className="ri-logout-box-line text-red-400"></i> Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Content body layout container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

    </div>
  );
}
