import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Star,
  Sparkles,
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
import { AnalyticsEvent } from '../../types';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';

export const AdminAnalyticsPage: React.FC = () => {
  const [funnel, setFunnel] = useState({
    qrScans: 0,
    ratingsSelected: 0,
    feedbackSubmitted: 0,
    aiGenerated: 0,
    reviewsCopied: 0,
    googleClicks: 0,
  });
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const from = new Date();
    from.setDate(from.getDate() - 27);
    from.setHours(0, 0, 0, 0);
    void Promise.all([
      databaseService.getFunnelStats(),
      databaseService.getAnalyticsEvents(undefined, { from: from.toISOString() }),
    ]).then(([stats, events]) => {
      if (!active) return;
      setLoadError(null);
      setFunnel(stats);
      setAnalyticsEvents(events);
    }).catch((error: unknown) => {
      console.error('Failed to load platform analytics:', error);
      if (active) setLoadError(error instanceof Error ? error.message : 'Analytics data is unavailable.');
    });
    return () => { active = false; };
  }, []);

  const currentWeekStart = new Date();
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
  currentWeekStart.setHours(0, 0, 0, 0);
  const weeklyTraffic = Array.from({ length: 4 }, (_, index) => {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - (3 - index) * 7);
    const nextWeek = new Date(weekStart);
    nextWeek.setDate(weekStart.getDate() + 7);
    const weekEvents = analyticsEvents.filter((event) => {
      const createdAt = new Date(event.created_at);
      return createdAt >= weekStart && createdAt < nextWeek;
    });

    return {
      name: weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      scans: weekEvents.filter((event) => event.event_type === 'qr_scan').length,
      aiGenerated: weekEvents.filter((event) => event.event_type === 'ai_generation_completed').length,
      googleClicks: weekEvents.filter((event) => event.event_type === 'google_review_clicked').length,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Global Analytics & Conversion Telemetry
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          High-resolution funnel metrics across all registered venues
        </p>
      </div>

      {loadError && <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">{loadError}</p>}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Scans"
          value={funnel.qrScans}
          subtitle="QR sessions initiated"
          icon={<QrCode className="w-5 h-5 text-primary" />}
        />
        <StatCard
          title="Rating Submissions"
          value={funnel.ratingsSelected}
          change={`${funnel.qrScans > 0 ? Math.round((funnel.ratingsSelected / funnel.qrScans) * 100) : 0}% rate`}
          isPositive={true}
          subtitle="Completed 1-5 star ratings"
          icon={<Star className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title="AI Synthesis Calls"
          value={funnel.aiGenerated}
          subtitle="Unique review drafts built"
          icon={<Sparkles className="w-5 h-5 text-primary" />}
        />
        <StatCard
          title="Google Referrals"
          value={funnel.googleClicks}
          change={`${funnel.aiGenerated > 0 ? Math.round((funnel.googleClicks / funnel.aiGenerated) * 100) : 0}% rate`}
          isPositive={true}
          subtitle="Outbound Google reviews clicks"
          icon={<ExternalLink className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <Card className="p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Weekly Activity
            </h3>
            <p className="text-xs text-slate-500 mb-6">Recorded events across all venues for the past 4 weeks</p>

            {weeklyTraffic.some((week) => week.scans || week.aiGenerated || week.googleClicks) ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyTraffic}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                    <Bar dataKey="scans" fill="#0F917D" radius={[4, 4, 0, 0]} name="QR Scans" />
                    <Bar dataKey="aiGenerated" fill="#2dd4bf" radius={[4, 4, 0, 0]} name="AI Drafts" />
                    <Bar dataKey="googleClicks" fill="#10B981" radius={[4, 4, 0, 0]} name="Google Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={<QrCode className="w-5 h-5" />}
                title="No activity in the past 4 weeks"
                description="Scans, review drafts, and referrals will appear here as events are recorded."
                className="min-h-64"
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
