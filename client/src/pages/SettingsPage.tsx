import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Shield,
  Smartphone,
  Zap,
  Key,
  ExternalLink,
  Download,
  Copy,
  Info,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import type { GoogleCalendarStatus } from '../types';

export const SettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<GoogleCalendarStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [downloadingIcs, setDownloadingIcs] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // OAuth Credentials Configuration State
  const [hasCredentials, setHasCredentials] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [redirectUri, setRedirectUri] = useState('http://localhost:5000/api/calendar/google/callback');
  const [showConfigSection, setShowConfigSection] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);

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

    // Check query params for redirected callback states from Google OAuth
    if (searchParams.get('calendar_connected') === 'true') {
      setMessage('Your personal Google Calendar is now connected! Deadlines will synchronize directly to your Google account and phone.');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } else if (searchParams.get('calendar_error')) {
      const errType = searchParams.get('calendar_error');
      if (errType === 'missing_code') {
        setError('Authentication was interrupted: Google did not return an authorization code.');
      } else {
        setError('Failed to authenticate with Google. Please check your Google Cloud Console credentials and permissions.');
      }
    }
  }, [searchParams]);

  // Connect via authentic Google OAuth 2.0
  const handleConnect = async () => {
    try {
      setError('');
      const res = await api.get('/calendar/google/connect');
      if (res.data.url) {
        // Redirect to Google's official accounts.google.com consent screen
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Google OAuth credentials not configured.';
      setError(errMsg);
      setShowConfigSection(true);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim() || !clientSecretInput.trim()) {
      setError('Please provide both Client ID and Client Secret from your Google Cloud Console.');
      return;
    }

    setSavingConfig(true);
    setError('');
    setMessage('');

    try {
      await api.post('/calendar/google/config', {
        clientId: clientIdInput.trim(),
        clientSecret: clientSecretInput.trim(),
      });
      setHasCredentials(true);
      setMessage('Google Cloud OAuth credentials saved successfully! Click "Sign In with Google" below to link your real calendar.');
      setShowConfigSection(false);
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save credentials.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Disconnect Google Calendar? Future deadlines will not automatically sync until re-connected.')) {
      try {
        await api.delete('/calendar/google/disconnect');
        setStatus({ connected: false });
        setMessage('Google Calendar has been disconnected from your account.');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to disconnect.');
      }
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post('/calendar/google/sync-all');
      setMessage(res.data.message || 'All active reminders synchronized with your Google Calendar.');
      confetti({ particleCount: 70, spread: 70 });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Sync failed.');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleDownloadIcs = async () => {
    setDownloadingIcs(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/calendar/export/ics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to generate calendar file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lifeadmin-deadlines.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setMessage('Downloaded iCalendar (.ics) file! You can double-click it to add all deadlines to Google Calendar, Apple Calendar, or Outlook.');
    } catch (err) {
      setError('Could not export calendar feed.');
    } finally {
      setDownloadingIcs(false);
    }
  };

  const copyRedirectUri = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Platform Settings & Integrations</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure notifications, external device synchronization, and linked third-party services.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary Google Calendar Sync Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-slate-900">Google Calendar Synchronization</h3>
                {status.connected ? (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Connected ✓
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Synchronize your expiry dates and deadlines directly to your personal Google Calendar to receive alerts on Android & iOS.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {status.connected ? (
              <>
                <button
                  onClick={handleSyncAll}
                  disabled={syncingAll}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                  <span>{syncingAll ? 'Syncing...' : 'Sync Now'}</span>
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowConfigSection(!showConfigSection)}
                  className="p-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition"
                  title="Configure Google Cloud OAuth credentials"
                >
                  <Sliders className="w-4 h-4" />
                </button>

                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-105"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{hasCredentials ? 'Sign in with Google' : 'Setup Google OAuth'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {status.connected ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1">
              <span className="text-emerald-700 font-bold uppercase tracking-wider block text-[10px]">
                Real Google Account Connected
              </span>
              <span className="text-slate-900 font-extrabold text-sm font-mono flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{status.email}</span>
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                Auto Multi-Stage Mobile Alarms
              </span>
              <span className="text-slate-900 font-bold text-sm">
                30 Days • 7 Days • 1 Day Before Due Date
              </span>
            </div>
          </div>
        ) : (
          !hasCredentials && (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-bold">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Real-Time Google Calendar Synchronization Setup</span>
              </div>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                To allow LifeAdmin to write events directly into your personal Google Calendar in the background, provide your free Google Cloud OAuth Client ID & Secret below. Once saved, clicking <strong>"Sign In with Google"</strong> will open Google's official consent page to link your Gmail account!
              </p>
            </div>
          )
        )}

        {/* OAuth Credentials Form Section (Collapsible / Dynamic) */}
        {(!status.connected && (showConfigSection || !hasCredentials)) && (
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Google Cloud OAuth 2.0 Credentials
                </h4>
              </div>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>Google Cloud Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Google Client ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1234567890-abcdef.apps.googleusercontent.com"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Google Client Secret
                </label>
                <input
                  type="password"
                  placeholder="e.g. GOCSPX-xxxxxxxxxxxxxxxxxxxx"
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Authorized Redirect URI (Copy to Google Console)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={redirectUri}
                    className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 select-all"
                  />
                  <button
                    type="button"
                    onClick={copyRedirectUri}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedUri ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* 3-Step Setup Instructions */}
              <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                <span className="font-extrabold text-slate-800 block text-xs">Quick 2-Minute Google Cloud Setup:</span>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Cloud Console</a> & create or select any project.</li>
                  <li>In <strong>Enabled APIs & Services</strong>, enable <strong>Google Calendar API</strong>.</li>
                  <li>Under <strong>Credentials</strong> $\to$ <strong>Create Credentials</strong> $\to$ <strong>OAuth Client ID</strong> (Application Type: <em>Web application</em>), paste the Authorized Redirect URI above into <em>Authorized redirect URIs</em>.</li>
                  <li>Paste the generated <strong>Client ID</strong> and <strong>Client Secret</strong> into the fields above and hit "Save Credentials"!</li>
                </ol>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                {hasCredentials && (
                  <button
                    type="button"
                    onClick={() => setShowConfigSection(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-white text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center space-x-2"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{savingConfig ? 'Saving...' : 'Save & Enable Real OAuth'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Feature Explainer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h4 className="text-xs font-black text-slate-800">Phone Notifications</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Google Calendar automatically sends push notifications and sound alerts directly to your Android & iOS devices.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h4 className="text-xs font-black text-slate-800">Zero Content Leakage</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Sensitive numbers, IDs, and raw text are never sent to Google Calendar. Only document titles and due dates are synced.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
            <RefreshCw className="w-5 h-5 text-purple-600" />
            <h4 className="text-xs font-black text-slate-800">Renewal Lifecycle Sync</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When a policy or warranty is renewed, old calendar events are cleanly updated or rescheduled without duplicates.
            </p>
          </div>
        </div>
      </div>

      {/* Alternative: Instant 1-Click Real Google Calendar & iCal Export */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Download className="w-5 h-5 text-slate-700" />
              <h3 className="text-base font-black text-slate-900">Instant Real Calendar Sync (Zero Setup)</h3>
            </div>
            <p className="text-xs text-slate-500">
              Want to add deadlines to your real Google Calendar right now without configuring Google Cloud Console?
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadIcs}
              disabled={downloadingIcs}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${downloadingIcs ? 'animate-bounce' : ''}`} />
              <span>{downloadingIcs ? 'Exporting...' : 'Export Calendar (.ics)'}</span>
            </button>
            <Link
              to="/actions"
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              <span>View Action Items</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          On the <Link to="/actions" className="text-blue-600 font-bold underline">Action Items</Link> page, each deadline features a direct <strong>"Add to Google Calendar"</strong> button. Clicking it immediately opens your personal logged-in Google Calendar in your browser with the event pre-filled so you can save it with 1 tap!
        </p>
      </div>
    </div>
  );
};
