import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, MessageSquare } from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { Business, Review } from '../../types';
import { StarRating } from '../../components/feedback/StarRating';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

interface OwnerContextType {
  business: Business | null;
}

export const OwnerReviewsPage: React.FC = () => {
  const context = useOutletContext<OwnerContextType>();
  const activeBusiness = context?.business;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!activeBusiness) return;
    void databaseService.getReviews(activeBusiness.id).then((rows) => {
      if (active) {
        setLoadError(null);
        setReviews(rows);
      }
    }).catch((error: unknown) => {
      console.error('Failed to load owner reviews:', error);
      if (active) setLoadError(error instanceof Error ? error.message : 'Reviews are unavailable.');
    });
    return () => { active = false; };
  }, [activeBusiness]);

  const filteredReviews = reviews.filter((r) => {
    if (filterRating !== 'all' && r.rating !== filterRating) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const textMatch = (r.final_review || r.generated_review || '').toLowerCase().includes(q);
      const tagMatch = (r.selected_tags || []).some((t) => t.toLowerCase().includes(q));
      const noteMatch = (r.feedback || '').toLowerCase().includes(q);
      return textMatch || tagMatch || noteMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Feedback & Reviews</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time feed of all ratings and AI-assisted reviews submitted by patrons
          </p>
        </div>
      </div>

      {loadError && <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">{loadError}</p>}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
        {/* Rating filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(['all', 5, 4, 3, 2, 1] as const).map((star) => (
            <button
              key={star}
              onClick={() => setFilterRating(star)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterRating === star
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {star === 'all' ? 'All Ratings' : `${star} ★`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search feedback or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <Card className="text-center py-12 text-slate-500">
          <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-700">No reviews matching your filter</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the star rating or search criteria.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <Card key={rev.id} hoverEffect className="p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <StarRating value={rev.rating} readOnly size="sm" />
                  <span className="text-xs font-bold text-slate-900">{rev.rating} of 5 Stars</span>
                </div>
                <div className="flex items-center gap-2">
                  {rev.copied_to_clipboard && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary-light text-primary">
                      ✓ Copied
                    </span>
                  )}
                  {rev.clicked_google && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Google Clicked
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {new Date(rev.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Tags & notes */}
              {rev.selected_tags && rev.selected_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {rev.selected_tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Final Review Draft */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 text-xs sm:text-sm text-slate-800 leading-relaxed">
                "{rev.final_review || rev.generated_review}"
              </div>

              {rev.feedback && (
                <p className="text-xs text-slate-500 italic">
                  Customer custom note: "{rev.feedback}"
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
