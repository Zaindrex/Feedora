import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { APP_CONFIG } from '../../config';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Enter your administrator email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    const res = await login(email, password, 'admin');
    setLoading(false);

    if (res.success) {
      toast.success('Authenticated as System Administrator');
      navigate('/admin/dashboard');
    } else {
      setError(res.error || 'Invalid administrator credentials.');
      toast.error(res.error || 'Access denied');
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white selection:bg-primary-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/40 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            {APP_CONFIG.appName} Admin
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">
          Superuser Control Center
        </h2>
        <p className="mt-1.5 text-xs text-slate-400">
          Restricted access. Only provisioned platform operators can sign in.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800 space-y-6">


          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Administrator Email
              </label>
              <Input
                type="email"
                placeholder="admin@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                autoComplete="email"
                className="!bg-slate-800/80 border-slate-700 !text-white placeholder-slate-500 focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                autoComplete="current-password"
                className="!bg-slate-800/80 border-slate-700 !text-white placeholder-slate-500 focus:border-primary"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-xs text-rose-300 font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center mt-2"
              isLoading={loading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Authenticate Admin
            </Button>
          </form>

          <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400">
            <Link to="/login" className="hover:text-primary transition-colors flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Owner Sign In</span>
            </Link>
            <Link to="/" className="hover:text-slate-200 transition-colors">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
        <ShieldAlert className="w-7 h-7" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        You do not possess the required security permissions or role to view this restricted page.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link to="/login">
          <Button variant="outline" size="sm">
            Sign In with Another Account
          </Button>
        </Link>
        <Link to="/">
          <Button variant="primary" size="sm">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};
