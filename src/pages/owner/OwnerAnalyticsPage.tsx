import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  QrCode,
  Star,
  Sparkles,
  Copy,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { databaseService } from '../../services/databaseService';
import { AnalyticsEvent, Business } from '../../types';
import { Card } from '../../components/ui/Card';

interface OwnerContextType {
  business: Business | null;
}

export const OwnerAnalyticsPage: React.FC = () => {
  const context = useOutletContext<OwnerContextType>();
  const activeBusiness = context?.business;

  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('7d');
  const [funnel, setFunnel] = useState({
    qrScans: 0,
    ratingsSelected: 0,
    feedbackSubmitted: 0,
    aiGenerated: 0,
    reviewsCopied: 0,
    googleClicks: 0,
  });
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!activeBusiness) return;
    const from = new Date();
    if (timeRange === 'today') from.setHours(0, 0, 0, 0);
    else if (timeRange === '7d') from.setDate(from.getDate() - 6);
    else if (timeRange === '30d') from.setDate(from.getDate() - 29);
    else if (timeRange === '90d') from.setDate(from.getDate() - 89);
    else from.setTime(0);
    const range = timeRange === 'all' ? undefined : { from: from.toISOString() };
    void Promise.all([
      databaseService.getFunnelStats(activeBusiness.id, range),
      databaseService.getAnalyticsEvents(activeBusiness.id, range),
    ]).then(([stats, activity]) => {
      if (!active) return;
      setLoadError(null);
      setFunnel(stats);
      setEvents(activity);
    }).catch((error: unknown) => {
      console.error('Failed to load owner analytics:', error);
      if (active) setLoadError(error instanceof Error ? error.message : 'Analytics data is unavailable.');
    });
    return () => { active = false; };
  }, [activeBusiness, timeRange]);

  // Funnel steps calculation
  const funnelSteps = [
    {
      label: 'QR Code Scanned',
      count: funnel.qrScans,
      pct: 100,
      icon: QrCode,
      color: 'bg-slate-900 text-white',
    },
    {
      label: 'Rating Selected',
      count: funnel.ratingsSelected,
      pct: funnel.qrScans > 0 ? Math.round((funnel.ratingsSelected / funnel.qrScans) * 100) : 0,
      icon: Star,
      color: 'bg-primary-light text-primary',
    },
    {
      label: 'AI Review Generated',
      count: funnel.aiGenerated,
      pct: funnel.ratingsSelected > 0 ? Math.round((funnel.aiGenerated / funnel.ratingsSelected) * 100) : 0,
      icon: Sparkles,
      color: 'bg-primary text-white',
    },
    {
      label: 'Review Copied',
      count: funnel.reviewsCopied,
      pct: funnel.aiGenerated > 0 ? Math.round((funnel.reviewsCopied / funnel.aiGenerated) * 100) : 0,
      icon: Copy,
      color: 'bg-teal-50 text-teal-700',
    },
    {
      label: 'Google Review Clicked',
      count: funnel.googleClicks,
      pct: funnel.reviewsCopied > 0 ? Math.round((funnel.googleClicks / funnel.reviewsCopied) * 100) : 0,
      icon: ExternalLink,
      color: 'bg-emerald-500 text-white',
    },
  ];

  // Daily multi-metric trend
  const bucketCount = timeRange === 'today' ? 1 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyPerformance = Array.from({ length: bucketCount }, (_, index) => {
    const dayStart = new Date(today);
    dayStart.setDate(today.getDate() - (bucketCount - index - 1));
    const nextDay = new Date(dayStart);
    nextDay.setDate(dayStart.getDate() + 1);
    const dayEvents = events.filter((event) => {
      const createdAt = new Date(event.created_at);
      return createdAt >= dayStart && createdAt < nextDay;
    });
    return {
      date: timeRange === 'today'
        ? 'Today'
        : dayStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      scans: dayEvents.filter((event) => event.event_type === 'qr_scan').length,
      ratings: dayEvents.filter((event) => event.event_type === 'rating_selected').length,
      googleClicks: dayEvents.filter((event) => event.event_type === 'google_review_clicked').length,
    };
  });

  return (
    <div className="space-y-8">
      {/* Header and Time Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Conversion Funnel & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Analyze customer drop-off and intent across every touchpoint
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80">
          {(
            [
              { key: 'today', label: 'Today' },
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' },
              { key: 'all', label: 'All Time' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeRange(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                timeRange === t.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">{loadError}</p>}

      {/* Conversion Funnel Cards */}
      <Card className="p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-6">
          End-to-End Customer Conversion Funnel
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {funnelSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.label}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-4 text-center"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Step {idx + 1}
                  </span>
                  <div className={`p-2 rounded-lg ${step.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">{step.count}</p>
                  <p className="text-xs font-medium text-slate-600 mt-1">{step.label}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-xs font-semibold text-emerald-600">
                    {step.pct}% conversion
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-primary-light/50 border border-primary/20 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-700 gap-2">
          <span>
            Overall Visitor to Google Review Click Rate:{' '}
            <strong className="text-primary font-bold">
              {funnel.qrScans > 0 ? Math.round((funnel.googleClicks / funnel.qrScans) * 100) : 0}%
            </strong>
          </span>
        </div>
      </Card>

      {/* Chart: Scans, Ratings & Google clicks */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Daily Volume & Customer Intent
            </h3>
            <p className="text-xs text-slate-500">Tracking scans against rating completion</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" /> QR Scans
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Ratings
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Google Clicks
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyPerformance}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#1E293B',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="scans" fill="#0F917D" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ratings" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="googleClicks" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
