import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  RefreshCw,
  Smartphone,
  Sliders,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, API_BASE_URL, getAuthToken } from '../services/api';
import type { ActionItem } from '../types';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { getGoogleCalendarWebUrl } from '../utils/calendar';
import { useToast } from '../context/ToastContext';

export const ActionsPage: React.FC = () => {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchActions = async () => {
    try {
      const res = await api.get('/actions');
      setActions(res.data.actions || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load deadlines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await api.post(`/actions/${id}/complete`);
      toast.success('Action marked as completed.');
      fetchActions();
    } catch (err) {
      toast.error('Failed to complete action.');
    }
  };

  const handleSyncReminder = async (reminderId?: string) => {
    if (!reminderId) return;
    setSyncingId(reminderId);
    try {
      await api.post(`/calendar/google/sync/${reminderId}`);
      toast.success('Synchronized with your Google Calendar.');
      confetti({ particleCount: 40, spread: 50 });
      fetchActions();
    } catch (err: any) {
      toast.warning('Google Calendar sync failed. Check settings.');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDownloadIcs = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/calendar/export/ics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();

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
      toast.error('Unable to export calendar.');
    }
  };

  // Group actions by timeline
  const today = new Date().toISOString().slice(0, 10);
  const activeActions = actions.filter((a) => a.status !== 'COMPLETED');

  const overdue = activeActions.filter((a) => (a.daysRemaining ?? 0) < 0 || a.due_date < today);
  const dueToday = activeActions.filter((a) => a.due_date === today);
  const thisWeek = activeActions.filter(
    (a) => (a.daysRemaining ?? 0) > 0 && (a.daysRemaining ?? 0) <= 7 && a.due_date !== today
  );
  const nextMonth = activeActions.filter(
    (a) => (a.daysRemaining ?? 0) > 7 && (a.daysRemaining ?? 0) <= 30
  );
  const later = activeActions.filter((a) => (a.daysRemaining ?? 0) > 30);

  const renderActionRow = (item: ActionItem) => (
    <div
      key={item.id}
      className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-300 dark:hover:border-slate-700"
    >
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <Badge
            variant={
              item.priority === 'CRITICAL'
                ? 'danger'
                : item.priority === 'HIGH'
                ? 'warning'
                : 'primary'
            }
            size="sm"
          >
            {item.priority}
          </Badge>
          <span className="text-[11px] font-medium text-slate-400">•</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {item.priorityReason || `Due in ${item.daysRemaining} days`}
          </span>
        </div>

        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {item.document_title}
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1 text-slate-700 dark:text-slate-200 font-semibold">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Due: {item.due_date}</span>
          </span>

          {/* 1-Click Real Google Calendar Save Link */}
          <a
            href={getGoogleCalendarWebUrl(item)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 rounded-md transition"
            title="Save to your personal Google Calendar in 1-click"
          >
            <CalendarIcon className="w-3 h-3 text-primary-600" />
            <span>Add to Google Calendar</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>

          {item.calendar_sync_status === 'SYNCED' ? (
            <span className="inline-flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-semibold text-[10px]">
              <Smartphone className="w-3 h-3" />
              <span>G-Cal Synced ✓</span>
            </span>
          ) : item.reminder_id ? (
            <button
              onClick={() => handleSyncReminder(item.reminder_id)}
              disabled={syncingId === item.reminder_id}
              className="inline-flex items-center space-x-1 text-slate-500 hover:text-primary-600 text-[11px] font-semibold px-2 py-0.5 rounded transition"
            >
              <RefreshCw className={`w-3 h-3 ${syncingId === item.reminder_id ? 'animate-spin' : ''}`} />
              <span>Sync via API</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <Button
          onClick={() => handleComplete(item.id)}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
          <span>Mark Complete</span>
        </Button>
        <Link
          to={`/documents/${item.document_id}`}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-lg transition"
        >
          View Doc
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Deadlines & Obligations
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Impending actions dynamically organized by timeline urgency.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button onClick={handleDownloadIcs} variant="outline" size="sm">
            <Download className="w-3.5 h-3.5" />
            <span>Export (.ics)</span>
          </Button>
          <Link to="/settings">
            <Button variant="secondary" size="sm">
              <Sliders className="w-3.5 h-3.5" />
              <span>Calendar Settings</span>
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : activeActions.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">All Caught Up!</h3>
          <p className="text-xs text-slate-400 mt-1">You have zero pending deadlines or expired documents.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Overdue Section (If any) */}
          {overdue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <h3 className="text-xs font-black tracking-wider uppercase">Overdue Deadlines</h3>
                <span className="text-xs font-bold bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                  {overdue.length}
                </span>
              </div>
              <div className="space-y-2">{overdue.map(renderActionRow)}</div>
            </div>
          )}

          {/* Today Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Today
              </h3>
              <span className="text-xs font-semibold text-slate-400">{today}</span>
            </div>
            {dueToday.length > 0 ? (
              <div className="space-y-2">{dueToday.map(renderActionRow)}</div>
            ) : (
              <p className="text-xs text-slate-400 italic py-1">No deadlines due today.</p>
            )}
          </div>

          {/* This Week Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                This Week
              </h3>
              <span className="text-xs font-semibold text-slate-400">Next 7 days</span>
            </div>
            {thisWeek.length > 0 ? (
              <div className="space-y-2">{thisWeek.map(renderActionRow)}</div>
            ) : (
              <p className="text-xs text-slate-400 italic py-1">No deadlines this week.</p>
            )}
          </div>

          {/* Next Month Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                Next Month
              </h3>
              <span className="text-xs font-semibold text-slate-400">8 to 30 days</span>
            </div>
            {nextMonth.length > 0 ? (
              <div className="space-y-2">{nextMonth.map(renderActionRow)}</div>
            ) : (
              <p className="text-xs text-slate-400 italic py-1">No deadlines next month.</p>
            )}
          </div>

          {/* Later Section */}
          {later.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Later & Future Renewals
                </h3>
                <span className="text-xs font-semibold text-slate-400">&gt; 30 days</span>
              </div>
              <div className="space-y-2">{later.map(renderActionRow)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
