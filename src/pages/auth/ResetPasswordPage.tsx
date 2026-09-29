import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Save, Sparkles } from 'lucide-react';
import { requireSupabase } from '../../integrations/supabase/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { APP_CONFIG } from '../../config';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const { error: updateError } = await requireSupabase().auth.updateUser({ password });
      if (updateError) throw updateError;
      toast.success('Password updated. Sign in with your new password.');
      await requireSupabase().auth.signOut();
      navigate('/login', { replace: true });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'The password reset link is invalid or expired.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">{APP_CONFIG.appName}</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set a new password</h1>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <form onSubmit={handleSubmit} className="bg-white py-8 px-6 sm:px-10 shadow-float rounded-3xl border border-slate-200/90 space-y-4">
          <Input
            label="New Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            minLength={8}
          />
          <Input
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            minLength={8}
          />
          {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
          <Button type="submit" variant="primary" size="lg" className="w-full justify-center" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
};
