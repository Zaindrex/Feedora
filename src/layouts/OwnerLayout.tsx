import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  QrCode,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { databaseService } from '../services/databaseService';
import { Business } from '../types';
import { APP_CONFIG } from '../config';

export const OwnerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Business state for owner
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    let active = true;
    if (!user) return;
    void databaseService.getBusinessesByOwnerId(user.id).then((owned) => {
      if (!active) return;
      setBusinesses(owned);
      setSelectedBusiness(owned[0] || null);
    }).catch((error: unknown) => {
      console.error('Failed to load owner businesses:', error);
      if (active) {
        setBusinesses([]);
        setSelectedBusiness(null);
      }
    });
    return () => { active = false; };
  }, [user]);

  const navItems = [
    { label: 'Overview', path: '/owner/dashboard', icon: LayoutDashboard },
    { label: 'Reviews', path: '/owner/reviews', icon: MessageSquare },
    { label: 'Analytics', path: '/owner/analytics', icon: BarChart3 },
    { label: 'QR Code', path: '/owner/qr', icon: QrCode },
    { label: 'Business Profile', path: '/owner/business', icon: Building2 },
    { label: 'Settings', path: '/owner/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
            <Link to="/owner/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-slate-900 tracking-tight">
                {APP_CONFIG.appName}
              </span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Business Selector / Info */}
          {selectedBusiness && (
            <div className="p-4 mx-3 my-3 bg-slate-50 border border-slate-200/80 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Active Venue
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  {selectedBusiness.logo_url ? (
                    <img
                      src={selectedBusiness.logo_url}
                      alt={selectedBusiness.name}
                      className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-md bg-primary-light text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {selectedBusiness.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {selectedBusiness.name}
                  </span>
                </div>
                {businesses.length > 1 && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </div>
            </div>
          )}

          {/* Nav links */}
          <nav className="px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-light text-primary font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.charAt(0) || 'O'}
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200/60"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Top Navbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold text-slate-800 hidden sm:block">
              Business Portal
            </h2>
          </div>

        </header>

        {/* Content body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ business: selectedBusiness, setBusiness: setSelectedBusiness }} />
        </main>
      </div>
    </div>
  );
};
