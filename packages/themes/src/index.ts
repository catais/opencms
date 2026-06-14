export interface ThemeManifest {
  name: string;
  slug: string;
  description: string;
  version: string;
  author: string;
  screenshotUrl?: string;
  config: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    headerStyle: 'sticky' | 'static' | 'minimal';
    footerColumns: number;
    showSidebarOnBlog: boolean;
  };
}

export const INSTALLED_THEMES: ThemeManifest[] = [
  {
    name: 'Minimal SaaS Storefront (Default)',
    slug: 'minimal-saas',
    description: 'A modern, premium SaaS-oriented theme featuring thin elegant borders, soft gray grids, rich Inter typography, and absolute responsiveness.',
    version: '1.0.0',
    author: 'OpenCMS Design Team',
    config: {
      primaryColor: '#2563EB', // Blue 600
      secondaryColor: '#0F172A', // Slate 900
      backgroundColor: '#F8FAFC', // Slate 50
      textColor: '#1E293B', // Slate 800
      fontFamily: 'Inter, sans-serif',
      headerStyle: 'sticky',
      footerColumns: 4,
      showSidebarOnBlog: true,
    },
  },
  {
    name: 'Retro Coffee Vibe',
    slug: 'retro-coffee',
    description: 'Warm earth tones, thick shadows, rounded buttons, and heavy borders. Perfect for boutique coffee roasters, vintage clothing, and cozy bakeries.',
    version: '1.1.2',
    author: 'Rustic Integration Co.',
    config: {
      primaryColor: '#B45309', // Amber 700
      secondaryColor: '#78350F', // Amber 900
      backgroundColor: '#FEF3C7', // Amber 100 (warm yellow background)
      textColor: '#451A03', // Amber 950
      fontFamily: 'Georgia, serif',
      headerStyle: 'static',
      footerColumns: 3,
      showSidebarOnBlog: false,
    },
  },
  {
    name: 'Dark Midnight Reader',
    slug: 'dark-midnight',
    description: 'An elegant dark-mode first design, featuring neon indigo highlight states, deep obsidian grids, and large sans-serif headings. Specially optimized for developers, tech journalists, and SaaS software publishers.',
    version: '2.0.0',
    author: 'OpenCMS Theme Engineers',
    config: {
      primaryColor: '#6366F1', // Indigo 500
      secondaryColor: '#F8FAFC', // Slate 50
      backgroundColor: '#090D16', // Deep Dark Blue-Black
      textColor: '#E2E8F0', // Slate 200
      fontFamily: 'system-ui, sans-serif',
      headerStyle: 'minimal',
      footerColumns: 2,
      showSidebarOnBlog: true,
    },
  },
];
