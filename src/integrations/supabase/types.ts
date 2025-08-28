export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      billing_history: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          invoice_url: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          stripe_invoice_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          invoice_url?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          invoice_url?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      enterprise_features: {
        Row: {
          api_access: boolean | null
          created_at: string
          custom_branding: boolean | null
          data_retention_days: number | null
          dedicated_support: boolean | null
          id: string
          sso_enabled: boolean | null
          team_id: string | null
          updated_at: string
          white_label: boolean | null
        }
        Insert: {
          api_access?: boolean | null
          created_at?: string
          custom_branding?: boolean | null
          data_retention_days?: number | null
          dedicated_support?: boolean | null
          id?: string
          sso_enabled?: boolean | null
          team_id?: string | null
          updated_at?: string
          white_label?: boolean | null
        }
        Update: {
          api_access?: boolean | null
          created_at?: string
          custom_branding?: boolean | null
          data_retention_days?: number | null
          dedicated_support?: boolean | null
          id?: string
          sso_enabled?: boolean | null
          team_id?: string | null
          updated_at?: string
          white_label?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_features_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token: string | null
          connected_at: string | null
          connected_by: string | null
          created_at: string
          id: string
          is_connected: boolean | null
          platform: string
          refresh_token: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          platform: string
          refresh_token?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          platform?: string
          refresh_token?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          has_recording: boolean | null
          has_transcript: boolean | null
          host_id: string
          id: string
          languages_used: string[] | null
          meeting_url: string | null
          participant_count: number | null
          platform: string
          start_time: string | null
          status: string | null
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          has_recording?: boolean | null
          has_transcript?: boolean | null
          host_id: string
          id?: string
          languages_used?: string[] | null
          meeting_url?: string | null
          participant_count?: number | null
          platform: string
          start_time?: string | null
          status?: string | null
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          has_recording?: boolean | null
          has_transcript?: boolean | null
          host_id?: string
          id?: string
          languages_used?: string[] | null
          meeting_url?: string | null
          participant_count?: number | null
          platform?: string
          start_time?: string | null
          status?: string | null
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          default_language_from: string | null
          default_language_to: string | null
          first_name: string | null
          id: string
          last_name: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          default_language_from?: string | null
          default_language_to?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          default_language_from?: string | null
          default_language_to?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          billing_cycle_end: string | null
          billing_cycle_start: string | null
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_id: string | null
          subscription_tier: string | null
          trial_end: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_id?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_cycle_end?: string | null
          billing_cycle_start?: string | null
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_id?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          max_members: number | null
          max_minutes: number | null
          monthly_minutes_limit: number | null
          name: string
          owner_id: string
          plan_type: string | null
          subscription_tier: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          users_limit: number | null
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          max_members?: number | null
          max_minutes?: number | null
          monthly_minutes_limit?: number | null
          name: string
          owner_id: string
          plan_type?: string | null
          subscription_tier?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          users_limit?: number | null
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          max_members?: number | null
          max_minutes?: number | null
          monthly_minutes_limit?: number | null
          name?: string
          owner_id?: string
          plan_type?: string | null
          subscription_tier?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          users_limit?: number | null
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          created_at: string
          date: string
          id: string
          languages_used: string[] | null
          meetings_count: number | null
          minutes_used: number | null
          platforms_used: string[] | null
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          languages_used?: string[] | null
          meetings_count?: number | null
          minutes_used?: number | null
          platforms_used?: string[] | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          languages_used?: string[] | null
          meetings_count?: number | null
          minutes_used?: number | null
          platforms_used?: string[] | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_analytics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_team"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "admin" | "member" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "member", "viewer"],
    },
  },
} as const
