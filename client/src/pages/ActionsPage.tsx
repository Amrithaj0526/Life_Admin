import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  RefreshCw,
  Smartphone,
  Sliders,
  AlertCircle,
  CreditCard,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api, API_BASE_URL, getAuthToken } from '../services/api';
import type { ActionItem, DocumentItem } from '../types';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { getGoogleCalendarWebUrl } from '../utils/calendar';
import { useToast } from '../context/ToastContext';

export const ActionsPage: React.FC = () => {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [reviewDocs, setReviewDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTION_REQUIRED' | 'PAYMENT' | 'REVIEW' | 'COMPLETED'>('ALL');
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchActionsAndReviews = async () => {
    try {
      const [actionsRes, docsRes] = await Promise.all([
        api.get('/actions'),
        api.get('/documents', { params: { status: 'NEEDS_REVIEW' } }).catch(() => ({ data: { documents: [] } })),
      ]);
      setActions(actionsRes.data.actions || []);
      setReviewDocs(docsRes.data.documents || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load Action Center data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActionsAndReviews();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await api.post(`/actions/${id}/complete`);
      toast.success('Action marked as completed.');
      fetchActionsAndReviews();
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
      fetchActionsAndReviews();
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

  // Group actions by timeline and categories
  const today = new Date().toISOString().slice(0, 10);
  const activeActions = actions.filter((a) => a.status !== 'COMPLETED');
  const completedActions = actions.filter((a) => a.status === 'COMPLETED');

  const urgentActions = activeActions.filter(
    (a) => (a.daysRemaining ?? 0) <= 8 || a.isOverdue || a.due_date <= today || a.priority === 'CRITICAL'
  );

  const paymentActions = activeActions.filter(
    (a) =>
      a.type === 'PAY' ||
      a.title.toLowerCase().includes('pay') ||
      a.title.toLowerCase().includes('bill') ||
      a.title.toLowerCase().includes('premium') ||
      a.title.toLowerCase().includes('fee') ||
      a.title.toLowerCase().includes('rent')
  );

  const overdue = activeActions.filter((a) => (a.daysRemaining ?? 0) < 0 || a.due_date < today);
  const dueToday = activeActions.filter((a) => a.due_date === today);
  const thisWeek = activeActions.filter(
    (a) => (a.daysRemaining ?? 0) > 0 && (a.daysRemaining ?? 0) <= 7 && a.due_date !== today
  );
  const nextMonth = activeActions.filter(
    (a) => (a.daysRemaining ?? 0) > 7 && (a.daysRemaining ?? 0) <= 30
  );
  const later = activeActions.filter((a) => (a.daysRemaining ?? 0) > 30);

  // Filter items based on current active tab
  const getFilteredActions = () => {
    if (activeFilter === 'ACTION_REQUIRED') return urgentActions;
    if (activeFilter === 'PAYMENT') return paymentActions;
    if (activeFilter === 'COMPLETED') return completedActions;
    return activeActions;
  };

  const filteredItems = getFilteredActions();

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
      {/* 1. Action Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-bold mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Personal Responsibility & Deadline Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Action Center
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Proactively alerting you to what requires your immediate attention, upcoming payments, and AI document verifications.
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

      {/* 2. Proactive Action Center Status Banner (Section 6) */}
      {urgentActions.length > 0 ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 flex items-start space-x-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                🔴 Action Required
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200">
                {urgentActions.length} Urgent {urgentActions.length === 1 ? 'Deadline' : 'Deadlines'}
              </span>
            </div>
            <p className="text-xs text-rose-900 dark:text-rose-200 font-medium">
              You have responsibilities expiring within 8 days or overdue. Act promptly to prevent service interruptions, vehicle fines, or lapses in coverage.
            </p>
          </div>
        </div>
      ) : paymentActions.length > 0 ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex items-start space-x-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                🟠 Payment Approaching
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                {paymentActions.length} Upcoming Dues
              </span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
              Upcoming bill or insurance premium payments scheduled soon. Review amounts and due dates to maintain good standing.
            </p>
          </div>
        </div>
      ) : reviewDocs.length > 0 ? (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 flex items-start space-x-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5">
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                🟡 Review Required
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/80 dark:bg-blue-900/80 text-blue-900 dark:text-blue-200">
                {reviewDocs.length} {reviewDocs.length === 1 ? 'Document' : 'Documents'}
              </span>
            </div>
            <p className="text-xs text-blue-900 dark:text-blue-200 font-medium">
              AI detected important dates and obligations in your uploaded documents. Verify them below to activate automatic reminders and calendar events.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-4 flex items-start space-x-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                🟢 All Good
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200">
                All Responsibilities On Track
              </span>
            </div>
            <p className="text-xs text-emerald-900 dark:text-emerald-200 font-medium">
              No urgent actions or overdue obligations this week. All documents and policies are verified and scheduled.
            </p>
          </div>
        </div>
      )}

      {/* 3. Action Center Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeFilter === 'ALL'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Items ({activeActions.length})
        </button>

        <button
          onClick={() => setActiveFilter('ACTION_REQUIRED')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
            activeFilter === 'ACTION_REQUIRED'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          }`}
        >
          <span>🔴 Action Required</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {urgentActions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('PAYMENT')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
            activeFilter === 'PAYMENT'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
          }`}
        >
          <span>🟠 Payments</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {paymentActions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('REVIEW')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
            activeFilter === 'REVIEW'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
          }`}
        >
          <span>🟡 AI Review Needed</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {reviewDocs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('COMPLETED')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
            activeFilter === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
          }`}
        >
          <span>🟢 Completed</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {completedActions.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section A: AI Review Needed Items */}
          {(activeFilter === 'ALL' || activeFilter === 'REVIEW') && reviewDocs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <FileCheck className="w-4 h-4" />
                <h3 className="text-xs font-black tracking-wider uppercase">
                  Pending AI Extractions Awaiting Verification
                </h3>
                <span className="text-xs font-bold bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                  {reviewDocs.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviewDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-blue-700 dark:text-blue-300">
                          {doc.category_name || 'General'}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {doc.created_at?.slice(0, 10)}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                        {doc.provider ? `Provider: ${doc.provider} • ` : ''}
                        {doc.expiry_date ? `Detected Expiry: ${doc.expiry_date}` : 'Action dates extracted.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-blue-100 dark:border-blue-900/40">
                      <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold flex items-center space-x-1">
                        <Info className="w-3 h-3" />
                        <span>Confirm to schedule calendar alarms</span>
                      </span>
                      <Button
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        variant="primary"
                        size="sm"
                        className="text-xs"
                      >
                        <span>Review & Verify</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section B: Action Items List */}
          {activeFilter !== 'REVIEW' && (
            filteredItems.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeFilter === 'ACTION_REQUIRED'
                    ? 'No Urgent Actions Required!'
                    : activeFilter === 'PAYMENT'
                    ? 'No Upcoming Payments!'
                    : activeFilter === 'COMPLETED'
                    ? 'No Completed Tasks Yet.'
                    : 'All Caught Up!'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {activeFilter === 'ACTION_REQUIRED'
                    ? 'You have zero deadlines due within 8 days.'
                    : activeFilter === 'PAYMENT'
                    ? 'No impending utility bills or premium dues.'
                    : 'All your documents and responsibilities are current.'}
                </p>
              </Card>
            ) : activeFilter !== 'ALL' ? (
              <div className="space-y-3">
                <div className="space-y-2">{filteredItems.map(renderActionRow)}</div>
              </div>
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
            )
          )}
        </div>
      )}
    </div>
  );
};
