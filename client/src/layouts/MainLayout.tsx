import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Clock,
  Calendar as CalendarIcon,
  BarChart3,
  HeartHandshake,
  Users,
  ShieldCheck,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Plus,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CommandMenu } from '../components/ui/command-menu';
import { Button } from '../components/ui/button';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navPrimary = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/actions', label: 'Deadlines', icon: Clock },
    { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/social-impact', label: 'Citizen Protection', icon: HeartHandshake },
  ];

  const navSecondary = [
    { to: '/vaults', label: 'Family Vault', icon: Users },
    { to: '/audit-trail', label: 'Audit Trail', icon: ShieldCheck },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/help', label: 'Help & Support', icon: HelpCircle },
  ];

  // Derive page title for Header
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/documents/') && path !== '/documents') return 'Document Details';
    if (path.includes('/documents')) return 'Documents';
    if (path.includes('/upload')) return 'Upload & Extraction';
    if (path.includes('/actions')) return 'Deadlines & Reminders';
    if (path.includes('/calendar')) return 'Calendar';
    if (path.includes('/analytics')) return 'Analytics & Statistics';
    if (path.includes('/social-impact')) return 'Citizen Protection Hub';
    if (path.includes('/vaults')) return 'Family Vault';
    if (path.includes('/audit-trail')) return 'Audit Trail';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/help')) return 'Help & Support';
    return 'LifeAdmin';
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 antialiased font-sans">
      {/* Global Command Menu (Cmd + K) */}
      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (240px - 260px) */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-[#111827] border-r border-[#E5E7EB] dark:border-[#1F2937] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* LifeAdmin Logo Header */}
          <div className="h-16 px-6 border-b border-[#E5E7EB] dark:border-[#1F2937] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-sm shadow-primary-600/30">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  LifeAdmin
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200/60 dark:border-primary-800/60">
                  PRO
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action: Upload Document Button */}
          <div className="p-4 pb-2">
            <Button
              onClick={() => {
                navigate('/upload');
                setMobileMenuOpen(false);
              }}
              variant="primary"
              size="md"
              className="w-full justify-center shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </Button>
          </div>

          {/* Primary Navigation */}
          <nav className="p-3 space-y-1">
            {navPrimary.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div className="py-2">
              <hr className="border-[#E5E7EB] dark:border-[#1F2937]" />
            </div>

            {navSecondary.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-[#E5E7EB] dark:border-[#1F2937] bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-bold text-xs flex items-center justify-center shrink-0">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-none">
                  {user?.name || 'Demo User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {user?.email || 'demo@lifeadmin.local'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 px-6 bg-white dark:bg-[#111827] border-b border-[#E5E7EB] dark:border-[#1F2937] flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-slate-600 dark:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Button with Keyboard Shortcut */}
            <button
              onClick={() => setCommandOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline text-[10px] font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500">
                ⌘K
              </kbd>
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#111827]"></span>
              </button>

              {/* Notifications Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Notifications</span>
                    <span className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold cursor-pointer">Mark all read</span>
                  </div>
                  <div className="py-2 space-y-2 text-xs">
                    <div className="p-2 bg-primary-50/50 dark:bg-primary-950/40 rounded-lg">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Vehicle Insurance due soon</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Expires in 19 days. Automatic reminder active.</p>
                    </div>
                    <div className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">Google Calendar Ready</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Deadlines can be added directly to your Google account.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
