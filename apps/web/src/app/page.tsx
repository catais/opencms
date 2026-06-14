'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StorefrontLayout, { useStorefrontTheme } from '../components/StorefrontLayout';

export default function Home() {
  return (
    <StorefrontLayout>
      <HomeContent />
    </StorefrontLayout>
  );
}

function HomeContent() {
  const { activeThemeSlug } = useStorefrontTheme();

  // Static datasets to display on the homepage
  const featuredProducts = [
    {
      name: 'OpenCMS Premium Hoodie',
      slug: 'opencms-premium-hoodie',
      price: 65.00,
      salePrice: 48.00,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80',
      badge: 'Sale',
      category: 'Apparel',
    },
    {
      name: 'UltraTech Wireless Headphones',
      slug: 'ultratech-wireless-headphones',
      price: 199.00,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      badge: 'Best Seller',
      category: 'Electronics',
    },
    {
      name: 'Ergonomic Desktop Architect Lamp',
      slug: 'ergonomic-desktop-architect-lamp',
      price: 120.00,
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
      category: 'Electronics',
    },
  ];

  const recentPosts = [
    {
      title: 'Welcome to OpenCMS - Rebuilding WordPress in 2026',
      slug: 'welcome-opencms',
      excerpt: 'Discover why we built a WordPress + WooCommerce replica in Next.js and how it benefits developers worldwide.',
      date: 'June 13, 2026',
      readTime: '3 min read',
      image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: '10 Reasons Next.js App Router is King',
      slug: 'nextjs-app-router-king',
      excerpt: 'A technical deep-dive into Nest.js layout structures, server rendering, and hydration boundaries.',
      date: 'June 12, 2026',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // --- Retro Theme Local Interactive States ---
  const [retroMenuCategory, setRetroMenuCategory] = useState<'coffee' | 'bakery' | 'brewing'>('coffee');
  
  const retroMenu = {
    coffee: [
      { name: 'Dark Slate Espresso', price: '$3.50', desc: 'Bold, heavy, and complex with a dark chocolate and black cherry finish.' },
      { name: 'App Router Cappuccino', price: '$4.50', desc: 'Frothy steamed whole milk layered over double ristretto, dusted with cinnamon.' },
      { name: 'Prisma Caramel Latte', price: '$5.00', desc: 'Silky espresso combined with caramel fudge syrup and finished with cold froth.' },
      { name: 'Hydration Affogato', price: '$5.50', desc: 'Double espresso poured over a scoop of organic vanilla bean gelato.' },
    ],
    bakery: [
      { name: 'Next.js Sourdough Bread', price: '$6.00', desc: 'Naturally fermented for 36 hours. Extremely crispy crust, soft airy crumb.' },
      { name: 'Prisma Butter Croissant', price: '$3.75', desc: 'Flaky, golden layers of pure French butter. Baked fresh hourly.' },
      { name: 'Headless Cinnamon Swirl', price: '$4.25', desc: 'Spiced pastry roll packed with Ceylon cinnamon, glazed with warm cream frosting.' },
    ],
    brewing: [
      { name: 'V60 Slow Drip (Single Origin)', price: '$5.50', desc: 'Ethiopian heirloom beans with notes of jasmine, lavender, and sweet peach.' },
      { name: 'Japanese Cold Brew', price: '$4.75', desc: 'Slow dripped over ice for 12 hours for an ultra-smooth, low-acid experience.' },
    ]
  };

  // --- Midnight Theme Local Interactive Terminal ---
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Welcome to OpenCMS Interactive Shell [v1.0.0]',
    'Type "help" to see available terminal triggers.',
    '',
  ]);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = terminalInput.trim().toLowerCase();
    if (!command) return;

    let response: string[] = [];
    switch (command) {
      case 'help':
        response = [
          `> ${terminalInput}`,
          'Available commands:',
          '  help     - Show list of console options',
          '  catalog  - Fetch mock list of active commerce products',
          '  news     - Read latest publishing blog posts',
          '  about    - Query core developer platform specs',
          '  clear    - Clear console logs history',
        ];
        break;
      case 'catalog':
        response = [
          `> ${terminalInput}`,
          'Connecting to database standard API paginated...',
          'SUCCESS: 3 Products Retrieved.',
          '--------------------------------------------',
          '1. OpenCMS Premium Hoodie - Price: $48.00 (On Sale) [SKU: OC-HD-001]',
          '2. UltraTech Wireless Headphones - Price: $199.00 [SKU: OC-HP-BLK-STD]',
          '3. Ergonomic Desktop Architect Lamp - Price: $120.00 [SKU: OC-LM-005]',
          '--------------------------------------------',
        ];
        break;
      case 'news':
        response = [
          `> ${terminalInput}`,
          'Retrieving CMS posts...',
          '--------------------------------------------',
          '• Welcome to OpenCMS - Rebuilding WordPress in 2026',
          '  Excerpt: Rebuilding WordPress + WooCommerce replica in NextJS App Router.',
          '• 10 Reasons Next.js App Router is King',
          '  Excerpt: A technical deep-dive into layout structures and hydration bounds.',
          '--------------------------------------------',
        ];
        break;
      case 'about':
        response = [
          `> ${terminalInput}`,
          'PLATFORM DIAGNOSTICS:',
          '  Core Stack : Next.js 14, React 18, Tailwind CSS, Prisma',
          '  Database   : SQLite Dev-Mode Database',
          '  API Layer  : RESTful Decoupled Controllers',
          '  Status     : Standard Sandboxed Node Execution Sandbox',
        ];
        break;
      case 'clear':
        setTerminalHistory([]);
        setTerminalInput('');
        return;
      default:
        response = [
          `> ${terminalInput}`,
          `Command "${terminalInput}" not found. Type "help" for choices.`,
        ];
    }

    setTerminalHistory([...terminalHistory, ...response, '']);
    setTerminalInput('');
  };


  // ==========================================
  // 1. RETRO COFFEE VIBE THEME HOMEPAGE
  // ==========================================
  if (activeThemeSlug === 'retro-coffee') {
    return (
      <>
        {/* Retro Hero */}
        <section className="py-16 px-4 md:py-24 border-b-4 border-[#451A03] bg-[#FEF3C7] text-[#451A03] flex items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 border-l-4 border-b-4 border-[#451A03] opacity-5 bg-[radial-gradient(#451a03_2px,transparent_2px)] [background-size:16px_16px]"></div>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-block px-3 py-1 border-2 border-[#451A03] text-xs font-bold uppercase tracking-widest bg-[#FDE68A]">
                ☕ Rustic Coffee Roasters
              </span>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none text-[#451A03]">
                Cozy Coffee & Fresh Bakery.
              </h1>
              <p className="text-sm sm:text-base leading-relaxed text-[#451A03]/90">
                Welcome to Retro Coffee Roasters. We source heirloom beans ethically, roast them on a 1972 Probat cast-iron drum, and bake organic sourdough croissants fresh every morning. Stop by for slow pours and sweet pastries.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/shop" className="theme-btn px-6 py-3 text-center text-sm font-bold">
                  Order Pastries & Beans
                </Link>
                <a href="#menu" className="px-6 py-3 border-3 border-[#451A03] text-center font-bold text-sm hover:bg-[#FFFDF5] transition-colors">
                  View Coffee Menu
                </a>
              </div>
            </div>
            
            {/* Retro Illustration Card */}
            <div className="border-4 border-[#451A03] bg-[#FDE68A] p-6 shadow-[8px_8px_0px_0px_#451A03] space-y-4">
              <div className="aspect-[16/10] overflow-hidden border-2 border-[#451A03]">
                <img 
                  src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80" 
                  alt="Retro Cafe Counter" 
                  className="object-cover h-full w-full"
                />
              </div>
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider pt-2">
                <span>📍 123 Core Ave, Coffee Town</span>
                <span>⭐ 4.9 Stars Rating</span>
              </div>
            </div>
          </div>
        </section>

        {/* Retro Daily Blackboard Menu section */}
        <section id="menu" className="py-20 px-4 max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#451A03]">Daily Bakery & Coffee Blackboard</h2>
            <p className="text-xs text-[#451A03]/80 italic">Select a category on the chalk frame to explore our daily selections</p>
          </div>

          <div className="border-4 border-[#451A03] bg-[#1E293B] text-white p-6 md:p-10 shadow-[8px_8px_0px_0px_#451A03]">
            {/* chalk menu header tabs */}
            <div className="flex justify-center gap-3 border-b-2 border-slate-700 pb-6 mb-8 flex-wrap">
              {(['coffee', 'bakery', 'brewing'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setRetroMenuCategory(cat)}
                  className={`px-4 py-2 border-2 text-xs font-bold uppercase tracking-widest transition-all ${
                    retroMenuCategory === cat
                      ? 'bg-[#FEF3C7] text-[#451A03] border-white'
                      : 'border-slate-500 hover:border-white text-slate-300'
                  }`}
                >
                  {cat === 'coffee' ? '☕ Espresso Bar' : cat === 'bakery' ? '🥐 Fresh Bakery' : '🧪 Manual Brews'}
                </button>
              ))}
            </div>

            {/* Menu List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-serif">
              {retroMenu[retroMenuCategory].map((item, idx) => (
                <div key={idx} className="space-y-2 border-b border-dashed border-slate-700 pb-4">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-extrabold text-base md:text-lg text-[#FDE68A]">{item.name}</span>
                    <span className="font-mono text-sm font-bold text-white shrink-0">{item.price}</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed italic">{item.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center pt-8 text-xxs tracking-widest text-slate-400 uppercase font-mono">
              * tax included. Let your barista know about any allergies before checking out.
            </div>
          </div>
        </section>

        {/* Retro Featured Products Catalog */}
        <section className="py-20 px-4 bg-[#FFFDF5] border-t-4 border-b-4 border-[#451A03]">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Bean Catalog</span>
                <h2 className="text-3xl font-extrabold text-[#451A03]">Fresh Beans & Cozy Hoodies</h2>
              </div>
              <Link href="/shop" className="text-sm font-bold text-[#B45309] hover:underline flex items-center gap-1">
                Shop full roastery catalog <i className="ri-arrow-right-line"></i>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((p, idx) => (
                <div key={idx} className="theme-card overflow-hidden flex flex-col">
                  <div className="relative aspect-square border-b-3 border-[#451A03] bg-[#FEF3C7] overflow-hidden">
                    <img src={p.image} alt={p.name} className="object-cover h-full w-full" />
                    {p.badge && (
                      <span className="absolute top-3 left-3 bg-[#B45309] border-2 border-[#451A03] text-[#FEF3C7] text-3xs font-extrabold uppercase px-2 py-0.5">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <span className="text-3xs font-bold uppercase tracking-widest text-[#B45309]">{p.category}</span>
                      <h3 className="font-extrabold text-base text-[#451A03] line-clamp-1">{p.name}</h3>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 items-baseline">
                        {p.salePrice ? (
                          <>
                            <span className="text-lg font-black text-[#451A03]">${p.salePrice.toFixed(2)}</span>
                            <span className="text-xs text-[#451A03]/60 line-through">${p.price.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="text-lg font-black text-[#451A03]">${p.price.toFixed(2)}</span>
                        )}
                      </div>
                      <Link href={`/products/${p.slug}`} className="theme-btn px-3 py-1.5 text-xs font-bold">
                        Buy Beans
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Retro Blog Section */}
        <section className="py-20 px-4 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-[#451A03]">Boutique Roasters Press</h2>
            <p className="text-xs text-[#451A03]/80">Brewing notes, sourcing diaries, and cafe insights</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recentPosts.map((post, idx) => (
              <div key={idx} className="theme-card flex flex-col sm:flex-row h-full">
                <div className="w-full sm:w-2/5 aspect-[16/10] sm:aspect-auto border-r-0 sm:border-r-3 border-b-3 sm:border-b-0 border-[#451A03] overflow-hidden bg-[#FEF3C7] shrink-0">
                  <img src={post.image} alt={post.title} className="object-cover h-full w-full" />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-3xs font-bold text-[#B45309] font-mono">{post.date}</span>
                    <h3 className="font-extrabold text-base text-[#451A03] hover:underline line-clamp-2">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="text-xs text-[#451A03]/80 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                  </div>
                  <Link href={`/blog/${post.slug}`} className="text-xs font-bold text-[#B45309] hover:underline flex items-center gap-1">
                    Read brewing guide <i className="ri-arrow-right-line"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }

  // ==========================================
  // 2. DARK MIDNIGHT READER THEME HOMEPAGE
  // ==========================================
  if (activeThemeSlug === 'dark-midnight') {
    return (
      <>
        {/* Midnight Glowing Hero */}
        <section className="py-20 px-4 md:py-28 bg-[#090D16] text-white border-b border-indigo-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono text-xs">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span> SECURE SHELL INTERFACE
              </span>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-200 to-slate-200">
                A Tech-First Commerce Core.
              </h1>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
                Deploy lightning fast storefronts with OpenCMS. High-performance Next.js architectures, secure headless SQLite structures, with a fully customizable client shell built for developer excellence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/shop" className="theme-btn px-6 py-3 text-center text-sm font-semibold">
                  Query Shop Catalog
                </Link>
                <a href="#shell" className="px-6 py-3 rounded bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 text-slate-300 text-center text-sm font-semibold transition-colors">
                  Launch Interactive Shell
                </a>
              </div>
            </div>

            {/* Simulated Desktop Terminal */}
            <div id="shell" className="lg:col-span-5 border border-indigo-500/30 bg-[#0E1322] rounded-lg overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.15)] flex flex-col h-80">
              {/* terminal header */}
              <div className="bg-slate-950 px-4 py-2 border-b border-indigo-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/60"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/60"></div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">guest@opencms: ~</span>
                <span className="h-2 w-2"></span>
              </div>

              {/* Terminal screen */}
              <div className="p-4 flex-1 overflow-y-auto font-mono text-xs text-indigo-300 space-y-1 scrollbar-thin select-text">
                {terminalHistory.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>

              {/* Terminal Form Input */}
              <form onSubmit={handleTerminalSubmit} className="bg-slate-950 px-3 py-2 border-t border-indigo-500/10 flex items-center gap-2 font-mono text-xs shrink-0">
                <span className="text-indigo-400 font-bold">$</span>
                <input
                  type="text"
                  placeholder="type command (e.g. catalog, news)..."
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  className="bg-transparent text-indigo-200 border-none outline-none w-full focus:ring-0"
                />
                <button type="submit" className="text-xxs uppercase tracking-wider text-indigo-500 font-bold hover:text-indigo-400">
                  Run
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Midnight Glowing Product Cards */}
        <section className="py-20 px-4 max-w-6xl mx-auto space-y-12">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <span className="text-xs font-mono text-indigo-400">GET /API/CATALOG</span>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-indigo-300">Featured Releases</h2>
            </div>
            <Link href="/shop" className="text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1">
              [view_all_catalog]
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((p, idx) => (
              <div key={idx} className="theme-card overflow-hidden flex flex-col group">
                <div className="relative aspect-square overflow-hidden bg-slate-950 shrink-0 border-b border-indigo-500/10">
                  <img src={p.image} alt={p.name} className="object-cover h-full w-full opacity-80 group-hover:opacity-100 transition-opacity" />
                  {p.badge && (
                    <span className="absolute top-3 left-3 bg-indigo-600 text-white text-[9px] font-mono px-2 py-0.5 rounded shadow-[0_0_10px_#6366F1]">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">TAG: {p.category}</span>
                    <h3 className="font-bold text-slate-100 text-base">{p.name}</h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-baseline">
                      {p.salePrice ? (
                        <>
                          <span className="text-base font-black text-slate-100">${p.salePrice.toFixed(2)}</span>
                          <span className="text-xs text-indigo-400/50 line-through">${p.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-base font-black text-slate-100">${p.price.toFixed(2)}</span>
                      )}
                    </div>
                    <Link href={`/products/${p.slug}`} className="theme-btn px-3 py-1.5 text-xs font-semibold">
                      Inspect
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Midnight Blog Posts List */}
        <section className="py-20 px-4 bg-slate-950/40 border-t border-indigo-500/10">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="space-y-2">
              <span className="text-xs font-mono text-indigo-400">GET /API/POSTS</span>
              <h2 className="text-3xl font-black text-slate-100">Recent Terminal Bulletins</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recentPosts.map((post, idx) => (
                <div key={idx} className="theme-card flex flex-col sm:flex-row h-full">
                  <div className="w-full sm:w-2/5 aspect-[16/10] sm:aspect-auto border-r-0 sm:border-r border-b sm:border-b-0 border-indigo-500/10 overflow-hidden bg-slate-950 shrink-0">
                    <img src={post.image} alt={post.title} className="object-cover h-full w-full opacity-60" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-indigo-400">{post.date}</span>
                      <h3 className="font-bold text-base text-slate-100 hover:text-indigo-400 transition-colors">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{post.excerpt}</p>
                    </div>
                    <Link href={`/blog/${post.slug}`} className="text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1">
                      [view_bulletin]
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </>
    );
  }

  // ==========================================
  // 3. MINIMAL SAAS THEME HOMEPAGE (DEFAULT)
  // ==========================================
  return (
    <>
      {/* SaaS Hero */}
      <section className="relative overflow-hidden py-20 px-4 md:py-32 bg-slate-900 text-white border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_45%)]" />
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xxs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <i className="ri-sparkling-2-line animate-pulse"></i> Version 1.0.0 Now Live
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none text-white max-w-4xl mx-auto">
            Rebuilding the Web.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Faster, Cleaner, Headless.</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            OpenCMS is a modern, production-ready WordPress + WooCommerce replica, fully rebuilt using Next.js App Router, TypeScript, Tailwind CSS, and Prisma.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href="/shop" className="theme-btn px-6 py-3.5 text-white font-bold text-sm text-center shadow-lg shadow-blue-600/30">
              Explore Shop Catalog
            </Link>
            <Link href="/admin" className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl font-bold text-sm text-center transition-all">
              Go to Admin Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* SaaS Core Capabilities Panel */}
      <section className="py-20 px-4 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight">Built for High-Performance Stores</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Familiar WordPress layouts re-engineered with server component optimizations, fast layouts, and API-first extensions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-slate-100 dark:border-slate-800 p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-xl">
              <i className="ri-file-copy-2-line"></i>
            </div>
            <h3 className="text-base font-bold">CMS Page Builder</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Create responsive custom layouts, edit SEO tags, manage slug pointers, and schedule publish calendars seamlessly.
            </p>
          </div>

          <div className="border border-slate-100 dark:border-slate-800 p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="h-10 w-10 bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center text-xl">
              <i className="ri-shopping-bag-3-line"></i>
            </div>
            <h3 className="text-base font-bold">WooCommerce Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Support simple, variable, or digital downloads. Configure attribute grids, calculate tax percentages, and monitor stocks.
            </p>
          </div>

          <div className="border border-slate-100 dark:border-slate-800 p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-sm space-y-4 hover:shadow-md transition-shadow">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center text-xl">
              <i className="ri-code-s-slash-line"></i>
            </div>
            <h3 className="text-base font-bold">Developer-First APIs</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Retrieve posts, check orders, register webhook HMACs, and secure client-keys. Completely decoupled headless core.
            </p>
          </div>
        </div>
      </section>

      {/* SaaS Featured Shop Catalog */}
      <section className="py-20 px-4 bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Featured Commerce Catalog</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Handpicked premium products available with direct sandbox checkouts.</p>
            </div>
            <Link href="/shop" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all products <i className="ri-arrow-right-line"></i>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((p, idx) => (
              <div key={idx} className="theme-card overflow-hidden flex flex-col group">
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                  {p.badge && (
                    <span className="absolute top-3 left-3 bg-blue-600 text-white text-3xs font-extrabold uppercase px-2 py-0.5 rounded-full z-10">
                      {p.badge}
                    </span>
                  )}
                  <img src={p.image} alt={p.name} className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xxs font-bold uppercase tracking-wider text-slate-400">{p.category}</span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors mt-1">{p.name}</h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-baseline">
                      {p.salePrice ? (
                        <>
                          <span className="text-base font-extrabold text-slate-950 dark:text-white">${p.salePrice.toFixed(2)}</span>
                          <span className="text-xs text-slate-400 line-through">${p.price.toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-base font-extrabold text-slate-950 dark:text-white">${p.price.toFixed(2)}</span>
                      )}
                    </div>
                    <Link href={`/products/${p.slug}`} className="theme-btn px-4 py-2 text-xs font-semibold">
                      Buy Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SaaS Recent Blog Articles */}
      <section className="py-20 px-4 max-w-7xl mx-auto space-y-12">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Recent Blog Publications</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Stay informed with technical engineering articles, shop tutorials, and guides.</p>
          </div>
          <Link href="/blog" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Browse all posts <i className="ri-arrow-right-line"></i>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recentPosts.map((post, idx) => (
            <div key={idx} className="theme-card flex flex-col sm:flex-row h-full">
              <div className="w-full sm:w-2/5 aspect-[16/10] sm:aspect-auto overflow-hidden bg-slate-100 shrink-0">
                <img src={post.image} alt={post.title} className="object-cover h-full w-full" />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2 items-center text-xxs text-slate-400 font-bold">
                    <span>{post.date}</span>
                    <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 hover:text-blue-600 transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-xxs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{post.excerpt}</p>
                </div>
                <Link href={`/blog/${post.slug}`} className="text-xxs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  Read full article <i className="ri-arrow-right-line"></i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
