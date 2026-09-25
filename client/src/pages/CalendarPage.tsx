import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import type { ActionItem, GoogleCalendarStatus } from '../types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog } from '../components/ui/dialog';
import { getGoogleCalendarWebUrl } from '../utils/calendar';
import { useToast } from '../context/ToastContext';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Default to Sep 2026
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [status, setStatus] = useState<GoogleCalendarStatus>({ connected: false });
  const [selectedEvent, setSelectedEvent] = useState<ActionItem | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const { toast } = useToast();

  const fetchCalendarData = async () => {
    try {
      const [actRes, statRes] = await Promise.all([
        api.get('/actions'),
        api.get('/calendar/google/status').catch(() => ({ data: { connected: false } })),
      ]);
      setActions(actRes.data.actions || []);
      setStatus(statRes.data);
    } catch {
      toast.error('Failed to load calendar events.');
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await api.post('/calendar/google/sync-all');
      toast.success(res.data.message || 'Synchronized with Google Calendar.');
      fetchCalendarData();
    } catch {
      toast.error('Sync failed. Ensure Google Calendar is connected in settings.');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleDownloadIcs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/calendar/export/ics', {
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
      toast.success('Calendar feed downloaded (.ics)');
    } catch {
      toast.error('Failed to download calendar feed.');
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Calendar calculations
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: Array<{
    dayNumber: number;
    isCurrentMonth: boolean;
    dateStr: string;
    events: ActionItem[];
  }> = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push({
      dayNumber: day,
      isCurrentMonth: false,
      dateStr,
      events: actions.filter((a) => a.due_date === dateStr),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dayNumber: d,
      isCurrentMonth: true,
      dateStr,
      events: actions.filter((a) => a.due_date === dateStr),
    });
  }

  // Trailing next month days to complete 35 or 42 grid
  const totalSlots = days.length <= 35 ? 35 : 42;
  const nextMonthDays = totalSlots - days.length;
  for (let d = 1; d <= nextMonthDays; d++) {
    const m = month === 11 ? 1 : month + 2;
    const y = month === 11 ? year + 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dayNumber: d,
      isCurrentMonth: false,
      dateStr,
      events: actions.filter((a) => a.due_date === dateStr),
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Deadlines Calendar
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visual month overview of all expiration dates, renewals, and actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {status.connected ? (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Google Calendar Connected</span>
              </span>
              <Button onClick={handleSyncAll} disabled={syncingAll} variant="primary" size="sm">
                <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </Button>
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              Google Calendar: <span className="font-semibold text-slate-600 dark:text-slate-300">Not Connected</span>
            </span>
          )}

          <Button onClick={handleDownloadIcs} variant="outline" size="sm">
            <Download className="w-3.5 h-3.5" />
            <span>Export (.ics)</span>
          </Button>
        </div>
      </div>

      {/* Month Navigation & Controls Bar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-base font-bold text-slate-900 dark:text-white px-2">
            {monthName} {year}
          </span>
        </div>

        <button
          onClick={goToToday}
          className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
        >
          Today
        </button>
      </div>

      {/* Interactive Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 text-center text-xs font-bold text-slate-500 py-3">
          <span>MON</span>
          <span>TUE</span>
          <span>WED</span>
          <span>THU</span>
          <span>FRI</span>
          <span>SAT</span>
          <span>SUN</span>
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
          {days.map((cell, idx) => {
            const isToday = cell.dateStr === todayStr;
            return (
              <div
                key={idx}
                className={`min-h-[96px] sm:min-h-[115px] p-2 flex flex-col justify-between transition-colors ${
                  cell.isCurrentMonth
                    ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    : 'bg-slate-50/40 dark:bg-slate-950/40 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-primary-600 text-white font-black'
                        : cell.isCurrentMonth
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {cell.events.length > 0 && (
                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-1.5 rounded">
                      {cell.events.length}
                    </span>
                  )}
                </div>

                {/* Event Pills */}
                <div className="space-y-1 mt-1">
                  {cell.events.slice(0, 2).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-semibold truncate transition ${
                        ev.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 hover:bg-rose-200'
                          : ev.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 hover:bg-amber-200'
                          : 'bg-primary-50 text-primary-700 dark:bg-primary-950/80 dark:text-primary-300 hover:bg-primary-100'
                      }`}
                      title={ev.title}
                    >
                      {ev.title}
                    </button>
                  ))}
                  {cell.events.length > 2 && (
                    <span className="text-[9px] text-slate-400 font-bold block text-center">
                      +{cell.events.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deadline Event Detail Dialog */}
      {selectedEvent && (
        <Dialog
          open={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          description={`Due Date: ${selectedEvent.due_date}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  selectedEvent.priority === 'CRITICAL'
                    ? 'danger'
                    : selectedEvent.priority === 'HIGH'
                    ? 'warning'
                    : 'primary'
                }
              >
                {selectedEvent.priority} Priority
              </Badge>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {selectedEvent.priorityReason || `Due in ${selectedEvent.daysRemaining} days`}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Related Document
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-white">
                {selectedEvent.document_title}
              </span>
            </div>

            {selectedEvent.description && (
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedEvent.description}
              </p>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <a
                href={getGoogleCalendarWebUrl(selectedEvent)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg text-xs transition"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Save to Google Calendar</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
