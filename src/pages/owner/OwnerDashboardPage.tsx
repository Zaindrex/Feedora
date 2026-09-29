import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  QrCode,
  Star,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useAuth } from '../../features/auth/AuthContext';
import { databaseService } from '../../services/databaseService';
import { AnalyticsEvent, Business, Review, ReviewSession } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StarRating } from '../../components/feedback/StarRating';

interface OwnerContextType {
  business: Business | null;
}

export const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const context = useOutletContext<OwnerContextType>();
  const activeBusiness = context?.business;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSessions, setReviewSessions] = useState<ReviewSession[]>([]);
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
    if (!activeBusiness) return;
    const from = new Date();
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    void Promise.all([
      databaseService.getReviews(activeBusiness.id),
      databaseService.getReviewSessions(activeBusiness.id),
      databaseService.getFunnelStats(activeBusiness.id),
      databaseService.getAnalyticsEvents(activeBusiness.id, { from: from.toISOString() }),
    ]).then(([reviewRows, sessions, funnelStats, events]) => {
      if (!active) return;
      setLoadError(null);
      setReviews(reviewRows);
      setReviewSessions(sessions);
      setFunnel(funnelStats);
      setAnalyticsEvents(events);
    }).catch((error: unknown) => {
      console.error('Failed to load owner dashboard:', error);
      if (active) setLoadError(error instanceof Error ? error.message : 'Dashboard data is unavailable.');
    });
    return () => { active = false; };
  }, [activeBusiness]);

  // Greeting by hour
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Calculate Average Rating
  const ratingSessions = reviewSessions.filter((session) => session.rating !== null);
  const averageRating = ratingSessions.length > 0
    ? `${(ratingSessions.reduce((acc, session) => acc + (session.rating || 0), 0) / ratingSessions.length).toFixed(1)} ★`
    : '—';

  // Star Distribution
  const starCounts = [5, 4, 3, 2, 1].map((s) => {
    const count = ratingSessions.filter((session) => session.rating === s).length;
    return {
      star: `${s} ★`,
      count,
      percent: ratingSessions.length > 0 ? Math.round((count / ratingSessions.length) * 100) : 0,
    };
  });

  // 7-day timeline data for chart
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trendData = Array.from({ length: 7 }, (_, index) => {
    const dayStart = new Date(today);
    dayStart.setDate(today.getDate() - 6 + index);
    const nextDay = new Date(dayStart);
    nextDay.setDate(dayStart.getDate() + 1);
    const dayEvents = analyticsEvents.filter((event) => {
      const createdAt = new Date(event.created_at);
      return createdAt >= dayStart && createdAt < nextDay;
    });
    return {
      day: dayStart.toLocaleDateString(undefined, { weekday: 'short' }),
      scans: dayEvents.filter((event) => event.event_type === 'qr_scan').length,
      clicks: dayEvents.filter((event) => event.event_type === 'google_review_clicked').length,
    };
  });

  const STAR_COLORS = ['#0F917D', '#2dd4bf', '#f59e0b', '#f97316', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {greeting}, {user?.name || 'Owner'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Here is your live feedback activity and Google review conversion for{' '}
            <span className="font-semibold text-slate-700">
              {activeBusiness?.name || 'your venue'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/owner/qr">
            <Button variant="primary" size="sm" leftIcon={<QrCode className="w-4 h-4" />}>
              View & Print QR Code
            </Button>
          </Link>
        </div>
      </div>

      {loadError && <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">{loadError}</p>}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total QR Scans"
          value={funnel.qrScans}
          subtitle="Visitors who opened review link"
          icon={<QrCode className="w-5 h-5 text-primary" />}
        />
        <StatCard
          title="Average Rating"
          value={averageRating}
          change={ratingSessions.length ? `${ratingSessions.length} ratings` : undefined}
          subtitle="Overall customer satisfaction"
          icon={<Star className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title="AI Reviews Drafted"
          value={funnel.aiGenerated}
          change={`${funnel.qrScans > 0 ? Math.round((funnel.aiGenerated / funnel.qrScans) * 100) : 0}% rate`}
          isPositive={true}
          subtitle="Customers assisted by AI"
          icon={<Sparkles className="w-5 h-5 text-primary" />}
        />
        <StatCard
          title="Google Review Clicks"
          value={funnel.googleClicks}
          change={`${funnel.aiGenerated > 0 ? Math.round((funnel.googleClicks / funnel.aiGenerated) * 100) : 0}% intent`}
          isPositive={true}
          subtitle="Proceeded to Google review URL"
          icon={<ExternalLink className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  QR Scans vs Google Review Clicks
                </h3>
                <p className="text-xs text-slate-500">Weekly traffic & high-intent conversion</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Scans
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Google Clicks
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="scansGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F917D" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0F917D" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
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
                  <Area
                    type="monotone"
                    dataKey="scans"
                    stroke="#0F917D"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#scansGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#clicksGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Rating Breakdown Bar Chart */}
        <div className="lg:col-span-4">
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Rating Distribution</h3>
              <p className="text-xs text-slate-500 mb-6">Customer sentiment breakdown</p>

              <div className="space-y-3">
                {starCounts.map((item, idx) => (
                  <div key={item.star} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.star}</span>
                      <span className="text-slate-400">
                        {item.count} ({item.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor: STAR_COLORS[idx],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Total Recorded Ratings</span>
              <span className="font-bold text-slate-800">{ratingSessions.length}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Customer Feedback */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Recent Customer Feedback & Reviews
            </h3>
            <p className="text-xs text-slate-500">Live feed from table QR scans</p>
          </div>
          <Link to="/owner/reviews">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All Reviews
            </Button>
          </Link>
        </div>

        {reviews.length === 0 && !reviewSessions.some((session) => session.feedback) ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No customer reviews have been recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {reviewSessions
              .filter((session) => session.feedback && !reviews.some((review) => review.session_id === session.session_id))
              .slice(0, 4)
              .map((session) => (
                <div key={session.id} className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    {session.rating ? <StarRating value={session.rating} readOnly size="sm" /> : <span className="text-xs text-slate-500">Customer feedback</span>}
                    <span className="text-xs text-slate-400">{new Date(session.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p className="text-xs text-slate-600">{session.feedback}</p>
                </div>
              ))}
            {reviews.slice(0, 4).map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StarRating value={rev.rating} readOnly size="sm" />
                    <span className="text-xs font-semibold text-slate-700">
                      {rev.rating} of 5 Stars
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {rev.copied_to_clipboard && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-light text-primary">
                        Review Copied
                      </span>
                    )}
                    {rev.clicked_google && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Google Review Clicked
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {new Date(rev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {rev.selected_tags && rev.selected_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {rev.selected_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-100">
                  "{rev.final_review || rev.generated_review}"
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
