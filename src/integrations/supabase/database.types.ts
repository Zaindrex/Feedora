export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string | null;
          role: 'admin' | 'owner';
          status: 'active' | 'disabled';
          created_at: string;
          updated_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          phone?: string | null;
          role?: 'admin' | 'owner';
          status?: 'active' | 'disabled';
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          description: string | null;
          category: string;
          address: string | null;
          phone: string | null;
          website: string | null;
          google_review_url: string;
          custom_review_url: string | null;
          status: 'active' | 'disabled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          description?: string | null;
          category?: string;
          address?: string | null;
          phone?: string | null;
          website?: string | null;
          google_review_url: string;
          custom_review_url?: string | null;
          status?: 'active' | 'disabled';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['businesses']['Insert']>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          business_id: string;
          rating: number;
          feedback: string | null;
          selected_tags: string[];
          generated_review: string | null;
          final_review: string | null;
          session_id: string | null;
          copied_to_clipboard: boolean;
          clicked_google: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          rating: number;
          feedback?: string | null;
          selected_tags?: string[];
          generated_review?: string | null;
          final_review?: string | null;
          session_id?: string | null;
          copied_to_clipboard?: boolean;
          clicked_google?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
        Relationships: [];
      };
      review_sessions: {
        Row: {
          id: string;
          business_id: string;
          session_id: string;
          rating: number | null;
          feedback: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          session_id: string;
          rating?: number | null;
          feedback?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['review_sessions']['Insert']>;
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          business_id: string;
          session_id: string | null;
          event_type: 'qr_scan' | 'rating_selected' | 'feedback_submitted' | 'ai_generation_started' | 'ai_generation_completed' | 'review_copied' | 'google_review_clicked';
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          session_id?: string | null;
          event_type: Database['public']['Tables']['analytics_events']['Row']['event_type'];
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['analytics_events']['Insert']>;
        Relationships: [];
      };
      ai_generations: {
        Row: {
          id: string;
          business_id: string;
          session_id: string | null;
          rating: number;
          input: Json;
          output: Json;
          provider: string;
          model: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          session_id?: string | null;
          rating: number;
          input: Json;
          output: Json;
          provider?: string;
          model?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ai_generations']['Insert']>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          actor_name: string | null;
          actor_email: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          actor_name?: string | null;
          actor_email?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
        Relationships: [];
      };
      platform_settings: {
        Row: {
          id: string;
          product_name: string;
          primary_color: string;
          ai_provider: 'google' | 'gemini' | 'openai' | 'openrouter' | 'hybrid_synthesizer';
          ai_model: string;
          ai_temperature: number;
          max_output_length: number;
          enable_audit_logging: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_name: string;
          primary_color: string;
          ai_provider?: 'google' | 'gemini' | 'openai' | 'openrouter' | 'hybrid_synthesizer';
          ai_model: string;
          ai_temperature?: number;
          max_output_length?: number;
          enable_audit_logging?: boolean;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['platform_settings']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_business_by_slug: {
        Args: { p_slug: string };
        Returns: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          description: string | null;
          category: string;
          address: string | null;
          google_review_url: string;
          custom_review_url: string | null;
        }[];
      };
      update_public_review_session: {
        Args: { p_session_id: string; p_rating: number | null; p_feedback: string | null; p_status: string | null };
        Returns: undefined;
      };
      start_public_review_session: {
        Args: { p_business_id: string; p_session_id: string };
        Returns: boolean;
      };
      mark_google_review_clicked: {
        Args: { p_session_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
