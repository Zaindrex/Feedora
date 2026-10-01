import type { User } from '@supabase/supabase-js';
import type { AnalyticsEvent, AuditLog, Business, FunnelStats, PlatformSettings, Review, ReviewSession, UserProfile } from '../types';
import { DEFAULT_PLATFORM_SETTINGS } from '../config';
import { requirePublicSupabase, requireSupabase } from '../integrations/supabase/client';
import type { Json } from '../integrations/supabase/database.types';

type BusinessWrite = Omit<Business, 'id' | 'created_at' | 'updated_at'>;
type ReviewWrite = Omit<Review, 'id' | 'created_at'>;
type EventRange = { from?: string; to?: string };

export interface PublicBusiness {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  category: string;
  address: string | null;
  google_review_url: string;
  custom_review_url: string | null;
  status: 'active';
}

function unwrap<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export function isDirectGoogleReviewUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' &&
      url.hostname === 'search.google.com' &&
      url.pathname === '/local/writereview' &&
      Boolean(url.searchParams.get('placeid')?.trim());
  } catch {
    return false;
  }
}

export function isOptionalHttpUrl(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function toSettings(row: {
  product_name: string;
  primary_color: string;
  ai_provider: PlatformSettings['aiProvider'];
  ai_model: string;
  ai_temperature: number;
  max_output_length: number;
  enable_audit_logging: boolean;
}): PlatformSettings {
  return {
    productName: row.product_name,
    primaryColor: row.primary_color,
    aiProvider: row.ai_provider === 'gemini' ? 'google' : row.ai_provider,
    aiModel: row.ai_model,
    aiTemperature: Number(row.ai_temperature),
    maxOutputLength: row.max_output_length,
    enableAuditLogging: row.enable_audit_logging,
  };
}

async function countEvents(eventType: AnalyticsEvent['event_type'], businessId?: string, range?: EventRange): Promise<number> {
  let query = requireSupabase()
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', eventType);
  if (businessId) query = query.eq('business_id', businessId);
  if (range?.from) query = query.gte('created_at', range.from);
  if (range?.to) query = query.lt('created_at', range.to);
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  return result.count || 0;
}

async function deleteAdminEntity(entity: 'owner' | 'business', id: string): Promise<{ auditWarning?: string }> {
  const result = await requireSupabase().functions.invoke<{ deleted: boolean; auditWarning?: string }>('admin-delete', {
    body: { entity, id },
  });
  if (result.error) {
    const response = result.error.context;
    if (response instanceof Response) {
      const payload = await response.clone().json().catch(() => null) as { error?: unknown } | null;
      if (typeof payload?.error === 'string') throw new Error(payload.error);
    }
    throw new Error(result.error.message);
  }
  if (!result.data?.deleted) throw new Error(`The ${entity} was not deleted.`);
  return { auditWarning: result.data.auditWarning };
}

export const databaseService = {
  async getProfileByUserId(userId: string): Promise<UserProfile | null> {
    const result = await requireSupabase().from('profiles').select('*').eq('user_id', userId).maybeSingle();
    return unwrap(result) as UserProfile | null;
  },

  async getProfiles(role?: UserProfile['role']): Promise<UserProfile[]> {
    let query = requireSupabase().from('profiles').select('*').order('created_at', { ascending: false });
    if (role) query = query.eq('role', role);
    return unwrap(await query) as UserProfile[];
  },

  async updateProfile(profileId: string, updates: Pick<UserProfile, 'name' | 'phone'>): Promise<UserProfile> {
    const result = await requireSupabase().from('profiles').update(updates).eq('id', profileId).select('*').single();
    return unwrap(result) as UserProfile;
  },

  async createOwner(data: { name: string; email: string; phone?: string; businessId?: string; password?: string }): Promise<UserProfile> {
    const result = await requireSupabase().functions.invoke<{ profile: UserProfile }>('create-owner', { body: data });
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error('Owner creation returned no profile.');
    return result.data.profile;
  },

  async deleteOwner(ownerId: string): Promise<{ auditWarning?: string }> {
    return deleteAdminEntity('owner', ownerId);
  },

  async toggleOwnerStatus(ownerId: string): Promise<UserProfile> {
    const client = requireSupabase();
    const current = unwrap(await client.from('profiles').select('status').eq('id', ownerId).single());
    if (!current) throw new Error('Owner profile was not found.');
    const status = current.status === 'active' ? 'disabled' : 'active';
    const result = await client.functions.invoke<{ profile: UserProfile }>('manage-owner', {
      body: { action: 'set-status', profileId: ownerId, status },
    });
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error('Owner status update returned no profile.');
    return result.data.profile;
  },

  async sendOwnerPasswordReset(email: string): Promise<void> {
    const configuredAppUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
    const appBaseUrl = !import.meta.env.DEV && configuredAppUrl
      ? configuredAppUrl
      : `${window.location.origin}${import.meta.env.BASE_URL}`;
    const result = await requireSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${appBaseUrl.replace(/\/+$/, '')}/reset-password`,
    });
    if (result.error) throw new Error(result.error.message);
  },

  async getBusinesses(ownerId?: string): Promise<Business[]> {
    let query = requireSupabase().from('businesses').select('*').order('created_at', { ascending: false });
    if (ownerId) query = query.eq('owner_id', ownerId);
    return unwrap(await query) as Business[];
  },

  async getBusinessBySlug(slug: string): Promise<PublicBusiness | null> {
    const result = await requirePublicSupabase().rpc('get_public_business_by_slug', { p_slug: slug });
    const row = unwrap(result)?.[0];
    return row ? { ...row, status: 'active' } : null;
  },

  async getBusinessById(id: string): Promise<Business | null> {
    const result = await requireSupabase().from('businesses').select('*').eq('id', id).maybeSingle();
    return unwrap(result) as Business | null;
  },

  async getBusinessesByOwnerId(ownerId: string): Promise<Business[]> {
    return this.getBusinesses(ownerId);
  },

  async saveBusiness(business: Business): Promise<Business> {
    const result = await requireSupabase().from('businesses').update({
      name: business.name,
      slug: business.slug,
      logo_url: business.logo_url,
      description: business.description,
      category: business.category,
      address: business.address,
      phone: business.phone,
      website: business.website,
      google_review_url: business.google_review_url,
      custom_review_url: business.custom_review_url?.trim() || null,
    }).eq('id', business.id).select('*').single();
    return unwrap(result) as Business;
  },

  async createBusiness(businessData: BusinessWrite): Promise<Business> {
    const result = await requireSupabase().from('businesses').insert(businessData).select('*').single();
    const business = unwrap(result) as Business;
    await this.addAuditLog({
      action: 'CREATE_BUSINESS',
      entity_type: 'business',
      entity_id: business.id,
      metadata: { name: business.name, slug: business.slug },
    });
    return business;
  },

  async deleteBusiness(businessId: string): Promise<{ auditWarning?: string }> {
    return deleteAdminEntity('business', businessId);
  },

  async toggleBusinessStatus(businessId: string): Promise<Business | null> {
    const client = requireSupabase();
    const current = unwrap(await client.from('businesses').select('status').eq('id', businessId).single());
    if (!current) throw new Error('Business was not found.');
    const status = current.status === 'active' ? 'disabled' : 'active';
    const result = await client.functions.invoke<{ business: Business }>('manage-business', {
      body: { businessId, status },
    });
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error('Business status update returned no business.');
    return result.data.business;
  },

  async getReviews(businessId?: string): Promise<Review[]> {
    let query = requireSupabase().from('reviews').select('*').order('created_at', { ascending: false });
    if (businessId) query = query.eq('business_id', businessId);
    return unwrap(await query) as Review[];
  },

  async getReviewSessions(businessId: string): Promise<ReviewSession[]> {
    const result = await requireSupabase()
      .from('review_sessions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    return unwrap(result) as ReviewSession[];
  },

  async addReview(reviewData: ReviewWrite): Promise<void> {
    const result = await requirePublicSupabase().from('reviews').insert(reviewData);
    if (result.error) throw new Error(result.error.message);
  },

  async createReviewSession(businessId: string, sessionId: string): Promise<void> {
    const result = await requirePublicSupabase().rpc('start_public_review_session', {
      p_business_id: businessId,
      p_session_id: sessionId,
    });
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error('Could not start a review session for this venue.');
  },

  async updateReviewSession(sessionId: string, updates: { rating?: number; feedback?: string; status?: string }): Promise<void> {
    const result = await requirePublicSupabase().rpc('update_public_review_session', {
      p_session_id: sessionId,
      p_rating: updates.rating ?? null,
      p_feedback: updates.feedback ?? null,
      p_status: updates.status ?? null,
    });
    if (result.error) throw new Error(result.error.message);
  },

  async recordEvent(
    businessId: string,
    eventType: AnalyticsEvent['event_type'],
    metadata: Record<string, unknown> = {},
    sessionId?: string
  ): Promise<void> {
    const result = await requirePublicSupabase().from('analytics_events').insert({
      business_id: businessId,
      session_id: sessionId,
      event_type: eventType,
      metadata: metadata as Json,
    });
    if (result.error) throw new Error(result.error.message);
  },

  async markGoogleReviewClicked(sessionId: string): Promise<void> {
    const result = await requirePublicSupabase().rpc('mark_google_review_clicked', { p_session_id: sessionId });
    if (result.error) throw new Error(result.error.message);
  },

  async getAnalyticsEvents(businessId?: string, range?: EventRange): Promise<AnalyticsEvent[]> {
    let query = requireSupabase().from('analytics_events').select('*').order('created_at', { ascending: true });
    if (businessId) query = query.eq('business_id', businessId);
    if (range?.from) query = query.gte('created_at', range.from);
    if (range?.to) query = query.lt('created_at', range.to);
    return unwrap(await query) as unknown as AnalyticsEvent[];
  },

  async getFunnelStats(businessId?: string, range?: EventRange): Promise<FunnelStats> {
    const [qrScans, ratingsSelected, feedbackSubmitted, aiGenerated, reviewsCopied, googleClicks] = await Promise.all([
      countEvents('qr_scan', businessId, range),
      countEvents('rating_selected', businessId, range),
      countEvents('feedback_submitted', businessId, range),
      countEvents('ai_generation_completed', businessId, range),
      countEvents('review_copied', businessId, range),
      countEvents('google_review_clicked', businessId, range),
    ]);
    return { qrScans, ratingsSelected, feedbackSubmitted, aiGenerated, reviewsCopied, googleClicks };
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const result = await requireSupabase().from('audit_logs').select('*').order('created_at', { ascending: false });
    return unwrap(result) as AuditLog[];
  },

  async addAuditLog(log: Pick<AuditLog, 'action' | 'entity_type' | 'entity_id' | 'metadata'>): Promise<void> {
    const client = requireSupabase();
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw new Error(authError.message);
    const user: User | null = authData.user;
    const actor = user ? await this.getProfileByUserId(user.id) : null;
    const result = await client.from('audit_logs').insert({
      actor_user_id: user?.id,
      actor_name: actor?.name,
      actor_email: actor?.email,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      metadata: log.metadata as Json | undefined,
    });
    if (result.error) throw new Error(result.error.message);
  },

  async getSettings(): Promise<PlatformSettings> {
    const result = await requireSupabase().from('platform_settings').select('*').eq('id', 'default').maybeSingle();
    const row = unwrap(result);
    return row ? toSettings(row) : DEFAULT_PLATFORM_SETTINGS;
  },

  async saveSettings(settings: PlatformSettings): Promise<void> {
    const result = await requireSupabase().from('platform_settings').upsert({
      id: 'default',
      product_name: settings.productName,
      primary_color: settings.primaryColor,
      ai_provider: settings.aiProvider,
      ai_model: settings.aiModel,
      ai_temperature: settings.aiTemperature,
      max_output_length: settings.maxOutputLength,
      enable_audit_logging: settings.enableAuditLogging,
      updated_at: new Date().toISOString(),
    });
    if (result.error) throw new Error(result.error.message);
  },
};
