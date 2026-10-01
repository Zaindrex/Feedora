export type UserRole = 'admin' | 'owner';
export type UserStatus = 'active' | 'disabled';
export type BusinessStatus = 'active' | 'disabled';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  category: string;
  address?: string;
  phone?: string;
  website?: string;
  google_review_url: string;
  custom_review_url?: string | null;
  status: BusinessStatus;
  created_at: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  business_id: string;
  rating: number; // 1-5
  feedback?: string;
  selected_tags: string[];
  generated_review?: string;
  final_review?: string;
  session_id?: string;
  copied_to_clipboard?: boolean;
  clicked_google?: boolean;
  created_at: string;
}

export interface ReviewSession {
  id: string;
  business_id: string;
  session_id: string;
  rating?: number;
  feedback?: string;
  status: 'started' | 'rated' | 'feedback_given' | 'review_generated' | 'copied' | 'completed';
  created_at: string;
}

export type AnalyticsEventType =
  | 'qr_scan'
  | 'rating_selected'
  | 'feedback_submitted'
  | 'ai_generation_started'
  | 'ai_generation_completed'
  | 'review_copied'
  | 'google_review_clicked';

export interface AnalyticsEvent {
  id: string;
  business_id: string;
  session_id?: string;
  event_type: AnalyticsEventType;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AIGenerationRecord {
  id: string;
  business_id: string;
  session_id?: string;
  rating: number;
  input: {
    tags: string[];
    feedback?: string;
  };
  output: string[];
  provider: string;
  model: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  actor_name?: string;
  actor_email?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PlatformSettings {
  productName: string;
  primaryColor: string;
  aiProvider: 'google' | 'gemini' | 'openai' | 'openrouter' | 'hybrid_synthesizer';
  aiModel: string;
  aiTemperature: number;
  maxOutputLength: number;
  enableAuditLogging: boolean;
}

export interface FunnelStats {
  qrScans: number;
  ratingsSelected: number;
  feedbackSubmitted: number;
  aiGenerated: number;
  reviewsCopied: number;
  googleClicks: number;
}
