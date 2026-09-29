import { requirePublicSupabase } from '../integrations/supabase/client';

export interface GeneratedReviewResult {
  drafts: string[];
  provider: string;
  model: string;
}

export const aiService = {
  async generateReviews(options: {
    businessId: string;
    sessionId: string;
    rating: number;
    tags: string[];
    feedback?: string;
  }): Promise<GeneratedReviewResult> {
    const { data, error } = await requirePublicSupabase().functions.invoke<GeneratedReviewResult>('generate-review', {
      body: {
        business_id: options.businessId,
        session_id: options.sessionId,
        rating: options.rating,
        selected_tags: options.tags,
        feedback: options.feedback,
      },
    });

    if (error) throw new Error(error.message || 'Review generation is temporarily unavailable.');
    if (!data || !Array.isArray(data.drafts) || data.drafts.length !== 3 || data.drafts.some((draft) => typeof draft !== 'string')) {
      throw new Error('Review generation returned an invalid response. Please try again.');
    }
    return data;
  },
};
