import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { APP_CONFIG } from '../config';
import { Button } from '../components/ui/Button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-primary-100">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full glass border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-primary transition-colors">
              {APP_CONFIG.appName}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-primary transition-colors">
              Features
            </a>
            <a href="#built-for" className="hover:text-primary transition-colors">
              Built For
            </a>

          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to={role === 'admin' ? '/admin/dashboard' : '/owner/dashboard'}>
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Owner Login
                  </Button>
                </Link>
                <Link to="/admin/login" className="hidden sm:inline-block">
                  <Button variant="outline" size="sm">
                    Admin Portal
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-bold text-base text-slate-900">{APP_CONFIG.appName}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Empowering businesses to capture genuine in-moment customer impressions and turn them into 5-star Google reviews.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><a href="#how-it-works" className="hover:text-primary">How It Works</a></li>
                <li><a href="#features" className="hover:text-primary">QR Generators</a></li>
                <li><a href="#features" className="hover:text-primary">AI Review Engine</a></li>
                <li><Link to="/review/underground-bar" className="hover:text-primary text-primary font-medium">Interactive Demo</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Industries</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><a href="#built-for" className="hover:text-primary">Restaurants & Bars</a></li>
                <li><a href="#built-for" className="hover:text-primary">Hotels & Hospitality</a></li>
                <li><a href="#built-for" className="hover:text-primary">Salons & Spas</a></li>
                <li><a href="#built-for" className="hover:text-primary">Clinics & Wellness</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Access</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><Link to="/login" className="hover:text-primary">Business Owner Sign In</Link></li>
                <li><Link to="/admin/login" className="hover:text-primary">Admin Sign In</Link></li>
                <li><a href="mailto:support@feedora.app" className="hover:text-primary">Contact Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
            <p>© {new Date().getFullYear()} {APP_CONFIG.companyName}. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Google Review Policy Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
