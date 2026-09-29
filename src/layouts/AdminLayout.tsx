import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Building2,
  MessageSquare,
  BarChart3,
  FileText,
  Sliders,
  LogOut,
  Menu,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { APP_CONFIG } from '../config';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: ShieldAlert },
    { label: 'Owners', path: '/admin/owners', icon: Users },
    { label: 'Businesses', path: '/admin/businesses', icon: Building2 },
    { label: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
    { label: 'Settings', path: '/admin/settings', icon: Sliders },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white leading-tight">
                  {APP_CONFIG.appName}
                </span>
                <span className="text-[10px] text-primary-300 font-semibold tracking-wider uppercase">
                  Admin Console
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin badge */}
          <div className="mx-4 my-4 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Superuser Mode</p>
              <p className="text-[10px] text-slate-400">Full system & RLS privileges</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-1 space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                A
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-slate-900">
              System Administration
            </h1>
          </div>

        </header>

        {/* Content body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
