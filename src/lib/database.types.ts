export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          xp: number;
          level: number;
          streak: number;
          gem_currency: number;
          gender: string | null;
          target_gender: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          xp?: number;
          level?: number;
          streak?: number;
          gem_currency?: number;
          gender?: string | null;
          target_gender?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          xp?: number;
          level?: number;
          streak?: number;
          gem_currency?: number;
          gender?: string | null;
          target_gender?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      quest_progress: {
        Row: {
          id: string;
          user_id: string;
          node_id: string;
          status: string;
          score: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          node_id: string;
          status?: string;
          score?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          node_id?: string;
          status?: string;
          score?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      player_progress: {
        Row: {
          user_id: string;
          progress: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          progress: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          progress?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
