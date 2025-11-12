export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_hash: string
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_hash: string
          last_used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_hash?: string
          last_used_at?: string | null
          created_at?: string
        }
      }
      investigations: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: string
          tags: string[]
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: string
          tags?: string[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          status?: string
          tags?: string[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          investigation_id: string | null
          tool_name: string
          status: string
          priority: number
          input_data: Json
          output_data: Json | null
          error_message: string | null
          progress: number
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          investigation_id?: string | null
          tool_name: string
          status?: string
          priority?: number
          input_data: Json
          output_data?: Json | null
          error_message?: string | null
          progress?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          investigation_id?: string | null
          tool_name?: string
          status?: string
          priority?: number
          input_data?: Json
          output_data?: Json | null
          error_message?: string | null
          progress?: number
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
      }
      investigation_items: {
        Row: {
          id: string
          investigation_id: string
          job_id: string
          notes: string | null
          tags: string[]
          is_favorite: boolean
          created_at: string
        }
        Insert: {
          id?: string
          investigation_id: string
          job_id: string
          notes?: string | null
          tags?: string[]
          is_favorite?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          investigation_id?: string
          job_id?: string
          notes?: string | null
          tags?: string[]
          is_favorite?: boolean
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          user_id: string
          investigation_id: string | null
          name: string
          description: string | null
          report_type: string
          report_data: Json
          file_path: string | null
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          investigation_id?: string | null
          name: string
          description?: string | null
          report_type?: string
          report_data: Json
          file_path?: string | null
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          investigation_id?: string | null
          name?: string
          description?: string | null
          report_type?: string
          report_data?: Json
          file_path?: string | null
          is_public?: boolean
          created_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          tool_name: string
          action: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tool_name: string
          action: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tool_name?: string
          action?: string
          metadata?: Json
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_stats: {
        Args: {
          user_uuid: string
        }
        Returns: Json
      }
      search_investigations: {
        Args: {
          user_uuid: string
          search_query: string
          limit_count?: number
        }
        Returns: {
          id: string
          name: string
          description: string | null
          status: string
          tags: string[]
          created_at: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
