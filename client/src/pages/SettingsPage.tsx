import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Shield,
  Smartphone,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import type { GoogleCalendarStatus } from '../types';

export const SettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<GoogleCalendarStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await api.get('/calendar/google/status');
      setStatus(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check query params for redirected callback states
    if (searchParams.get('calendar_connected') === 'true') {
      setMessage('Google Calendar successfully connected! Deadlines can now sync to your phone.');
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } else if (searchParams.get('calendar_error')) {
      setError('Failed to authenticate Google Calendar. Please check client permissions.');
    } else if (searchParams.get('demo_google_connect') === 'true') {
      // Connect demo mock mode
      api.get('/calendar/google/callback?code=mock_demo_code').then(() => {
        setMessage('Connected Google Calendar in Demo Mode (Ready for cross-device notification sync)!');
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        fetchStatus();
      });
    }
  }, [searchParams]);

  const handleConnect = async () => {
    try {
      const res = await api.get('/calendar/google/connect');
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not initiate Google OAuth.');
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Disconnect Google Calendar? Scheduled events in Google Calendar will remain until manually removed.')) {
      try {
        await api.delete('/calendar/google/disconnect');
        setStatus({ connected: false });
        setMessage('Google Calendar integration disconnected.');
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
      setMessage(res.data.message || 'All active reminders synchronized with Google Calendar.');
      confetti({ particleCount: 60, spread: 70 });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Sync failed.');
    } finally {
      setSyncingAll(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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

      {/* Google Calendar Integration Card */}
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
                Synchronize your expiry dates and deadlines directly to your Google Calendar to receive alerts on Android & iOS.
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
              <button
                onClick={handleConnect}
                disabled={loading}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-105"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Connect Google Calendar</span>
              </button>
            )}
          </div>
        </div>

        {status.connected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Connected Account</span>
              <span className="text-slate-900 font-extrabold text-sm font-mono">
                {status.email || 'user.calendar@gmail.com'}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">Default Multi-Stage Schedule</span>
              <span className="text-slate-900 font-bold text-sm">
                30 Days • 7 Days • 1 Day Before
              </span>
            </div>
          </div>
        )}

        {/* Feature Explainer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h4 className="text-xs font-black text-slate-800">Phone Notifications</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Google Calendar pushes push notifications and sound alerts directly to your mobile devices.
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
    </div>
  );
};
