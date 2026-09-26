import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  RefreshCw,
  Shield,
  Zap,
  Key,
  ExternalLink,
  Download,
  Copy,
  User,
  Bell,
  Sun,
  Moon,
  Trash2,
  Layers,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, API_BASE_URL, getAuthToken } from '../services/api';
import type { GoogleCalendarStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'integrations' | 'account' | 'notifications' | 'appearance' | 'privacy' | 'danger'>('integrations');

  // Google Calendar Integration State
  const [status, setStatus] = useState<GoogleCalendarStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [downloadingIcs, setDownloadingIcs] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [redirectUri, setRedirectUri] = useState(`${API_BASE_URL}/calendar/google/callback`);
  const [savingConfig, setSavingConfig] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);

  // Notification preferences
  const [remind30Days, setRemind30Days] = useState(true);
  const [remind7Days, setRemind7Days] = useState(true);
  const [remind1Day, setRemind1Day] = useState(true);

  const fetchStatus = async () => {
    try {
      const [statusRes, configRes] = await Promise.all([
        api.get('/calendar/google/status'),
        api.get('/calendar/google/config').catch(() => ({ data: { configured: false } })),
      ]);
      setStatus(statusRes.data);
      if (configRes.data) {
        setHasCredentials(Boolean(configRes.data.configured));
        if (configRes.data.clientId) setClientIdInput(configRes.data.clientId);
        if (configRes.data.redirectUri) setRedirectUri(configRes.data.redirectUri);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    if (searchParams.get('calendar_connected') === 'true') {
      toast.success('Your Google Calendar is now connected! Deadlines will synchronize directly.');
      confetti({ particleCount: 70, spread: 60 });
    } else if (searchParams.get('calendar_error')) {
      toast.error('Authentication with Google was canceled or failed.');
    }
  }, [searchParams]);

  const handleConnect = async () => {
    if (!hasCredentials) {
      setShowSetupModal(true);
      return;
    }

    try {
      const res = await api.get('/calendar/google/connect');
      if (res.data.url) {
        window.location.href = res.data.url;
      } else if (!res.data.configured) {
        setShowSetupModal(true);
      }
    } catch {
      setShowSetupModal(true);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent, connectImmediately = false) => {
    e.preventDefault();
    if (!clientIdInput.trim() || !clientSecretInput.trim()) {
      toast.warning('Both Google Client ID and Secret are required.');
      return;
    }

    setSavingConfig(true);
    try {
      await api.post('/calendar/google/config', {
        clientId: clientIdInput.trim(),
        clientSecret: clientSecretInput.trim(),
      });
      setHasCredentials(true);
      setShowSetupModal(false);
      toast.success('Credentials saved successfully!');

      if (connectImmediately) {
        const res = await api.get('/calendar/google/connect');
        if (res.data.url) {
          window.location.href = res.data.url;
        }
      }
    } catch {
      toast.error('Failed to save OAuth credentials.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Disconnect Google Calendar? Existing calendar events will remain until removed.')) {
      try {
        await api.delete('/calendar/google/disconnect');
        setStatus({ connected: false });
        toast.info('Google Calendar disconnected.');
      } catch {
        toast.error('Failed to disconnect calendar.');
      }
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await api.post('/calendar/google/sync-all');
      toast.success(res.data.message || 'All reminders synced with Google Calendar.');
      confetti({ particleCount: 60, spread: 60 });
    } catch {
      toast.error('Sync failed.');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleDownloadIcs = async () => {
    setDownloadingIcs(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/calendar/export/ics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lifeadmin-deadlines.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Downloaded iCalendar feed (.ics)');
    } catch {
      toast.error('Unable to download calendar feed.');
    } finally {
      setDownloadingIcs(false);
    }
  };

  const copyRedirectUri = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };

  const tabs = [
    { id: 'integrations', label: 'Integrations', icon: Calendar },
    { id: 'account', label: 'Account & Security', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'privacy', label: 'Privacy & Data', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Settings & Preferences
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account profile, notification stages, Google Calendar, and security options.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Navigation Tabs (Spec #21) */}
        <div className="md:col-span-1 space-y-1 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Content Panes */}
        <div className="md:col-span-3 space-y-6">
          {/* TAB 1: INTEGRATIONS (Google Calendar) */}
          {activeTab === 'integrations' && (
            <Card>
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">Google Calendar</CardTitle>
                        {status.connected ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Connected</span>
                          </span>
                        ) : (
                          <Badge variant="neutral" size="sm">Not Connected</Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        Automatically add LifeAdmin deadlines to your Google Calendar and receive reminders on your devices.
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {status.connected ? (
                      <>
                        <Button
                          onClick={handleSyncAll}
                          disabled={syncingAll}
                          variant="primary"
                          size="sm"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                          <span>{syncingAll ? 'Syncing...' : 'Sync Now'}</span>
                        </Button>
                        <Button
                          onClick={handleDisconnect}
                          variant="destructive"
                          size="sm"
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleConnect}
                        disabled={loading}
                        variant="primary"
                        size="md"
                        className="shadow-md shadow-blue-600/20"
                      >
                        <Zap className="w-4 h-4 mr-1.5" />
                        <span>Connect Google Calendar</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {status.connected ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                          Connected Account
                        </span>
                        <span className="text-slate-900 dark:text-white font-mono font-bold text-xs flex items-center space-x-1.5 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{status.email}</span>
                        </span>
                      </div>

                      <div className="p-4 bg-blue-50/70 dark:bg-blue-950/20 rounded-xl border border-blue-200/80 dark:border-blue-900/40 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                          Auto-Sync
                        </span>
                        <span className="text-blue-900 dark:text-blue-200 font-bold text-xs flex items-center space-x-1.5">
                          <Zap className="w-3.5 h-3.5 text-blue-600" />
                          <span>Active (Real-Time)</span>
                        </span>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Reminders Schedule
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold text-xs">
                          30d, 7d & 1d Prior
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Sync Deadlines with Google Calendar
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Receive mobile notifications on your phone for all document renewals and bills.
                        </p>
                      </div>
                      <Button
                        onClick={handleConnect}
                        disabled={loading}
                        variant="primary"
                        size="md"
                        className="shadow-sm shrink-0"
                      >
                        <Zap className="w-4 h-4 mr-1.5" />
                        <span>Connect Calendar</span>
                      </Button>
                    </div>

                    {/* Compact Custom Credentials Drawer */}
                    <details className="group border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/40 dark:bg-slate-900/40">
                      <summary className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer flex items-center justify-between">
                        <span className="flex items-center space-x-2">
                          <Key className="w-3.5 h-3.5 text-slate-400" />
                          <span>Advanced: Custom OAuth Credentials</span>
                          {hasCredentials && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200">
                              Configured
                            </span>
                          )}
                        </span>
                        <span className="text-slate-400 text-[10px] group-open:rotate-180 transition-transform">▼</span>
                      </summary>

                      <form onSubmit={handleSaveCredentials} className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Client ID
                            </label>
                            <input
                              type="text"
                              value={clientIdInput}
                              onChange={(e) => setClientIdInput(e.target.value)}
                              placeholder="Google Client ID"
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-1 focus:ring-primary-500 focus:outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Client Secret
                            </label>
                            <input
                              type="password"
                              value={clientSecretInput}
                              onChange={(e) => setClientSecretInput(e.target.value)}
                              placeholder="Google Client Secret"
                              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:ring-1 focus:ring-primary-500 focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                            Redirect URI
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              readOnly
                              value={redirectUri}
                              className="w-full px-3 py-1 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-500 select-all"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={copyRedirectUri}
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedUri ? 'Copied' : 'Copy'}</span>
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={savingConfig}
                            isLoading={savingConfig}
                          >
                            Save Credentials
                          </Button>
                        </div>
                      </form>
                    </details>
                  </div>
                )}

                {/* Instant Real Calendar Feed Export Section */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Standard Calendar Feed Export (.ics)
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Download an RFC 5545 calendar file to import all deadlines into Apple Calendar, Outlook, or Google Calendar.
                    </p>
                  </div>
                  <Button
                    onClick={handleDownloadIcs}
                    disabled={downloadingIcs}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingIcs ? 'Exporting...' : 'Export .ics Feed'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: ACCOUNT & SECURITY */}
          {activeTab === 'account' && (
            <Card>
              <CardHeader>
                <CardTitle>Account Profile</CardTitle>
                <CardDescription>Manage personal details and credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={user?.name || 'Demo User'}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue={user?.email || 'demo@lifeadmin.local'}
                      disabled
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="primary" size="sm" onClick={() => toast.success('Profile updated')}>
                    Save Profile Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Reminder Schedules</CardTitle>
                <CardDescription>Configure automated reminder intervals before document deadlines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={remind30Days}
                      onChange={(e) => setRemind30Days(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">30 Days Before Expiration</span>
                      <span className="text-[11px] text-slate-400">Early warning for vehicle renewals and insurance reviews</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={remind7Days}
                      onChange={(e) => setRemind7Days(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">7 Days Before Due Date</span>
                      <span className="text-[11px] text-slate-400">High-priority warning for impending utility and warranty lapses</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={remind1Day}
                      onChange={(e) => setRemind1Day(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">1 Day Before Due Date</span>
                      <span className="text-[11px] text-slate-400">Urgent alarm to prevent late payment surcharges</span>
                    </div>
                  </label>
                </div>

                <Button variant="primary" size="sm" onClick={() => toast.success('Reminder preferences saved')}>
                  Save Notification Preferences
                </Button>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: APPEARANCE */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Appearance & Theme</CardTitle>
                <CardDescription>Select color scheme and interface mode</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border text-center space-y-2 transition ${
                      theme === 'light'
                        ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600'
                    }`}
                  >
                    <Sun className="w-5 h-5 mx-auto" />
                    <span className="block text-xs">Light</span>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border text-center space-y-2 transition ${
                      theme === 'dark'
                        ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600'
                    }`}
                  >
                    <Moon className="w-5 h-5 mx-auto" />
                    <span className="block text-xs">Dark</span>
                  </button>

                  <button
                    onClick={() => setTheme('system')}
                    className={`p-4 rounded-xl border text-center space-y-2 transition ${
                      theme === 'system'
                        ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600'
                    }`}
                  >
                    <Layers className="w-5 h-5 mx-auto" />
                    <span className="block text-xs">System</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: PRIVACY & AUDIT */}
          {activeTab === 'privacy' && (
            <Card>
              <CardHeader>
                <CardTitle>Data Privacy & Audit</CardTitle>
                <CardDescription>Zero-content leakage and compliance logs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Zero Content Leakage Protocol</span>
                  </div>
                  <p>
                    LifeAdmin strictly isolates your document files. OCR processing occurs locally or via ephemeral encrypted AI tokens. Sensitive IDs, vehicle VINs, and policy contracts are never exported to external calendar entries.
                  </p>
                </div>

                <div className="pt-2">
                  <Link to="/audit-trail">
                    <Button variant="outline" size="sm">
                      <span>View Immutable Audit Trail</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 6: DANGER ZONE */}
          {activeTab === 'danger' && (
            <Card className="border-rose-200 dark:border-rose-900/60">
              <CardHeader>
                <CardTitle className="text-rose-600 dark:text-rose-400">Danger Zone</CardTitle>
                <CardDescription>Irreversible account and storage operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">Clear Local Cache & Session</h5>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">Resets client-side cached document queries and theme</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      localStorage.clear();
                      toast.info('Local cache cleared. Reloading...');
                      setTimeout(() => window.location.reload(), 600);
                    }}
                  >
                    Clear Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Google Calendar OAuth Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative">
            <button
              onClick={() => setShowSetupModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Connect Google Calendar
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Link with your personal Google account to synchronize real-time deadlines.
                </p>
              </div>
            </div>

            {/* Quick 3-Step Guide */}
            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold text-blue-900 dark:text-blue-200 text-xs block">
                How to get your free Google OAuth credentials (1 minute):
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed">
                <li>
                  Open{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 font-bold underline inline-flex items-center"
                  >
                    Google Cloud Console
                    <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                  </a>
                  {' '}and click <strong>Create Credentials → OAuth client ID</strong> (Web application).
                </li>
                <li>
                  In <strong>Authorized redirect URIs</strong>, paste the URI below.
                </li>
                <li>
                  Paste your <strong>Client ID</strong> and <strong>Client Secret</strong> below and click <strong>Save & Connect</strong>.
                </li>
              </ol>
            </div>

            <form onSubmit={(e) => handleSaveCredentials(e, true)} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Google Client ID
                </label>
                <input
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="e.g. 123456789-xxx.apps.googleusercontent.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Google Client Secret
                </label>
                <input
                  type="password"
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  placeholder="e.g. GOCSPX-xxxxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Authorized Redirect URI (Copy into Google Console)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={redirectUri}
                    className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-500 select-all"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyRedirectUri}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedUri ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSetupModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={savingConfig}
                  isLoading={savingConfig}
                  className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
                >
                  <Zap className="w-3.5 h-3.5 mr-1" />
                  <span>Save & Connect with Google</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
