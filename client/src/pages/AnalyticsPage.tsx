import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  FileCheck2,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  UploadCloud,
  ChevronRight,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';

interface AnalyticsPayload {
  categoryDistribution: { name: string; color: string; count: number }[];
  expiryTrend: { month: string; count: number }[];
  urgencyDistribution: { priority: string; count: number; color: string }[];
  actionStatusData: { name: string; count: number; color: string }[];
  metrics: {
    totalDocuments: number;
    verifiedDocuments: number;
    verificationRate: number;
    avgConfidencePct: string;
    expiredDocuments: number;
    totalProtectedValue: number;
    totalReminders: number;
    syncedReminders: number;
    calendarSyncRate: number;
  };
}

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalDocuments: 0,
    verifiedDocuments: 0,
    verificationRate: 100,
    avgConfidencePct: '95.0%',
    expiredDocuments: 0,
    totalProtectedValue: 0,
    totalReminders: 0,
    syncedReminders: 0,
    calendarSyncRate: 0,
  };

  const categoryDistribution = data?.categoryDistribution || [];
  const expiryTrend = data?.expiryTrend || [];
  const urgencyDistribution = data?.urgencyDistribution || [];
  const actionStatusData = data?.actionStatusData || [];

  const totalUrgentActions = urgencyDistribution.reduce((acc, curr) => acc + curr.count, 0);
  const totalUpcomingExpiring = expiryTrend.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Real-Time Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Analytics & Health
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real statistics aggregated from your active documents, verified deadlines, and calendar schedules.
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </Link>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Verified Documents */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Verification Rate
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {metrics.verificationRate}%
              </div>
              <span className="text-[11px] text-slate-400 block">
                {metrics.verifiedDocuments} of {metrics.totalDocuments} docs verified
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Upcoming Expirations */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Next 6 Months Expirations
              </span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                {totalUpcomingExpiring}
              </div>
              <span className="text-[11px] text-slate-400 block">
                Scheduled renewals & bills
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Active Reminders / Calendar Sync */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Calendar Reminders
              </span>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {metrics.totalReminders}
              </div>
              <span className="text-[11px] text-slate-400 block">
                {metrics.syncedReminders} synced with Google Calendar
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Total Protected Value */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Tracked Financial Value
              </span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                ₹{metrics.totalProtectedValue.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-400 block">
                Premiums, policies & utility sums
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Expiration Timeline Projections */}
        <Card>
          <CardHeader>
            <CardTitle>Expiration Timeline Projections</CardTitle>
            <CardDescription>
              Document renewals and action deadlines scheduled over the next 6 months
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            {totalUpcomingExpiring > 0 || expiryTrend.some(m => m.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={expiryTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="expiryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '11px',
                      color: '#ffffff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Deadlines Due"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#expiryGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  No upcoming deadlines detected
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Uploaded documents with renewal or payment dates will show up here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 2: Priority & Urgency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Obligations by Consequence Priority</CardTitle>
            <CardDescription>
              Open actions classified by penalty risk and time proximity
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            {totalUrgentActions > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={urgencyDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="priority"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '11px',
                      color: '#ffffff',
                    }}
                  />
                  <Bar dataKey="count" name="Actions" radius={[6, 6, 0, 0]}>
                    {urgencyDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  All obligations resolved!
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  You have no pending urgent actions this week.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 3: Real Category Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Documents by Category</CardTitle>
            <CardDescription>
              Your actual file distribution across the 14 family & India categories
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ name, percent }: any) => `${name} ${(((percent || 0) * 100)).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '11px',
                      color: '#ffffff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <UploadCloud className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  No documents cataloged yet
                </p>
                <Link
                  to="/upload"
                  className="text-[11px] text-indigo-600 font-bold hover:underline mt-1 inline-flex items-center space-x-1"
                >
                  <span>Upload your first document</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart 4: Action Fulfillment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Action Fulfillment Status</CardTitle>
            <CardDescription>
              Breakdown of completed vs active vs overdue responsibilities
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-2">
            {actionStatusData.some(a => a.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '11px',
                      color: '#ffffff',
                    }}
                  />
                  <Bar dataKey="count" name="Tasks" radius={[6, 6, 0, 0]}>
                    {actionStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  No action items recorded
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Extracted deadlines and bills will automatically generate action status metrics.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Document Health & Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Vault Health & Synchronization</CardTitle>
          <CardDescription>
            System summary of your document records, extraction accuracy, and security state
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
              Extraction Accuracy
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{metrics.avgConfidencePct}</span>
            </div>
            <p className="text-[10px] text-slate-500">Average AI confidence across all uploads</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
              Expired Documents
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
              <span className={metrics.expiredDocuments > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                {metrics.expiredDocuments}
              </span>
              <span className="text-xs font-normal text-slate-400 ml-1">of {metrics.totalDocuments}</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {metrics.expiredDocuments > 0 ? 'Action required for expired records' : 'All documents currently active'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
              Calendar Sync Status
            </span>
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4" />
              <span>{metrics.syncedReminders} Synced</span>
            </div>
            <p className="text-[10px] text-slate-500">Alarms active on connected devices</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
              Vault Privacy
            </span>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1.5">
              <Lock className="w-4 h-4" />
              <span>Encrypted</span>
            </div>
            <p className="text-[10px] text-slate-500">Zero third-party model training</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
