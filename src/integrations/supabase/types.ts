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
          course: string | null
          created_at: string
          current_photo_url: string | null
          email: string | null
          faculty: string | null
          full_name: string
          gender: string | null
          government_id_url: string | null
          guarantor_name: string | null
          guarantor_phone: string | null
          guarantor_relationship: string | null
          id: string
          level: string | null
          nin: string | null
          phone: string | null
          preferences: string[] | null
          proof_of_admission_url: string | null
          seeking_roommate: boolean
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          admin_notes?: string | null
          budget_max?: number | null
          budget_min?: number | null
          course?: string | null
          created_at?: string
          current_photo_url?: string | null
          email?: string | null
          faculty?: string | null
          full_name: string
          gender?: string | null
          government_id_url?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          guarantor_relationship?: string | null
          id?: string
          level?: string | null
          nin?: string | null
          phone?: string | null
          preferences?: string[] | null
          proof_of_admission_url?: string | null
          seeking_roommate?: boolean
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          admin_notes?: string | null
          budget_max?: number | null
          budget_min?: number | null
          course?: string | null
          created_at?: string
          current_photo_url?: string | null
          email?: string | null
          faculty?: string | null
          full_name?: string
          gender?: string | null
          government_id_url?: string | null
          guarantor_name?: string | null
          guarantor_phone?: string | null
          guarantor_relationship?: string | null
          id?: string
          level?: string | null
          nin?: string | null
          phone?: string | null
          preferences?: string[] | null
          proof_of_admission_url?: string | null
          seeking_roommate?: boolean
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
      conversations: {
        Row: {
          context_id: string | null
          context_type: string | null
          created_at: string
          id: string
          last_message_at: string
          participant_a: string
          participant_b: string
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          participant_a: string
          participant_b: string
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          participant_a?: string
          participant_b?: string
        }
        Relationships: []
      }
      inspection_bookings: {
        Row: {
          client_id: string
          created_at: string
          id: string
          notes: string | null
          payment_reference: string | null
          payment_status: string
          property_id: string
          slot_id: string
          status: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_reference?: string | null
          payment_status?: string
          property_id: string
          slot_id: string
          status?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_reference?: string | null
          payment_status?: string
          property_id?: string
          slot_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "inspection_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_feedback: {
        Row: {
          booking_id: string
          comments: string | null
          created_at: string
          id: string
          interested: boolean | null
          property_id: string
          rating: number
          user_id: string
        }
        Insert: {
          booking_id: string
          comments?: string | null
          created_at?: string
          id?: string
          interested?: boolean | null
          property_id: string
          rating: number
          user_id: string
        }
        Update: {
          booking_id?: string
          comments?: string | null
          created_at?: string
          id?: string
          interested?: boolean | null
          property_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_feedback_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "inspection_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_feedback_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_slots: {
        Row: {
          created_at: string
          created_by: string
          current_bookings: number
          id: string
          max_bookings: number
          property_id: string
          slot_date: string
          slot_time: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_bookings?: number
          id?: string
          max_bookings?: number
          property_id: string
          slot_date: string
          slot_time: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_bookings?: number
          id?: string
          max_bookings?: number
          property_id?: string
          slot_date?: string
          slot_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_slots_property_id_fkey"
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
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          message_type: string
          read: boolean
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          message_type?: string
          read?: boolean
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          message_type?: string
          read?: boolean
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_fees: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          fee_type: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          fee_type: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          fee_type?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          last_seen_at: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          last_seen_at?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          last_seen_at?: string | null
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
          distance_to_campus_km: number | null
          facilities: string[] | null
          id: string
          landlord_email: string | null
          landlord_name: string
          landlord_phone: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          owner_user_id: string | null
          photo_check: boolean | null
          photos: string[] | null
          physical_check: boolean | null
          property_name: string
          property_type: Database["public"]["Enums"]["property_type"]
          proximity_to_campus: string | null
          special_notes: string | null
          total_rooms: number | null
          transport_options: Json | null
          updated_at: string
          utility_rating: Json | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          videos: string[] | null
          walkability_rating: number | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          available_rooms?: number | null
          compliance_check?: boolean | null
          created_at?: string
          distance_to_campus_km?: number | null
          facilities?: string[] | null
          id?: string
          landlord_email?: string | null
          landlord_name: string
          landlord_phone?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          owner_user_id?: string | null
          photo_check?: boolean | null
          photos?: string[] | null
          physical_check?: boolean | null
          property_name: string
          property_type?: Database["public"]["Enums"]["property_type"]
          proximity_to_campus?: string | null
          special_notes?: string | null
          total_rooms?: number | null
          transport_options?: Json | null
          updated_at?: string
          utility_rating?: Json | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          videos?: string[] | null
          walkability_rating?: number | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          available_rooms?: number | null
          compliance_check?: boolean | null
          created_at?: string
          distance_to_campus_km?: number | null
          facilities?: string[] | null
          id?: string
          landlord_email?: string | null
          landlord_name?: string
          landlord_phone?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          owner_user_id?: string | null
          photo_check?: boolean | null
          photos?: string[] | null
          physical_check?: boolean | null
          property_name?: string
          property_type?: Database["public"]["Enums"]["property_type"]
          proximity_to_campus?: string | null
          special_notes?: string | null
          total_rooms?: number | null
          transport_options?: Json | null
          updated_at?: string
          utility_rating?: Json | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          videos?: string[] | null
          walkability_rating?: number | null
        }
        Relationships: []
      }
      property_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          property_id: string
          rating: number
          reviewer_name: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          property_id: string
          rating: number
          reviewer_name?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          property_id?: string
          rating?: number
          reviewer_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
          uses?: number
        }
        Relationships: []
      }
      referral_uses: {
        Row: {
          created_at: string
          id: string
          referral_code_id: string
          referred_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code_id: string
          referred_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code_id?: string
          referred_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_uses_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
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
          client_a_status: string
          client_b_id: string
          client_b_status: string
          compatibility_score: number | null
          created_at: string
          id: string
          payment_reference: string | null
          payment_status: string
          property_id: string | null
          room_type_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_reasoning?: string | null
          client_a_id: string
          client_a_status?: string
          client_b_id: string
          client_b_status?: string
          compatibility_score?: number | null
          created_at?: string
          id?: string
          payment_reference?: string | null
          payment_status?: string
          property_id?: string | null
          room_type_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_reasoning?: string | null
          client_a_id?: string
          client_a_status?: string
          client_b_id?: string
          client_b_status?: string
          compatibility_score?: number | null
          created_at?: string
          id?: string
          payment_reference?: string | null
          payment_status?: string
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
      saved_properties: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
