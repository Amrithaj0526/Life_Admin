import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Upload,
  CheckSquare,
  Search,
  Users,
  LogOut,
  Shield,
  Bell,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/upload', label: 'Upload & Analyze', icon: Upload, highlight: true },
    { to: '/actions', label: 'Action Items', icon: CheckSquare },
    { to: '/search', label: 'Search & Natural Q&A', icon: Search },
    { to: '/vaults', label: 'Family Vault', icon: Users },
    { to: '/audit-trail', label: 'Audit Trail', icon: Shield },
    { to: '/settings', label: 'Calendar & Settings', icon: Calendar },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-100">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                LifeAdmin
              </h1>
              <p className="text-xs font-medium text-slate-400">Intelligent Document OS</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60'
                        : item.highlight
                        ? 'text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/50'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className={`w-4.5 h-4.5 ${item.highlight ? 'text-emerald-600' : ''}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="font-medium text-slate-700">Autonomous OCR & Action Detection Active</span>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
