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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          admin_notes: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          current_photo_url: string | null
          email: string | null
          full_name: string
          government_id_url: string | null
          guarantor_name: string | null
          guarantor_phone: string | null
          guarantor_relationship: string | null
          id: string
          nin: string | null
          phone: string | null
          preferences: string[] | null
          proof_of_admission_url: string | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          admin_notes?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          current_photo_url?: string | null
          email?: string | null
          full_name: string
          government_id_url?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          guarantor_relationship?: string | null
          id?: string
          nin?: string | null
          phone?: string | null
          preferences?: string[] | null
          proof_of_admission_url?: string | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          admin_notes?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          current_photo_url?: string | null
          email?: string | null
          full_name?: string
          government_id_url?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          guarantor_relationship?: string | null
          id?: string
          nin?: string | null
          phone?: string | null
          preferences?: string[] | null
          proof_of_admission_url?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          client_id: string | null
          commission_type: string
          created_at: string
          id: string
          match_id: string | null
          notes: string | null
          property_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          client_id?: string | null
          commission_type?: string
          created_at?: string
          id?: string
          match_id?: string | null
          notes?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          commission_type?: string
          created_at?: string
          id?: string
          match_id?: string | null
          notes?: string | null
          property_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          created_at: string
          description: string
          id: string
          notes: string | null
          priority: string
          property_id: string
          room_type_id: string | null
          status: string
          tenant_name: string
          tenant_phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          notes?: string | null
          priority?: string
          property_id: string
          room_type_id?: string | null
          status?: string
          tenant_name: string
          tenant_phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          priority?: string
          property_id?: string
          room_type_id?: string | null
          status?: string
          tenant_name?: string
          tenant_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          admin_notes: string | null
          client_id: string
          compatibility_score: number | null
          created_at: string
          id: string
          property_id: string
          room_type_id: string | null
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          client_id: string
          compatibility_score?: number | null
          created_at?: string
          id?: string
          property_id: string
          room_type_id?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          client_id?: string
          compatibility_score?: number | null
          created_at?: string
          id?: string
          property_id?: string
          room_type_id?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          admin_notes: string | null
          available_rooms: number | null
          compliance_check: boolean | null
          created_at: string
          facilities: string[] | null
          id: string
          landlord_email: string | null
          landlord_name: string
          landlord_phone: string | null
          location: string | null
          owner_user_id: string | null
          photo_check: boolean | null
          photos: string[] | null
          physical_check: boolean | null
          property_name: string
          property_type: Database["public"]["Enums"]["property_type"]
          proximity_to_campus: string | null
          special_notes: string | null
          total_rooms: number | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          videos: string[] | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          available_rooms?: number | null
          compliance_check?: boolean | null
          created_at?: string
          facilities?: string[] | null
          id?: string
          landlord_email?: string | null
          landlord_name: string
          landlord_phone?: string | null
          location?: string | null
          owner_user_id?: string | null
          photo_check?: boolean | null
          photos?: string[] | null
          physical_check?: boolean | null
          property_name: string
          property_type?: Database["public"]["Enums"]["property_type"]
          proximity_to_campus?: string | null
          special_notes?: string | null
          total_rooms?: number | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          videos?: string[] | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          available_rooms?: number | null
          compliance_check?: boolean | null
          created_at?: string
          facilities?: string[] | null
          id?: string
          landlord_email?: string | null
          landlord_name?: string
          landlord_phone?: string | null
          location?: string | null
          owner_user_id?: string | null
          photo_check?: boolean | null
          photos?: string[] | null
          physical_check?: boolean | null
          property_name?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          proximity_to_campus?: string | null
          special_notes?: string | null
          total_rooms?: number | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          videos?: string[] | null
        }
        Relationships: []
      }
      room_types: {
        Row: {
          available_count: number | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          name: string
          price: number
          property_id: string
        }
        Insert: {
          available_count?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          name: string
          price?: number
          property_id: string
        }
        Update: {
          available_count?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          name?: string
          price?: number
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_types_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      roommate_matches: {
        Row: {
          ai_reasoning: string | null
          client_a_id: string
          client_b_id: string
          compatibility_score: number | null
          created_at: string
          id: string
          property_id: string | null
          room_type_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_reasoning?: string | null
          client_a_id: string
          client_b_id: string
          compatibility_score?: number | null
          created_at?: string
          id?: string
          property_id?: string | null
          room_type_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_reasoning?: string | null
          client_a_id?: string
          client_b_id?: string
          compatibility_score?: number | null
          created_at?: string
          id?: string
          property_id?: string | null
          room_type_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roommate_matches_client_a_id_fkey"
            columns: ["client_a_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roommate_matches_client_b_id_fkey"
            columns: ["client_b_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roommate_matches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roommate_matches_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_landlord: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "manager" | "verifier" | "landlord"
      match_status: "pending" | "accepted" | "rejected"
      payment_status: "pending" | "paid"
      property_type: "shared" | "single" | "hostel"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["super_admin", "manager", "verifier", "landlord"],
      match_status: ["pending", "accepted", "rejected"],
      payment_status: ["pending", "paid"],
      property_type: ["shared", "single", "hostel"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
