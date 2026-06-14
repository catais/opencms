type HookCallback = (value: any, ...args: any[]) => any;

class HookRegistry {
  private actions: Record<string, HookCallback[]> = {};
  private filters: Record<string, HookCallback[]> = {};

  /**
   * Register a custom action hook
   */
  addAction(tag: string, callback: HookCallback) {
    if (!this.actions[tag]) {
      this.actions[tag] = [];
    }
    this.actions[tag].push(callback);
  }

  /**
   * Trigger an action hook (for side-effects)
   */
  doAction(tag: string, ...args: any[]) {
    if (this.actions[tag]) {
      this.actions[tag].forEach(cb => {
        try {
          cb(null, ...args);
        } catch (e) {
          console.error(`Error running action hook "${tag}":`, e);
        }
      });
    }
  }

  /**
   * Register a custom filter hook
   */
  addFilter(tag: string, callback: HookCallback) {
    if (!this.filters[tag]) {
      this.filters[tag] = [];
    }
    this.filters[tag].push(callback);
  }

  /**
   * Run a piece of data through all registered filter callbacks
   */
  applyFilters(tag: string, value: any, ...args: any[]): any {
    let result = value;
    if (this.filters[tag]) {
      this.filters[tag].forEach(cb => {
        try {
          result = cb(result, ...args);
        } catch (e) {
          console.error(`Error running filter hook "${tag}":`, e);
        }
      });
    }
    return result;
  }
}

// Global hooks instance
export const hooks = new HookRegistry();

// Define pre-installed plugins that developers can toggle on/off
export interface PluginManifest {
  name: string;
  slug: string;
  description: string;
  version: string;
  author: string;
  settingsFields: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'boolean';
    defaultValue: string;
    helpText?: string;
  }[];
}

export const INSTALLED_PLUGINS: PluginManifest[] = [
  {
    name: 'SEO Optimizer Pro',
    slug: 'seo-optimizer',
    description: 'Automatically structures search-engine schemas, appends titles, indexes XML sitemaps, and audits layout content for optimal web visibility.',
    version: '1.2.0',
    author: 'OpenCMS Team',
    settingsFields: [
      {
        key: 'metaTemplate',
        label: 'Meta Title Template',
        type: 'text',
        defaultValue: '%title% | %site_name%',
        helpText: 'Use dynamic tokens: %title%, %site_name%, %tagline%'
      },
      {
        key: 'addSitemap',
        label: 'Generate XML Sitemap',
        type: 'boolean',
        defaultValue: 'true',
        helpText: 'Generate physical index at /sitemap.xml automatically'
      }
    ]
  },
  {
    name: 'Stripe Gateway Gateway',
    slug: 'stripe-gateway',
    description: 'Enables quick, secure credit card transactions at checkout. Supports Stripe checkout cards, Apple Pay, Google Pay, and sandboxed test mode.',
    version: '2.1.4',
    author: 'Stripe Integration Group',
    settingsFields: [
      {
        key: 'publishableKey',
        label: 'Stripe Publishable Key',
        type: 'text',
        defaultValue: 'pk_test_51OpC...',
        helpText: 'Stripe API key visible to your client browser'
      },
      {
        key: 'secretKey',
        label: 'Stripe Secret Key',
        type: 'password',
        defaultValue: 'sk_test_51OpC...',
        helpText: 'Keep secret keys highly protected'
      },
      {
        key: 'testMode',
        label: 'Sandbox Test Mode',
        type: 'boolean',
        defaultValue: 'true',
        helpText: 'Enable test cards (like 4242...)'
      }
    ]
  },
  {
    name: 'MailChimp Synchronizer',
    slug: 'mailchimp-sync',
    description: 'Subscribes store customers and checkout leads to list campaign newsletters on contact creation.',
    version: '1.0.2',
    author: 'OpenCMS Commerce Team',
    settingsFields: [
      {
        key: 'apiKey',
        label: 'MailChimp API Key',
        type: 'password',
        defaultValue: '',
      },
      {
        key: 'audienceId',
        label: 'Audience List ID',
        type: 'text',
        defaultValue: '',
      }
    ]
  }
];

// Initialize default filters
hooks.addFilter('filter:product_price', (price: number) => {
  // Can be extended by tax or coupon plugins
  return price;
});

hooks.addFilter('filter:seo_title', (title: string, siteName: string) => {
  return `${title} - ${siteName}`;
});
