import React, { useState, useEffect } from 'react';
import { Search, Building2 } from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { Business, Review } from '../../types';
import { StarRating } from '../../components/feedback/StarRating';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBizId, setSelectedBizId] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([databaseService.getReviews(), databaseService.getBusinesses()]).then(([reviewRows, businessRows]) => {
      if (!active) return;
      setLoadError(null);
      setReviews(reviewRows);
      setBusinesses(businessRows);
    }).catch((error: unknown) => {
      console.error('Failed to load admin reviews:', error);
      if (active) setLoadError(error instanceof Error ? error.message : 'Reviews are unavailable.');
    });
    return () => { active = false; };
  }, []);

  const filtered = reviews.filter((r) => {
    if (selectedBizId !== 'all' && r.business_id !== selectedBizId) return false;
    if (filterRating !== 'all' && r.rating !== filterRating) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const text = (r.final_review || r.generated_review || '').toLowerCase();
      return text.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Global Customer Reviews Feed
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Platform-wide feed of all customer ratings and AI review drafts across all venues
        </p>
      </div>

      {loadError && <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">{loadError}</p>}

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="w-48">
            <Select
              value={selectedBizId}
              onChange={(e) => setSelectedBizId(e.target.value)}
              options={[
                { value: 'all', label: 'All Venues' },
                ...businesses.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
          </div>

          <div className="flex items-center gap-1">
            {(['all', 5, 4, 3, 2, 1] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterRating(s)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                  filterRating === s ? 'bg-primary text-white' : 'bg-slate-50 text-slate-600 border'
                }`}
              >
                {s === 'all' ? 'All' : `${s}★`}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search review drafts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Reviews Table / Cards */}
      <div className="space-y-4">
        {filtered.map((rev) => {
          const biz = businesses.find((b) => b.id === rev.business_id);
          return (
            <Card key={rev.id} hoverEffect className="p-5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-xs text-slate-800">{biz?.name || 'Venue'}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <StarRating value={rev.rating} readOnly size="sm" />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {rev.copied_to_clipboard && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary">
                      Copied
                    </span>
                  )}
                  {rev.clicked_google && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      Google Clicked
                    </span>
                  )}
                  <span className="text-slate-400">
                    {new Date(rev.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {rev.selected_tags && rev.selected_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {rev.selected_tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-slate-50 border rounded text-[11px] text-slate-600">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                "{rev.final_review || rev.generated_review}"
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
