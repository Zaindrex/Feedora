import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { QRCodeCard } from '../../components/qr/QRCodeCard';
import { Business } from '../../types';

interface OwnerContextType {
  business: Business | null;
}

export const OwnerQRCodePage: React.FC = () => {
  const context = useOutletContext<OwnerContextType>();
  const activeBusiness = context?.business;

  if (!activeBusiness) {
    return (
      <div className="text-center py-12 text-slate-500">
        No active business profile found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">QR Code & Table Stands</h1>
        <p className="text-xs text-slate-500 mt-1">
          Generate, customize, download, or print QR codes to place on tables, receipts, or menus.
        </p>
      </div>

      <QRCodeCard business={activeBusiness} />
    </div>
  );
};
