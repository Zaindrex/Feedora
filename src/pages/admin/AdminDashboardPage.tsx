import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  QrCode,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { databaseService } from '../../services/databaseService';
import { AnalyticsEvent, Business, UserProfile, AuditLog } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';

export const AdminDashboardPage: React.FC = () => {
  const [owners, setOwners] = useState<UserProfile[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [funnel, setFunnel] = useState({
    qrScans: 0,
    ratingsSelected: 0,
    feedbackSubmitted: 0,
    aiGenerated: 0,
    reviewsCopied: 0,
    googleClicks: 0,
  });

  useEffect(() => {
    let active = true;
    const from = new Date();
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    void Promise.all([
      databaseService.getProfiles('owner'),
      databaseService.getBusinesses(),
      databaseService.getAuditLogs(),
      databaseService.getAnalyticsEvents(undefined, { from: from.toISOString() }),
      databaseService.getFunnelStats(),
    ]).then(([ownerRows, businessRows, logs, events, funnelStats]) => {
      if (!active) return;
      setLoadError(null);
      setOwners(ownerRows);
      setBusinesses(businessRows);
      setAuditLogs(logs);
      setAnalyticsEvents(events);
      setFunnel(funnelStats);
    }).catch((error: unknown) => {
      console.error('Failed to load admin dashboard:', error);
      if (active) setLoadError(error instanceof Error ? error.message : 'Dashboard data is unavailable.');
    });
    return () => { active = false; };
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const platformTrendData = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - 6 + index);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const dayEvents = analyticsEvents.filter((event) => {
      const createdAt = new Date(event.created_at);
      return createdAt >= day && createdAt < nextDay;
    });

    return {
      day: day.toLocaleDateString(undefined, { weekday: 'short' }),
      scans: dayEvents.filter((event) => event.event_type === 'qr_scan').length,
      clicks: dayEvents.filter((event) => event.event_type === 'google_review_clicked').length,
    };
  });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Platform Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global system health, active venues, owner accounts, and conversion metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/owners">
            <Button variant="outline" size="sm" leftIcon={<Users className="w-4 h-4" />}>
              Manage Owners
            </Button>
          </Link>
          <Link to="/admin/businesses">
            <Button variant="primary" size="sm" leftIcon={<Building2 className="w-4 h-4" />}>
              Add Business
            </Button>
          </Link>
        </div>
      </div>

      {loadError && <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">{loadError}</p>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Owners"
          value={owners.length}
          change={`${owners.filter((o) => o.status === 'active').length} active`}
          isPositive={true}
          subtitle="Registered venue accounts"
          icon={<Users className="w-5 h-5 text-primary" />}
        />
        <StatCard
          title="Total Businesses"
          value={businesses.length}
          change={`${businesses.filter((b) => b.status === 'active').length} active`}
          isPositive={true}
          subtitle="Provisioned venues"
          icon={<Building2 className="w-5 h-5 text-primary" />}
        />
        <StatCard
          title="Platform QR Scans"
          value={funnel.qrScans}
          subtitle="Total scanned sessions"
          icon={<QrCode className="w-5 h-5 text-primary" />}
        />
        <StatCard
          title="Google Review Clicks"
          value={funnel.googleClicks}
          change={`${funnel.qrScans > 0 ? Math.round((funnel.googleClicks / funnel.qrScans) * 100) : 0}% intent`}
          isPositive={true}
          subtitle="High-intent referrals"
          icon={<ExternalLink className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Platform Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Platform-Wide Volume & Google Conversions
                </h3>
                <p className="text-xs text-slate-500">Aggregate scans and referral clicks across all client venues</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Total Scans
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Google Referrals
                </span>
              </div>
            </div>

            {platformTrendData.some((day) => day.scans > 0 || day.clicks > 0) ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={platformTrendData}>
                    <defs>
                      <linearGradient id="adminScans" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F917D" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0F917D" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="adminClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                    <Area type="monotone" dataKey="scans" stroke="#0F917D" strokeWidth={2} fill="url(#adminScans)" />
                    <Area type="monotone" dataKey="clicks" stroke="#10B981" strokeWidth={2} fill="url(#adminClicks)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={<QrCode className="w-5 h-5" />}
                title="No activity in the past 7 days"
                description="Scans and referral clicks will appear here as customers use venue QR codes."
                className="min-h-64"
              />
            )}
          </Card>
        </div>

        {/* System Health / Status */}
        <div className="lg:col-span-4">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Service Health</h3>
              <p className="text-xs text-slate-500 mb-5">Backend health monitoring</p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-medium text-slate-700">Live service checks are not configured.</p>
                <p className="text-[11px] text-slate-500 mt-1">No uptime or availability status is reported.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <Link to="/admin/settings">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Manage System Settings
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Businesses and Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Businesses Table Preview */}
        <div className="lg:col-span-7">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Client Businesses</h3>
                <p className="text-xs text-slate-500">Recently onboarded venues</p>
              </div>
              <Link to="/admin/businesses">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View All
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {businesses.slice(0, 5).map((biz) => (
                <div key={biz.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {biz.logo_url ? (
                      <img
                        src={biz.logo_url}
                        alt={biz.name}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold text-xs">
                        {biz.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">{biz.name}</h4>
                      <p className="text-[11px] text-slate-400">/{biz.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={biz.status === 'active' ? 'success' : 'destructive'} size="sm">
                      {biz.status}
                    </Badge>
                    <a
                      href={`/review/${biz.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-primary p-1"
                      title="Open review page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Audit Logs */}
        <div className="lg:col-span-5">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Recent Audit Trail</h3>
                <p className="text-xs text-slate-500">Security & administrative events</p>
              </div>
              <Link to="/admin/audit-logs">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    By {log.actor_name || 'Admin'} on {log.entity_type} ({log.entity_id.substring(0, 10)}...)
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
