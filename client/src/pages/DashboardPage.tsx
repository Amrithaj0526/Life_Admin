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
  Sparkles,
  Zap,
  BarChart3
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
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

  const priorityChartData = [
    { name: 'Critical', value: prioritySummary.CRITICAL, color: '#ef4444' },
    { name: 'High', value: prioritySummary.HIGH, color: '#f59e0b' },
    { name: 'Medium', value: prioritySummary.MEDIUM, color: '#3b82f6' },
    { name: 'Low', value: prioritySummary.LOW, color: '#94a3b8' },
  ].filter((item) => item.value > 0);

  const upcomingChartData = (data?.upcomingDeadlines || []).map((item) => ({
    name: item.title.length > 14 ? item.title.slice(0, 14) + '...' : item.title,
    date: item.expiry_date.slice(5),
    amount: item.amount || 50,
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Executive Welcome & Quick Action Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur border border-emerald-500/30">
              <Zap className="w-3.5 h-3.5" />
              <span>Real-Time Autonomous Tracking Engine</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">Executive Document Intelligence</h2>
            <p className="text-slate-300 text-sm max-w-xl">
              LifeAdmin continuously monitors expirations, service cycles, and penalty deadlines across all your assets and insurance.
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Upload Document</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Managed</span>
            <FileText className="w-4 h-4" />
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{metrics.totalDocuments}</div>
          <span className="text-xs font-medium text-slate-400 mt-1 block">Active across vaults</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200/90 bg-rose-50/20 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-xs font-bold uppercase tracking-wider">Overdue Items</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-rose-700">{metrics.overdueActions}</div>
          <span className="text-xs font-bold text-rose-600 mt-1 block">Immediate action required</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/90 bg-amber-50/20 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Needs Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-amber-700">{metrics.pendingReview}</div>
          <span className="text-xs font-bold text-amber-600 mt-1 block">Human verification loop</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 bg-emerald-50/20 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Active Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-black text-emerald-700">{metrics.activeDocuments}</div>
          <span className="text-xs font-bold text-emerald-600 mt-1 block">Safe and scheduled</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Scheduled Todos</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900">{metrics.pendingActions}</div>
          <span className="text-xs font-medium text-slate-400 mt-1 block">Multi-stage reminders</span>
        </div>
      </div>

      {/* Visual Analytics Row: Urgency Breakdown & Upcoming Cost/Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgency Distribution (Pie) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <span>Priority & Urgency Distribution</span>
            </h3>
          </div>
          {priorityChartData.length > 0 ? (
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 text-xs">
                {priorityChartData.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-slate-600">{item.name}:</span>
                    <span className="font-extrabold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              No active priorities detected
            </div>
          )}
        </div>

        {/* Expirations Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Impending Deadlines & Payment Amounts</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">Next 60 Days</span>
          </div>

          {upcomingChartData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={upcomingChartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              No upcoming payments in this window
            </div>
          )}
        </div>
      </div>

      {/* Main Operational Feed: Action Required + Upcoming Expirations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Action Required (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Action Required (Take Care First)</span>
            </h3>
            <Link to="/actions" className="text-xs font-bold text-emerald-600 hover:underline">
              View all {metrics.pendingActions} actions →
            </Link>
          </div>

          <div className="space-y-3">
            {data?.urgentActions && data.urgentActions.length > 0 ? (
              data.urgentActions.map((action) => (
                <div
                  key={action.id}
                  className={`p-5 rounded-2xl border bg-white shadow-sm flex items-start justify-between transition-all hover:shadow-md ${
                    action.priority === 'CRITICAL'
                      ? 'border-rose-300 bg-rose-50/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
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
                      <span className="text-xs font-semibold text-slate-500">
                        {action.category_name || 'General'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{action.title}</h4>
                    {action.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{action.description}</p>
                    )}

                    <div className="flex items-center space-x-4 pt-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Source: {action.document_title}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-rose-600 font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due: {action.due_date}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleCompleteAction(action.id)}
                      className="text-xs font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 transition"
                    >
                      Done
                    </button>
                    <Link
                      to={`/documents/${action.document_id}`}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl shadow-sm transition"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800">All clear! No urgent actions pending.</h4>
                <p className="text-xs text-slate-400 mt-1">Upload new documents to track upcoming deadlines automatically.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Deadlines + Recently Processed */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Upcoming Expiration Timeline</h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Auto-Alerts
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {data?.upcomingDeadlines && data.upcomingDeadlines.length > 0 ? (
                data.upcomingDeadlines.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 truncate max-w-[170px]">{item.title}</h5>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{item.category_name}</span>
                        {item.amount && (
                          <>
                            <span>•</span>
                            <span className="font-bold text-slate-700">
                              {item.amount} {item.currency}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/50 px-2 py-1 rounded-lg">
                      {item.expiry_date}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No upcoming expirations in next 60 days.</p>
              )}
            </div>
          </div>

          {/* Quick Traceability Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900">Recently Processed</h4>
              <Link to="/documents" className="text-xs font-bold text-emerald-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {data?.recentDocuments?.slice(0, 3).map((doc) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                >
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-800 truncate">{doc.title}</p>
                    <p className="text-[11px] text-slate-400">{doc.category_name || 'General'}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
