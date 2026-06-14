'use client';

import React, { useState, useEffect } from 'react';

interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  scopesJson: string;
  rateLimit: number;
  expiresAt: string | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  webhook: {
    name: string;
    url: string;
  };
  event: string;
  statusCode: number | null;
  requestHeaderJson: string;
  requestBodyJson: string;
  responseHeaderJson: string;
  responseBodyJson: string;
  duration: number | null;
  isSuccess: boolean;
  createdAt: string;
}

export default function DevelopersAdmin() {
  // Lists
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);

  // Loading / UI states
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'keys' | 'webhooks' | 'logs' | 'docs'>('keys');
  const [codeLang, setCodeLang] = useState<'curl' | 'js' | 'python' | 'php'>('curl');

  // Modal / Drawer status
  const [isKeyDrawerOpen, setIsKeyDrawerOpen] = useState(false);
  const [isWebhookDrawerOpen, setIsWebhookDrawerOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);

  // New forms data
  const [newKey, setNewKey] = useState({
    name: '',
    scopes: ['*'],
    rateLimit: '60',
  });
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: ['order.created'],
  });

  // Response holding (specifically for showing raw plain key exactly once)
  const [plainKeyReturned, setPlainKeyReturned] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Retrying deliveries
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
    fetchWebhooks();
    fetchDeliveries();
  }, []);

  const fetchKeys = async () => {
    try {
      setLoadingKeys(true);
      const res = await fetch('/api/admin/developers/keys');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setKeys(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKeys(false);
    }
  };

  const fetchWebhooks = async () => {
    try {
      setLoadingWebhooks(true);
      const res = await fetch('/api/admin/developers/webhooks');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setWebhooks(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setLoadingDeliveries(true);
      const res = await fetch('/api/admin/developers/webhooks/deliveries');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setDeliveries(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    setPlainKeyReturned(null);
    try {
      const res = await fetch('/api/admin/developers/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKey.name,
          scopes: newKey.scopes,
          rateLimit: newKey.rateLimit,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPlainKeyReturned(json.data.plainTextKey);
        setNewKey({ name: '', scopes: ['*'], rateLimit: '60' });
        fetchKeys();
      } else {
        setKeyError(json.message);
      }
    } catch (err: any) {
      setKeyError(err.message || 'An error occurred generating the API key');
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to revoke this API key? Systems integrated with this token will fail.')) return;
    try {
      const res = await fetch(`/api/admin/developers/keys/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showSuccess('API key successfully revoked');
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setWebhookError(null);
    try {
      const res = await fetch('/api/admin/developers/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook),
      });
      const json = await res.json();
      if (json.success) {
        showSuccess('Webhook endpoint registered successfully!');
        setNewWebhook({ name: '', url: '', events: ['order.created'] });
        setIsWebhookDrawerOpen(false);
        fetchWebhooks();
      } else {
        setWebhookError(json.message);
      }
    } catch (err: any) {
      setWebhookError(err.message || 'An error occurred creating the webhook target');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Webhook target? This action is permanent.')) return;
    try {
      const res = await fetch(`/api/admin/developers/webhooks/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showSuccess('Webhook receiver deleted');
        fetchWebhooks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetryDelivery = async (deliveryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setRetryingId(deliveryId);
      const res = await fetch('/api/admin/developers/webhooks/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId }),
      });
      const json = await res.json();
      if (json.success) {
        showSuccess('Webhook redelivered. Delivery status updated!');
        fetchDeliveries();
      } else {
        alert(json.message || 'Delivery retry failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRetryingId(null);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const toggleKeyScope = (scope: string) => {
    setNewKey(prev => {
      let updated = [...prev.scopes];
      if (scope === '*') {
        updated = ['*'];
      } else {
        updated = updated.filter(s => s !== '*');
        if (updated.includes(scope)) {
          updated = updated.filter(s => s !== scope);
        } else {
          updated.push(scope);
        }
        if (updated.length === 0) updated = ['*'];
      }
      return { ...prev, scopes: updated };
    });
  };

  const toggleWebhookEvent = (event: string) => {
    setNewWebhook(prev => {
      let updated = [...prev.events];
      if (event === '*') {
        updated = ['*'];
      } else {
        updated = updated.filter(e => e !== '*');
        if (updated.includes(event)) {
          updated = updated.filter(e => e !== event);
        } else {
          updated.push(event);
        }
        if (updated.length === 0) updated = ['order.created'];
      }
      return { ...prev, events: updated };
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const codeSnippets = {
    curl: `curl -X GET "http://localhost:3000/api/v1/products" \\\n  -H "Authorization: Bearer ${plainKeyReturned || 'oc_live_your_actual_key_here'}"`,
    js: `const res = await fetch('http://localhost:3000/api/v1/products', {\n  headers: {\n    'Authorization': 'Bearer ${plainKeyReturned || 'oc_live_your_actual_key_here'}'\n  }\n});\nconst data = await res.json();\nconsole.log(data);`,
    python: `import requests\n\nheaders = {\n    "Authorization": "Bearer ${plainKeyReturned || 'oc_live_your_actual_key_here'}"\n}\nresponse = requests.get("http://localhost:3000/api/v1/products", headers=headers)\nprint(response.json())`,
    php: `<?php\n$ch = curl_init();\ncurl_setopt($ch, CURLOPT_URL, "http://localhost:3000/api/v1/products");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    "Authorization: Bearer ${plainKeyReturned || 'oc_live_your_actual_key_here'}"\n]);\n$response = curl_exec($ch);\ncurl_close($ch);\n$data = json_decode($response, true);\nprint_r($data);`,
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <i className="ri-code-s-slash-line text-blue-600"></i>
            Developers Panel
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate secure tokens, configure outgoing webhook listeners, review HMAC signatures, and explore headless integrations.
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'keys' && (
            <button
              onClick={() => {
                setPlainKeyReturned(null);
                setKeyError(null);
                setIsKeyDrawerOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <i className="ri-key-2-line"></i> Generate API Key
            </button>
          )}
          {activeSubTab === 'webhooks' && (
            <button
              onClick={() => {
                setWebhookError(null);
                setIsWebhookDrawerOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <i className="ri-add-circle-line"></i> Register Webhook
            </button>
          )}
        </div>
      </div>

      {/* 2. Success Toast */}
      {successMsg && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs rounded-xl flex items-center gap-2 animate-fadeIn shadow-sm">
          <i className="ri-checkbox-circle-line text-base"></i>
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* 3. Sub Tabs Menu */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4">
        <button
          onClick={() => setActiveSubTab('keys')}
          className={`pb-3 text-xs font-bold tracking-tight border-b-2 transition-all ${
            activeSubTab === 'keys'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          API Access Tokens
        </button>
        <button
          onClick={() => setActiveSubTab('webhooks')}
          className={`pb-3 text-xs font-bold tracking-tight border-b-2 transition-all ${
            activeSubTab === 'webhooks'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Webhook Destinations
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-3 text-xs font-bold tracking-tight border-b-2 transition-all ${
            activeSubTab === 'logs'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Delivery Audit Logs
        </button>
        <button
          onClick={() => setActiveSubTab('docs')}
          className={`pb-3 text-xs font-bold tracking-tight border-b-2 transition-all ${
            activeSubTab === 'docs'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Quick SDK Snippets
        </button>
      </div>

      {/* 4. Tab Contents */}

      {/* Tab: Keys */}
      {activeSubTab === 'keys' && (
        <div className="space-y-6">
          {/* Key Generator Plain text Banner if generated */}
          {plainKeyReturned && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-400 rounded-xl space-y-3 shadow-md animate-fadeIn">
              <div className="flex gap-2 items-center">
                <i className="ri-error-warning-line text-lg text-amber-600"></i>
                <span className="font-extrabold text-xs uppercase tracking-wider">Save this API Key immediately!</span>
              </div>
              <p className="text-xxs">
                For security reasons, this token will **never** be presented to you again. Copy it and place it safely in your server environment configurations.
              </p>
              <div className="flex items-center gap-2 bg-slate-950 text-slate-100 p-2.5 rounded-lg font-mono text-xs select-all justify-between">
                <span>{plainKeyReturned}</span>
                <button
                  onClick={() => copyToClipboard(plainKeyReturned)}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                >
                  <i className="ri-file-copy-line"></i>
                </button>
              </div>
            </div>
          )}

          {/* List existing keys */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm">
            {loadingKeys ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading authorized API keys...</div>
            ) : keys.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
                  <i className="ri-key-2-line"></i>
                </div>
                <p className="text-xs font-semibold text-slate-400">No developer API keys registered yet.</p>
                <button
                  onClick={() => setIsKeyDrawerOpen(true)}
                  className="text-xxs text-blue-500 hover:text-blue-600 font-bold hover:underline"
                >
                  Create your first key
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xxs uppercase tracking-wider text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-950/20">
                      <th className="p-4">Key Name</th>
                      <th className="p-4">Scopes</th>
                      <th className="p-4">Expires</th>
                      <th className="p-4">Rate Limit</th>
                      <th className="p-4">Created</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {keys.map(key => (
                      <tr key={key.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-200">
                          {key.name}
                          <div className="font-mono font-normal text-xxs text-slate-400 mt-0.5">
                            Hash: {key.keyHash.slice(0, 8)}...{key.keyHash.slice(-8)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {JSON.parse(key.scopesJson || '[]').map((s: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px] text-slate-500 dark:text-slate-400"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-slate-400 text-xxs">
                          {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="p-4 text-slate-500">
                          <span className="font-bold">{key.rateLimit}</span> req/m
                        </td>
                        <td className="p-4 text-slate-400 text-xxs">
                          {new Date(key.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleRevokeKey(key.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-xs"
                            title="Revoke / Delete Key"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Webhooks */}
      {activeSubTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm">
            {loadingWebhooks ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading registered webhooks...</div>
            ) : webhooks.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
                  <i className="ri-plug-line"></i>
                </div>
                <p className="text-xs font-semibold text-slate-400">No outgoing webhooks registered.</p>
                <button
                  onClick={() => setIsWebhookDrawerOpen(true)}
                  className="text-xxs text-blue-500 hover:text-blue-600 font-bold hover:underline"
                >
                  Register a target endpoint
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xxs uppercase tracking-wider text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-950/20">
                      <th className="p-4">Receiver Name</th>
                      <th className="p-4">Target URL</th>
                      <th className="p-4">HMAC Secret</th>
                      <th className="p-4">Registered Events</th>
                      <th className="p-4">Created</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {webhooks.map(wh => (
                      <tr key={wh.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{wh.name}</td>
                        <td className="p-4 font-mono text-xxs text-slate-500 dark:text-slate-400 break-all max-w-[240px]">
                          {wh.url}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xxs bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 px-2 py-1 rounded select-all text-slate-600 dark:text-slate-400">
                              {wh.secret}
                            </span>
                            <button
                              onClick={() => copyToClipboard(wh.secret)}
                              className="text-slate-400 hover:text-slate-600 p-1 rounded"
                              title="Copy Secret"
                            >
                              <i className="ri-file-copy-line"></i>
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {wh.events.map((e, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-full font-mono text-[10px]"
                              >
                                {e}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-slate-400 text-xxs">
                          {new Date(wh.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteWebhook(wh.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-xs"
                            title="Delete Webhook"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Logs */}
      {activeSubTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm">
            {loadingDeliveries ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading delivery history...</div>
            ) : deliveries.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
                  <i className="ri-history-line"></i>
                </div>
                <p className="text-xs font-semibold text-slate-400">No webhook delivery logs recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xxs uppercase tracking-wider text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-950/20">
                      <th className="p-4">Status</th>
                      <th className="p-4">Receiver</th>
                      <th className="p-4">Trigger Event</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Executed At</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {deliveries.map(log => {
                      const success = log.isSuccess;
                      return (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedDelivery(log)}
                          className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
                        >
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                                success
                                  ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${success ? 'bg-green-500' : 'bg-red-500'}`} />
                              {log.statusCode || 'FAIL'}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-700 dark:text-slate-200">
                            {log.webhook?.name || 'Deleted Endpoint'}
                            <div className="font-mono text-3xs font-normal text-slate-400 break-all max-w-[200px]">
                              {log.webhook?.url}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px] text-slate-600 dark:text-slate-400">
                              {log.event}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-xxs text-slate-500">
                            {log.duration ? `${log.duration}ms` : '—'}
                          </td>
                          <td className="p-4 text-slate-400 text-xxs">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={(e) => handleRetryDelivery(log.id, e)}
                              disabled={retryingId === log.id}
                              className="px-2.5 py-1 text-xxs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded border border-blue-200 dark:border-blue-900/60 flex items-center gap-1.5 ml-auto transition-colors disabled:opacity-40"
                            >
                              <i className={retryingId === log.id ? "ri-loader-4-line animate-spin" : "ri-restart-line"}></i>
                              Retry
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Docs SDKs */}
      {activeSubTab === 'docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Documentation Info Panel */}
          <div className="lg:col-span-1 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <i className="ri-book-open-line text-blue-500"></i> API Endpoint Details
            </h2>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                OpenCMS provides a premium API design layer enabling you to retrieve WooCommerce catalog structures, write blog feeds, or read order state logs.
              </p>
              <div>
                <div className="font-bold text-slate-700 dark:text-slate-200">Authorization:</div>
                <div className="font-mono text-xxs bg-slate-100 dark:bg-slate-950 p-1.5 rounded mt-1 border dark:border-slate-800 text-slate-500">
                  Authorization: Bearer oc_live_...
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-bold">Available Endpoints:</span>
                <ul className="list-disc pl-4 space-y-1.5 font-mono text-[11px]">
                  <li><span className="text-green-600">GET</span> /api/v1/products</li>
                  <li><span className="text-green-600">GET</span> /api/v1/posts</li>
                  <li><span className="text-green-600">GET</span> /api/v1/orders</li>
                  <li><span className="text-blue-600">POST</span> /api/v1/orders</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Code Switcher Panel */}
          <div className="lg:col-span-2 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden flex flex-col bg-slate-950 text-slate-200 shadow-lg">
            <div className="h-12 bg-slate-900 border-b border-slate-800/60 px-4 flex items-center justify-between text-xs font-bold text-slate-400">
              <div className="flex gap-3">
                {(['curl', 'js', 'python', 'php'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setCodeLang(lang)}
                    className={`hover:text-white transition-colors capitalize ${
                      codeLang === lang ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : ''
                    }`}
                  >
                    {lang === 'js' ? 'JavaScript' : lang === 'php' ? 'PHP' : lang}
                  </button>
                ))}
              </div>
              <button
                onClick={() => copyToClipboard(codeSnippets[codeLang])}
                className="p-1 hover:bg-slate-800 rounded flex items-center gap-1 text-xxs text-slate-300 hover:text-white"
              >
                <i className="ri-file-copy-line"></i> Copy Snippet
              </button>
            </div>
            <pre className="p-4 font-mono text-xxs leading-normal overflow-auto select-all max-h-80 whitespace-pre">
              {codeSnippets[codeLang]}
            </pre>
          </div>
        </div>
      )}

      {/* API KEY DRAWER FORM */}
      {isKeyDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsKeyDrawerOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl p-6 border-l dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <i className="ri-key-2-line text-blue-600"></i> Generate Access Token
                </h3>
                <button
                  onClick={() => setIsKeyDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100"
                >
                  <i className="ri-close-line text-slate-500"></i>
                </button>
              </div>

              {keyError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xxs rounded-lg">
                  {keyError}
                </div>
              )}

              <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Token Description Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mobile App API Integration"
                    value={newKey.name}
                    onChange={(e) => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Scope Permissions</label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-800">
                    {[
                      { value: '*', label: 'Full Access (*)' },
                      { value: 'read_products', label: 'Read Products' },
                      { value: 'write_products', label: 'Write Products' },
                      { value: 'read_orders', label: 'Read Orders' },
                      { value: 'write_orders', label: 'Write Orders' },
                    ].map(scope => (
                      <label key={scope.value} className="flex items-center gap-2 cursor-pointer py-1">
                        <input
                          type="checkbox"
                          checked={newKey.scopes.includes(scope.value)}
                          onChange={() => toggleKeyScope(scope.value)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xxs font-medium text-slate-600 dark:text-slate-400">{scope.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Rate Limit (requests/min)</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={newKey.rateLimit}
                    onChange={(e) => setNewKey(prev => ({ ...prev, rateLimit: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20"
                >
                  Generate Token
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* WEBHOOK REGISTER DRAWER */}
      {isWebhookDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsWebhookDrawerOpen(false)} />
          <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl p-6 border-l dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <i className="ri-plug-line text-blue-600"></i> Register Webhook Endpoint
                </h3>
                <button
                  onClick={() => setIsWebhookDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100"
                >
                  <i className="ri-close-line text-slate-500"></i>
                </button>
              </div>

              {webhookError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xxs rounded-lg">
                  {webhookError}
                </div>
              )}

              <form onSubmit={handleCreateWebhook} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Endpoint Friendly Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Order Sync Receiver"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Destination URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://yourdomain.com/webhook/endpoint"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Hook Triggers</label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-800">
                    {[
                      { value: '*', label: 'All Triggers (*)' },
                      { value: 'order.created', label: 'Order Placed' },
                      { value: 'order.updated', label: 'Order Status Update' },
                      { value: 'product.created', label: 'Product Created' },
                      { value: 'post.published', label: 'Article Published' },
                    ].map(ev => (
                      <label key={ev.value} className="flex items-center gap-2 cursor-pointer py-1">
                        <input
                          type="checkbox"
                          checked={newWebhook.events.includes(ev.value)}
                          onChange={() => toggleWebhookEvent(ev.value)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xxs font-medium text-slate-600 dark:text-slate-400">{ev.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20"
                >
                  Register Destination
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* WEBHOOK DELIVERY DETAIL OVERLAY */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="h-14 border-b dark:border-slate-800 px-6 flex items-center justify-between">
              <span className="text-sm font-black text-slate-800 dark:text-white">
                Delivery Attempt Detail
              </span>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-normal">
              {/* Event Metadata Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800">
                  <div className="text-xxs text-slate-400">Trigger Event</div>
                  <div className="font-bold font-mono text-slate-700 dark:text-slate-200 mt-1">{selectedDelivery.event}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800">
                  <div className="text-xxs text-slate-400">Duration</div>
                  <div className="font-bold font-mono text-slate-700 dark:text-slate-200 mt-1">
                    {selectedDelivery.duration ? `${selectedDelivery.duration} ms` : '—'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800">
                  <div className="text-xxs text-slate-400">Response Code</div>
                  <div className="font-bold font-mono text-slate-700 dark:text-slate-200 mt-1">
                    {selectedDelivery.statusCode || 'No response'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border dark:border-slate-800">
                  <div className="text-xxs text-slate-400">Recipient Endpoint</div>
                  <div className="font-bold text-slate-700 dark:text-slate-200 mt-1 truncate" title={selectedDelivery.webhook?.name}>
                    {selectedDelivery.webhook?.name || 'Deleted Endpoint'}
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Outgoing Signed Payload Body</h4>
                <pre className="p-3 bg-slate-950 text-slate-100 font-mono text-xxs rounded-xl overflow-auto select-all max-h-48 whitespace-pre-wrap">
                  {selectedDelivery.requestBodyJson}
                </pre>
              </div>

              {/* Response Details */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300">Destination Response Body</h4>
                <pre className="p-3 bg-slate-950 text-slate-100 font-mono text-xxs rounded-xl overflow-auto select-all max-h-48 whitespace-pre-wrap">
                  {selectedDelivery.responseBodyJson || 'Empty response content / Destination timeout'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
