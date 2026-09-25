import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Calendar, CheckSquare, RefreshCw, Smartphone } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import type { ActionItem } from '../types';

export const ActionsPage: React.FC = () => {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchActions = async () => {
    try {
      const res = await api.get('/actions', {
        params: { status: statusFilter, priority: priorityFilter },
      });
      setActions(res.data.actions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [statusFilter, priorityFilter]);

  const handleComplete = async (id: string) => {
    try {
      await api.post(`/actions/${id}/complete`);
      fetchActions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncReminder = async (reminderId?: string) => {
    if (!reminderId) return;
    try {
      await api.post(`/calendar/google/sync/${reminderId}`);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      fetchActions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Action Items & Reminders</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Impending actions dynamically prioritized by proximity, urgency, and consequence.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Action Items List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : actions.length > 0 ? (
        <div className="space-y-3">
          {actions.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-xl border bg-white shadow-sm flex items-center justify-between gap-4 transition ${
                item.status === 'COMPLETED'
                  ? 'opacity-60 bg-slate-50 border-slate-200'
                  : item.priority === 'CRITICAL'
                  ? 'border-rose-300'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      item.priority === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : item.priority === 'HIGH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.priority}
                  </span>
                  <span className="text-xs font-bold text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {item.priorityReason || `Due in ${item.daysRemaining} days`}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                {item.description && <p className="text-xs text-slate-500">{item.description}</p>}

                <div className="flex items-center space-x-3 text-xs text-slate-500 pt-1">
                  <span className="font-semibold text-slate-700">Document: {item.document_title}</span>
                  <span>•</span>
                  <span className="flex items-center space-x-1 text-rose-600 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due: {item.due_date}</span>
                  </span>
                  {item.calendar_sync_status === 'SYNCED' ? (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center space-x-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold text-[11px] border border-blue-200/50">
                        <Smartphone className="w-3 h-3 text-blue-600" />
                        <span>Google Calendar Synced ✓</span>
                      </span>
                    </>
                  ) : item.reminder_id ? (
                    <>
                      <span>•</span>
                      <button
                        onClick={() => handleSyncReminder(item.reminder_id)}
                        className="inline-flex items-center space-x-1 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded-md font-bold text-[11px] border border-slate-200 transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Sync with Google Calendar</span>
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {item.status !== 'COMPLETED' ? (
                  <button
                    onClick={() => handleComplete(item.id)}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-lg">
                    Completed
                  </span>
                )}
                <Link
                  to={`/documents/${item.document_id}`}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg transition"
                >
                  View Doc
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No actions found</h3>
          <p className="text-xs text-slate-400 mt-1">You are up to date on all document obligations!</p>
        </div>
      )}
    </div>
  );
};
