import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { APP_CONFIG } from '../../config';

export const OwnerLoginPage: React.FC = () => {
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
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setLoading(true);

    const res = await login(email, password, 'owner');
    setLoading(false);

    if (res.success) {
      toast.success('Welcome back to your business dashboard!');
      navigate('/owner/dashboard');
    } else {
      setError(res.error || 'Failed to authenticate.');
      toast.error(res.error || 'Authentication error');
    }
  };


  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            {APP_CONFIG.appName}
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Business Owner Portal
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          Sign in to access your venue QR codes, analytics, and customer reviews
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-float rounded-3xl border border-slate-200/90 space-y-6">


          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Business Email"
              type="email"
              placeholder="owner@undergroundbar.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
            />

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
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
              Sign In to Dashboard
            </Button>
          </form>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
            <Link to="/admin/login" className="hover:text-primary transition-colors flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Platform Admin sign in</span>
            </Link>
            <Link to="/" className="hover:text-slate-900 transition-colors">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
