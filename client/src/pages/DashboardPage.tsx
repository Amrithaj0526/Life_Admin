import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import type { DashboardData } from '../types';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/overview');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCompleteAction = async (id: string) => {
    try {
      await api.post(`/actions/${id}/complete`);
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalDocuments: 0,
    activeDocuments: 0,
    pendingReview: 0,
    overdueActions: 0,
    pendingActions: 0,
  };

  const prioritySummary = data?.prioritySummary || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Action & Intelligence Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time status of your documents, impending deadlines, and required actions.
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg shadow-md shadow-emerald-600/20 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Upload Document</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Stored</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-800">{metrics.totalDocuments}</div>
          <span className="text-xs font-medium text-slate-400 mt-1 block">Active across all vaults</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Overdue Actions</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-rose-700">{metrics.overdueActions}</div>
          <span className="text-xs font-semibold text-rose-600 mt-1 block">Immediate action required</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-700">{metrics.pendingReview}</div>
          <span className="text-xs font-semibold text-amber-600 mt-1 block">Needs verification</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-700">{metrics.activeDocuments}</div>
          <span className="text-xs font-semibold text-emerald-600 mt-1 block">Safe and scheduled</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Todos</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-800">{metrics.pendingActions}</div>
          <span className="text-xs font-medium text-slate-400 mt-1 block">Scheduled reminders set</span>
        </div>
      </div>

      {/* Priority Summary Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-bold text-slate-700">Action Urgency Breakdown:</span>
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-600 font-medium">Critical:</span>
            <span className="font-bold text-slate-900">{prioritySummary.CRITICAL}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-600 font-medium">High:</span>
            <span className="font-bold text-slate-900">{prioritySummary.HIGH}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-slate-600 font-medium">Medium:</span>
            <span className="font-bold text-slate-900">{prioritySummary.MEDIUM}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span className="text-slate-600 font-medium">Low:</span>
            <span className="font-bold text-slate-900">{prioritySummary.LOW}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Action Required + Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Action Required (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Action Required (Take Care First)</span>
            </h3>
            <Link to="/actions" className="text-xs font-bold text-emerald-600 hover:underline">
              View all actions →
            </Link>
          </div>

          <div className="space-y-3">
            {data?.urgentActions && data.urgentActions.length > 0 ? (
              data.urgentActions.map((action) => (
                <div
                  key={action.id}
                  className={`p-4 rounded-xl border bg-white shadow-sm flex items-start justify-between transition-all ${
                    action.priority === 'CRITICAL'
                      ? 'border-rose-300 hover:border-rose-400 bg-rose-50/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          action.priority === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-700'
                            : action.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {action.priority}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">{action.category_name || 'General'}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{action.title}</h4>
                    {action.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{action.description}</p>
                    )}

                    <div className="flex items-center space-x-4 pt-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Source: {action.document_title}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-rose-600 font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due: {action.due_date}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleCompleteAction(action.id)}
                      className="text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-3 py-2 rounded-lg border border-slate-200 transition"
                    >
                      Done
                    </button>
                    <Link
                      to={`/documents/${action.document_id}`}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg shadow-sm transition"
                    >
                      Resolve
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800">All clear! No urgent actions pending.</h4>
                <p className="text-xs text-slate-400 mt-1">Upload new documents to track upcoming deadlines automatically.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Deadlines Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800">Upcoming Deadlines</h3>
            <span className="text-xs font-medium text-slate-400">Next 60 Days</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 divide-y divide-slate-100 shadow-sm">
            {data?.upcomingDeadlines && data.upcomingDeadlines.length > 0 ? (
              data.upcomingDeadlines.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{item.title}</h5>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <span>{item.category_name}</span>
                      {item.amount && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">
                            {item.amount} {item.currency}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-1 rounded-md block">
                      {item.expiry_date}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No upcoming expirations in next 60 days.</p>
            )}
          </div>

          {/* Recent Documents Snippet */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800">Recently Processed</h4>
              <Link to="/documents" className="text-xs font-bold text-emerald-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {data?.recentDocuments?.slice(0, 3).map((doc) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate">{doc.title}</p>
                    <p className="text-[11px] text-slate-400">{doc.category_name || 'General'}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
