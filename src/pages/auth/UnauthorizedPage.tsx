import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';

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
