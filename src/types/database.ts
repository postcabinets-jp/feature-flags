export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: "owner" | "admin" | "editor" | "viewer";
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: "owner" | "admin" | "editor" | "viewer";
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "editor" | "viewer";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      environments: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          slug: string;
          color: string;
          sdk_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          slug: string;
          color?: string;
          sdk_key?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          slug?: string;
          color?: string;
          sdk_key?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "environments_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      feature_flags: {
        Row: {
          id: string;
          project_id: string;
          key: string;
          name: string;
          description: string | null;
          flag_type: "boolean" | "string" | "number" | "json";
          tags: string[];
          archived: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          key: string;
          name: string;
          description?: string | null;
          flag_type: "boolean" | "string" | "number" | "json";
          tags?: string[];
          archived?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          key?: string;
          name?: string;
          description?: string | null;
          flag_type?: "boolean" | "string" | "number" | "json";
          tags?: string[];
          archived?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      flag_configurations: {
        Row: {
          id: string;
          flag_id: string;
          environment_id: string;
          enabled: boolean;
          default_value: Json;
          rollout_percent: number | null;
          rules: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          flag_id: string;
          environment_id: string;
          enabled?: boolean;
          default_value?: Json;
          rollout_percent?: number | null;
          rules?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          flag_id?: string;
          environment_id?: string;
          enabled?: boolean;
          default_value?: Json;
          rollout_percent?: number | null;
          rules?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flag_configurations_flag_id_fkey";
            columns: ["flag_id"];
            isOneToOne: false;
            referencedRelation: "feature_flags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flag_configurations_environment_id_fkey";
            columns: ["environment_id"];
            isOneToOne: false;
            referencedRelation: "environments";
            referencedColumns: ["id"];
          }
        ];
      };
      flag_variants: {
        Row: {
          id: string;
          flag_id: string;
          key: string;
          value: Json;
          weight: number;
          description: string | null;
        };
        Insert: {
          id?: string;
          flag_id: string;
          key: string;
          value: Json;
          weight?: number;
          description?: string | null;
        };
        Update: {
          id?: string;
          flag_id?: string;
          key?: string;
          value?: Json;
          weight?: number;
          description?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string | null;
          flag_id: string | null;
          environment_id: string | null;
          actor_id: string | null;
          action: string;
          old_value: Json | null;
          new_value: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id?: string | null;
          flag_id?: string | null;
          environment_id?: string | null;
          actor_id?: string | null;
          action: string;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string | null;
          flag_id?: string | null;
          environment_id?: string | null;
          actor_id?: string | null;
          action?: string;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_flag_id_fkey";
            columns: ["flag_id"];
            isOneToOne: false;
            referencedRelation: "feature_flags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_environment_id_fkey";
            columns: ["environment_id"];
            isOneToOne: false;
            referencedRelation: "environments";
            referencedColumns: ["id"];
          }
        ];
      };
      api_keys: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes: string[];
          last_used_at: string | null;
          expires_at: string | null;
          created_by: string;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes?: string[];
          last_used_at?: string | null;
          expires_at?: string | null;
          created_by: string;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          scopes?: string[];
          last_used_at?: string | null;
          expires_at?: string | null;
          created_by?: string;
          created_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      flag_staleness_reports: {
        Row: {
          id: string;
          flag_id: string;
          reason: string;
          detected_at: string;
          resolved_at: string | null;
          notified: boolean;
        };
        Insert: {
          id?: string;
          flag_id: string;
          reason: string;
          detected_at?: string;
          resolved_at?: string | null;
          notified?: boolean;
        };
        Update: {
          id?: string;
          flag_id?: string;
          reason?: string;
          detected_at?: string;
          resolved_at?: string | null;
          notified?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
