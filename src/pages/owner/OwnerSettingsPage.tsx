import React, { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { Lock, Save } from 'lucide-react';

export const OwnerSettingsPage: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile({ name, phone });
      setIsSavingProfile(false);
      toast.success('Owner profile updated successfully.');
    } catch (error) {
      setIsSavingProfile(false);
      toast.error(error instanceof Error ? error.message : 'Could not update profile.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setIsUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully.');
    } catch (error) {
      setIsUpdatingPassword(false);
      toast.error(error instanceof Error ? error.message : 'Could not update password.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal profile and account credentials
        </p>
      </div>

      {/* Profile Form */}
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Personal Information
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              value={user?.email || ''}
              disabled
              helperText="Managed by platform administrator."
            />
          </div>

          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
          />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingProfile}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Update Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Password Management */}
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Security & Password
        </h3>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              isLoading={isUpdatingPassword}
              leftIcon={<Lock className="w-3.5 h-3.5" />}
            >
              Change Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
