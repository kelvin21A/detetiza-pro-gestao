export type Json = | string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          document: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          last_service_date: string | null;
          next_renewal_date: string | null;
          status: 'em-dia' | 'proximo' | 'vencido' | null;
          created_at: string;
          updated_at: string;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          contact_person: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          document?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          last_service_date?: string | null;
          next_renewal_date?: string | null;
          status?: 'em-dia' | 'proximo' | 'vencido' | null;
          created_at?: string;
          updated_at?: string;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          contact_person?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          document?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          last_service_date?: string | null;
          next_renewal_date?: string | null;
          status?: 'em-dia' | 'proximo' | 'vencido' | null;
          created_at?: string;
          updated_at?: string;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          contact_person?: string | null;
          notes?: string | null;
        };
      },
      profiles: {
        Row: {
          user_id: string;
          organization_id: string;
          name: string | null;
          avatar_url: string | null;
        };
        Insert: {
          user_id: string;
          organization_id: string;
          name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          user_id?: string;
          organization_id?: string;
          name?: string | null;
          avatar_url?: string | null;
        };
      };
      service_calls: {
        Row: {
          id: string;
          created_at: string;
          organization_id: string;
          client_id: string;
          team_id: string | null;
          title: string;
          description: string | null;
          status: "pending" | "in_progress" | "completed" | "cancelled" | null;
          scheduled_date: string | null;
          completed_date: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          organization_id: string;
          client_id: string;
          team_id?: string | null;
          title: string;
          description?: string | null;
          status?: "pending" | "in_progress" | "completed" | "cancelled" | null;
          scheduled_date?: string | null;
          completed_date?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          organization_id?: string;
          client_id?: string;
          team_id?: string | null;
          title?: string;
          description?: string | null;
          status?: "pending" | "in_progress" | "completed" | "cancelled" | null;
          scheduled_date?: string | null;
          completed_date?: string | null;
          notes?: string | null;
        };
      };
      teams: {
        Row: {
          id: string;
          created_at: string;
          organization_id: string;
          name: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          organization_id: string;
          name: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          organization_id?: string;
          name?: string;
        };
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
  };
}
