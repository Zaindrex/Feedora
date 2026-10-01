import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ExternalLink,
  RotateCcw,
  Edit3,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { databaseService, isDirectGoogleReviewUrl, isOptionalHttpUrl, PublicBusiness } from '../../services/databaseService';
import { aiService } from '../../services/aiService';
import { StarRating } from '../../components/feedback/StarRating';
import { Button } from '../../components/ui/Button';
import { RATING_PROMPTS, RATING_TAG_OPTIONS, APP_CONFIG } from '../../config';

export const CustomerReviewPage: React.FC = () => {
  const { businessSlug } = useParams<{ businessSlug: string }>();

  // State
  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [sessionId] = useState<string>(() => crypto.randomUUID());
  const [flowError, setFlowError] = useState<string | null>(null);
  const scanRecorded = useRef(false);

  // Review Steps State: 1: Rating, 2: Feedback Chips, 3: AI Loading, 4: Review Selection & Edit, 5: Post review
  const [step, setStep] = useState<'rate' | 'feedback' | 'generating' | 'drafts'>('rate');
  const [rating, setRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  // AI Review variations
  const [drafts, setDrafts] = useState<string[]>([]);
  const [selectedDraftIndex, setSelectedDraftIndex] = useState<number>(0);
  const [editingReview, setEditingReview] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isOpeningReview, setIsOpeningReview] = useState<boolean>(false);
  const reviewSaved = useRef(false);

  useEffect(() => {
    let active = true;
    if (!businessSlug) {
      setNotFound(true);
      setLoading(false);
      return () => { active = false; };
    }

    void databaseService.getBusinessBySlug(businessSlug).then(async (foundBiz) => {
      if (!foundBiz) {
        if (active) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }
      await databaseService.createReviewSession(foundBiz.id, sessionId);
      if (!active) return;
      setBusiness(foundBiz);
      setLoading(false);
      if (!scanRecorded.current) {
        scanRecorded.current = true;
        await databaseService.recordEvent(foundBiz.id, 'qr_scan', { slug: businessSlug }, sessionId);
      }
    }).catch((error: unknown) => {
      console.error('Failed to load customer review flow:', error);
      if (active) {
        setFlowError(error instanceof Error ? error.message : 'The review service is unavailable.');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [businessSlug, sessionId]);

  // Handle star rating selection
  const handleRatingSelect = (selectedStar: number) => {
    setRating(selectedStar);
    if (business) {
      void Promise.all([
        databaseService.updateReviewSession(sessionId, { rating: selectedStar, status: 'rated' }),
        databaseService.recordEvent(business.id, 'rating_selected', { rating: selectedStar }, sessionId),
      ]).catch((error: unknown) => setFlowError(error instanceof Error ? error.message : 'Could not save your rating.'));
    }
    // Auto advance to feedback chips after short tactile pause
    setTimeout(() => {
      setStep('feedback');
    }, 280);
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Generate AI reviews
  const handleGenerateReview = async () => {
    if (!business) return;

    setFlowError(null);
    setStep('generating');

    try {
      await databaseService.updateReviewSession(sessionId, {
        rating,
        feedback: customNote,
        status: 'feedback_given',
      });
      await Promise.all([
        databaseService.recordEvent(
          business.id,
          'feedback_submitted',
          { rating, tags: selectedTags, noteLength: customNote.length },
          sessionId
        ),
        databaseService.recordEvent(business.id, 'ai_generation_started', { rating }, sessionId),
      ]);
      const result = await aiService.generateReviews({
        businessId: business.id,
        sessionId,
        rating,
        tags: selectedTags,
        feedback: customNote,
      });

      setDrafts(result.drafts);
      setSelectedDraftIndex(0);
      setEditingReview(result.drafts[0] || '');
      setStep('drafts');
      await databaseService.updateReviewSession(sessionId, { status: 'review_generated' });
      await databaseService.recordEvent(
        business.id,
        'ai_generation_completed',
        { provider: result.provider, model: result.model, variationsCount: result.drafts.length },
        sessionId
      );
    } catch (err) {
      console.error('Failed to generate review:', err);
      setFlowError(err instanceof Error ? err.message : 'Review generation is temporarily unavailable.');
      setStep('feedback');
    }
  };

  const handlePostReview = async (destinationType: 'custom' | 'google') => {
    if (!business || !drafts.length || !editingReview.trim() || isOpeningReview) return;
    const reviewUrl = destinationType === 'custom' ? business.custom_review_url : business.google_review_url;
    const validUrl = destinationType === 'custom'
      ? isOptionalHttpUrl(reviewUrl) && Boolean(reviewUrl?.trim())
      : isDirectGoogleReviewUrl(reviewUrl || '');
    if (!validUrl || !reviewUrl) {
      setFlowError(destinationType === 'custom'
        ? 'This venue’s custom review website URL is invalid.'
        : 'This venue’s direct Google write-review link is not configured.');
      return;
    }

    const destination = window.open('about:blank', '_blank');
    if (!destination) {
      setFlowError('Allow pop-ups to continue to the review website.');
      return;
    }
    destination.opener = null;
    setIsOpeningReview(true);
    const finalContent = editingReview.trim();
    try {
      await navigator.clipboard.writeText(finalContent);
      if (!reviewSaved.current) {
        await databaseService.addReview({
          business_id: business.id,
          rating,
          feedback: customNote,
          selected_tags: selectedTags,
          generated_review: drafts[selectedDraftIndex] || finalContent,
          final_review: finalContent,
          session_id: sessionId,
          copied_to_clipboard: true,
          clicked_google: false,
        });
        reviewSaved.current = true;
      }
      await Promise.all([
        databaseService.updateReviewSession(sessionId, { status: 'copied' }),
        databaseService.recordEvent(business.id, 'review_copied', { reviewLength: finalContent.length, rating }, sessionId),
      ]);
      if (destinationType === 'google') {
        await databaseService.recordEvent(business.id, 'google_review_clicked', { rating }, sessionId);
        await databaseService.markGoogleReviewClicked(sessionId);
        await databaseService.updateReviewSession(sessionId, { status: 'completed' });
      }
      setFlowError(null);
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.75 }, colors: ['#0F917D', '#2dd4bf', '#f59e0b', '#3b82f6'] });
      destination.location.href = reviewUrl;
    } catch (error) {
      destination.close();
      setFlowError(error instanceof Error ? error.message : 'Could not prepare your review for posting.');
    } finally {
      setIsOpeningReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-slate-500">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading venue experience...</p>
      </div>
    );
  }

  if (notFound || !business) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Review Link Unavailable</h1>
        <p className="text-sm text-slate-500 max-w-sm mt-2">
          {flowError || 'This review experience is currently unavailable or the link may have expired.'}
        </p>
        <Link to="/" className="mt-6">
          <Button variant="outline" size="sm">
            Back to Homepage
          </Button>
        </Link>
      </div>
    );
  }

  const promptInfo = RATING_PROMPTS[rating] || {
    title: 'How was your experience?',
    subtitle: 'Tap the stars below to get started',
  };

  const tagList = RATING_TAG_OPTIONS[rating] || RATING_TAG_OPTIONS[5];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-primary-100">
      {/* Top Banner with subtle business header */}
      <header className="w-full max-w-xl mx-auto pt-8 pb-4 px-6 flex flex-col items-center text-center">
        {business.logo_url ? (
          <img
            src={business.logo_url}
            alt={business.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-premium border-2 border-white mb-3"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-premium mb-3">
            {business.name.charAt(0)}
          </div>
        )}

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {business.name}
        </h1>

        {business.address && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{business.address}</span>
          </div>
        )}
      </header>

      {/* Main Flow Container */}
      <main className="w-full max-w-lg mx-auto px-5 py-4 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-float relative overflow-hidden">
          {flowError && (
            <div role="alert" className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {flowError}
            </div>
          )}
          {/* STEP 1: Star Rating */}
          {step === 'rate' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Rate your visit
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  How was your experience?
                </h2>
                <p className="text-xs text-slate-500 mt-1.5">
                  Takes less than 30 seconds to share authentic feedback
                </p>
              </div>

              <div className="py-4">
                <StarRating
                  value={rating}
                  onChange={handleRatingSelect}
                  size="xl"
                  showLabel
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Tap 1 to 5 stars to continue
              </p>
            </motion.div>
          )}

          {/* STEP 2: Feedback Chips & Optional Note */}
          {step === 'feedback' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="inline-flex items-center gap-1 mb-2">
                  <StarRating value={rating} readOnly size="sm" />
                  <span className="text-xs font-semibold text-slate-600 ml-1">
                    ({rating}/5)
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{promptInfo.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{promptInfo.subtitle}</p>
              </div>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-2 justify-center py-2">
                {tagList.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 border ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20 scale-105'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {isSelected ? `✓ ${tag}` : tag}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  {showCustomInput ? 'Hide note' : '+ Something else'}
                </button>
              </div>

              {/* Optional Custom Note */}
              <AnimatePresence>
                {showCustomInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <textarea
                      placeholder="Add an optional specific note (e.g. loved the smoked cocktail, staff name)..."
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      maxLength={200}
                      rows={2}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Continue Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  onClick={handleGenerateReview}
                >
                  Create Review Draft with AI
                </Button>
                <button
                  type="button"
                  onClick={() => setStep('rate')}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
                >
                  Change star rating
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: AI Loading State */}
          {step === 'generating' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
                  <Sparkles className="w-8 h-8 animate-pulse text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping opacity-75" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Crafting your review...
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Synthesizing your feedback into natural, genuine Google review variations.
                </p>
              </div>

              <div className="flex gap-1.5 pt-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          {/* STEP 4: Review Selection, Editing, Copying & Google Flow */}
          {step === 'drafts' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <StarRating value={rating} readOnly size="sm" />
                  <span className="text-xs font-semibold text-slate-700">Your Review</span>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditing ? 'Done Editing' : 'Edit Review'}
                </button>
              </div>

              {/* Draft Variations Picker (if more than 1 option) */}
              {drafts.length > 1 && !isEditing && (
                <div className="flex gap-2">
                  {drafts.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSelectedDraftIndex(index);
                        setEditingReview(drafts[index]);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedDraftIndex === index
                          ? 'bg-primary-light text-primary border-primary/30 font-semibold'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Option {index + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Review Text Display / Edit Box */}
              <div className="relative">
                {isEditing ? (
                  <textarea
                    rows={4}
                    value={editingReview}
                    onChange={(e) => setEditingReview(e.target.value)}
                    className="w-full text-sm leading-relaxed p-4 rounded-2xl border-2 border-primary/30 bg-white focus:outline-none focus:border-primary text-slate-800"
                    placeholder="Refine your thoughts..."
                  />
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-sm leading-relaxed text-slate-800 font-normal relative">
                    <p>{editingReview}</p>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Reflects your genuine input</span>
                      <span>{editingReview.length} chars</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Regenerate */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateReview}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate variations</span>
                </button>
              </div>

              {/* Review destinations */}
              <div className="pt-2 space-y-3">
                {business.custom_review_url?.trim() && (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                    leftIcon={<ExternalLink className="w-5 h-5" />}
                    onClick={() => void handlePostReview('custom')}
                    disabled={isOpeningReview}
                  >
                    Post Review on Website
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-center border-slate-300 hover:bg-amber-50 hover:border-amber-400 text-slate-800 font-semibold"
                  leftIcon={<ExternalLink className="w-5 h-5 text-amber-500" />}
                  onClick={() => void handlePostReview('google')}
                  disabled={!drafts.length || !editingReview.trim() || isOpeningReview}
                >
                  Review us on Google
                </Button>
              </div>

              {/* Authenticity notice */}
              <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/60 text-center">
                <p className="text-[11px] text-amber-800/90 leading-tight">
                  <span className="font-semibold">Notice:</span> Feedora respects Google's policies. You paste and submit your own genuine review directly on Google.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="w-full max-w-xl mx-auto py-6 px-6 text-center">
        <p className="text-xs text-slate-400">
          Powered by{' '}
          <Link to="/" className="text-slate-600 hover:text-primary font-medium transition-colors">
            {APP_CONFIG.appName}
          </Link>
        </p>
      </footer>
    </div>
  );
};
