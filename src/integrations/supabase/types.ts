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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      custom_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          status: string
          user_id: string
          verification_token: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          status?: string
          user_id: string
          verification_token?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          status?: string
          user_id?: string
          verification_token?: string
        }
        Relationships: []
      }
      custom_links: {
        Row: {
          click_count: number
          created_at: string
          id: string
          image_url: string | null
          position: number
          title: string
          url: string
          user_id: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          id?: string
          image_url?: string | null
          position?: number
          title: string
          url: string
          user_id: string
        }
        Update: {
          click_count?: number
          image_url?: string | null
          created_at?: string
          id?: string
          position?: number
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      link_clicks: {
        Row: {
          created_at: string
          id: string
          link_id: string
          session_token: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          link_id: string
          session_token?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          link_id?: string
          session_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "custom_links"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_themes: {
        Row: {
          accent_color: string
          background_url: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          particle_color: string | null
          user_id: string
        }
        Insert: {
          accent_color?: string
          background_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          particle_color?: string | null
          user_id: string
        }
        Update: {
          accent_color?: string
          background_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          particle_color?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          session_token: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          session_token: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accent_color: string
          avatar_url: string | null
          badges: string[]
          background_color: string
          background_url: string | null
          bio: string | null
          created_at: string
          cursor_url: string | null
          discord_id: string | null
          display_name: string | null
          entry_font: string
          entry_message: string | null
          font: string
          icon_color: string
          id: string
          monochrome_icons: boolean
          photo_url: string | null
          profile_blur: number
          profile_opacity: number
          song_art_url: string | null
          song_title: string | null
          show_volume_control: boolean
          song_url: string | null
          swap_box_colors: boolean
          text_color: string
          uid: number
          updated_at: string
          username: string
          video_url: string | null
          view_count: number
        }
        Insert: {
          accent_color?: string
          avatar_url?: string | null
          badges?: string[]
          background_color?: string
          background_url?: string | null
          bio?: string | null
          created_at?: string
          cursor_url?: string | null
          discord_id?: string | null
          display_name?: string | null
          entry_font?: string
          entry_message?: string | null
          font?: string
          icon_color?: string
          id: string
          monochrome_icons?: boolean
          photo_url?: string | null
          profile_blur?: number
          profile_opacity?: number
          song_art_url?: string | null
          song_title?: string | null
          show_volume_control?: boolean
          song_url?: string | null
          swap_box_colors?: boolean
          text_color?: string
          updated_at?: string
          username: string
          video_url?: string | null
          view_count?: number
        }
        Update: {
          accent_color?: string
          avatar_url?: string | null
          badges?: string[]
          background_color?: string
          background_url?: string | null
          bio?: string | null
          created_at?: string
          cursor_url?: string | null
          discord_id?: string | null
          display_name?: string | null
          entry_font?: string
          entry_message?: string | null
          font?: string
          icon_color?: string
          id?: string
          monochrome_icons?: boolean
          photo_url?: string | null
          profile_blur?: number
          profile_opacity?: number
          song_art_url?: string | null
          song_title?: string | null
          show_volume_control?: boolean
          song_url?: string | null
          swap_box_colors?: boolean
          text_color?: string
          updated_at?: string
          username?: string
          video_url?: string | null
          view_count?: number
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          id: string
          platform: string
          position: number
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          position?: number
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          position?: number
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bump_link_click: { Args: { link_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
