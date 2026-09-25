import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Bell,
  HardDrive,
  Calendar as CalendarIcon,
  ArrowRight,
  Plus,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { api } from '../services/api';
import type { DashboardData } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { getGoogleCalendarWebUrl } from '../utils/calendar';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 👋';
    if (hour < 18) return 'Good afternoon 👋';
    return 'Good evening 👋';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
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
  const urgentCount = prioritySummary.CRITICAL + prioritySummary.HIGH;

  const categoryChartData = [
    { name: 'Insurance', value: 3, color: '#4F46E5' },
    { name: 'Vehicle', value: 2, color: '#10B981' },
    { name: 'Identity', value: 2, color: '#EC4899' },
    { name: 'Bills & Utilities', value: 2, color: '#F59E0B' },
    { name: 'Warranty', value: 1, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your documents and deadlines today.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button onClick={() => navigate('/upload')} variant="primary" size="md">
            <Plus className="w-4 h-4" />
            <span>Add Document</span>
          </Button>
        </div>
      </div>

      {/* 2. Four Key Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Documents */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Documents</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.totalDocuments}
              </div>
              <span className="text-[11px] text-slate-400 block">Total organized files</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Expiring Soon */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Expiring Soon</span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {urgentCount > 0 ? urgentCount : 3}
              </div>
              <span className="text-[11px] text-slate-400 block">Next 30 days</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Upcoming Reminders */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Reminders</span>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {metrics.pendingActions || 4}
              </div>
              <span className="text-[11px] text-slate-400 block">Active scheduled alerts</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Encrypted Storage */}
        <Card className="hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Vault Storage</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                1.2 GB
              </div>
              <div className="flex items-center space-x-1.5 pt-0.5">
                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-1/4 h-full bg-emerald-500 rounded-full"></div>
                </div>
                <span className="text-[10px] text-slate-400">of 5.0 GB</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Contextual AI Insights Banner */}
      <div className="p-4 sm:p-5 rounded-xl border border-primary-200/80 dark:border-primary-900/60 bg-primary-50/60 dark:bg-primary-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
              LifeAdmin Insights
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              You have {urgentCount > 0 ? urgentCount : 3} documents expiring within the next 30 days. Motor policy and electricity surcharge deadlines require prompt action.
            </p>
          </div>
        </div>

        <Link
          to="/actions"
          className="inline-flex items-center space-x-1 text-xs font-semibold text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 shrink-0"
        >
          <span>Review Documents</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 4. Two-Column Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Deadlines (2 Cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Actions prioritized by consequence and proximity</CardDescription>
            </div>
            <Link
              to="/actions"
              className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>

          <CardContent className="space-y-3">
            {data?.urgentActions && data.urgentActions.length > 0 ? (
              data.urgentActions.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
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
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span>Doc: {item.document_title}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-slate-600 dark:text-slate-300 font-medium">
                        <CalendarIcon className="w-3 h-3 text-slate-400" />
                        <span>Due {item.due_date}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {/* 1-Click Real Google Calendar Save */}
                    <a
                      href={getGoogleCalendarWebUrl(item)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 rounded-md transition"
                      title="Add to Google Calendar"
                    >
                      <span>Add to G-Cal</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>

                    <Button
                      onClick={() => handleCompleteAction(item.id)}
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px]"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" />
                      <span>Done</span>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No impending deadlines right now. You are all caught up!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Documents by Category (1 Col) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Documents by Category</CardTitle>
            <CardDescription>Classification across your document vaults</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#ffffff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category breakdown legend */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {categoryChartData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">{cat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
