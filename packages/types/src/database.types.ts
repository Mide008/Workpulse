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
      attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          message_id: string | null
          storage_path: string
          task_id: string | null
          uploaded_by: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          message_id?: string | null
          storage_path: string
          task_id?: string | null
          uploaded_by: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string | null
          storage_path?: string
          task_id?: string | null
          uploaded_by?: string
          workspace_id?: string
        }
      }
      channels: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_archived: boolean
          name: string
          type: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name: string
          type?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          type?: string
          workspace_id?: string
        }
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_edited: boolean
          parent_comment_id: string | null
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_edited?: boolean
          parent_comment_id?: string | null
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_edited?: boolean
          parent_comment_id?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string
        }
      }
      goals: {
        Row: {
          created_at: string
          current_value: number
          description: string | null
          due_date: string
          id: string
          metric_label: string | null
          period: string
          set_by: string
          start_date: string
          status: string
          target_value: number
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          description?: string | null
          due_date: string
          id?: string
          metric_label?: string | null
          period?: string
          set_by: string
          start_date: string
          status?: string
          target_value?: number
          title: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          current_value?: number
          description?: string | null
          due_date?: string
          id?: string
          metric_label?: string | null
          period?: string
          set_by?: string
          start_date?: string
          status?: string
          target_value?: number
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role_id: string | null
          status: string
          team_id: string | null
          token: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role_id?: string | null
          status?: string
          team_id?: string | null
          token?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role_id?: string | null
          status?: string
          team_id?: string | null
          token?: string
          workspace_id?: string
        }
      }
      kpi_snapshots: {
        Row: {
          activity_score: number
          ai_summary: string | null
          blocked_tasks: number
          completed_tasks: number
          completion_rate: number
          generated_at: string
          id: string
          on_time_rate: number
          overall_score: number
          overdue_tasks: number
          period_end: string
          period_start: string
          priority_score: number
          total_tasks: number
          user_id: string
          workspace_id: string
        }
        Insert: {
          activity_score?: number
          ai_summary?: string | null
          blocked_tasks?: number
          completed_tasks?: number
          completion_rate?: number
          generated_at?: string
          id?: string
          on_time_rate?: number
          overall_score?: number
          overdue_tasks?: number
          period_end: string
          period_start: string
          priority_score?: number
          total_tasks?: number
          user_id: string
          workspace_id: string
        }
        Update: {
          activity_score?: number
          ai_summary?: string | null
          blocked_tasks?: number
          completed_tasks?: number
          completion_rate?: number
          generated_at?: string
          id?: string
          on_time_rate?: number
          overall_score?: number
          overdue_tasks?: number
          period_end?: string
          period_start?: string
          priority_score?: number
          total_tasks?: number
          user_id?: string
          workspace_id?: string
        }
      }
      messages: {
        Row: {
          channel_id: string
          content: string | null
          created_at: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_edited: boolean
          parent_message_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean
          parent_message_id?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean
          parent_message_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
      }
      projects: {
        Row: {
          color: string
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          priority: string
          progress: number
          start_date: string | null
          status: string
          tags: string[]
          team_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          priority?: string
          progress?: number
          start_date?: string | null
          status?: string
          tags?: string[]
          team_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          priority?: string
          progress?: number
          start_date?: string | null
          status?: string
          tags?: string[]
          team_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
      }
      roles: {
        Row: {
          color: string
          created_at: string
          id: string
          is_default: boolean
          level: number
          name: string
          permissions: Json
          workspace_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          level: number
          name: string
          permissions?: Json
          workspace_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          level?: number
          name?: string
          permissions?: Json
          workspace_id?: string
        }
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          blocker_category: string | null
          blocker_reason: string | null
          category: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          parent_task_id: string | null
          position: number
          priority: string
          progress: number
          project_id: string | null
          start_date: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          blocker_category?: string | null
          blocker_reason?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          position?: number
          priority?: string
          progress?: number
          project_id?: string | null
          start_date?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          blocker_category?: string | null
          blocker_reason?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          position?: number
          priority?: string
          progress?: number
          project_id?: string | null
          start_date?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
      }
      task_activities: {
        Row: {
          action: string
          created_at: string
          id: string
          new_value: Json | null
          note: string | null
          old_value: Json | null
          task_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
          task_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          note?: string | null
          old_value?: Json | null
          task_id?: string
          user_id?: string
        }
      }
      teams: {
        Row: {
          color: string
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          lead_user_id: string | null
          name: string
          workspace_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          lead_user_id?: string | null
          name: string
          workspace_id: string
        }
        Update: {
          color?: string
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          lead_user_id?: string | null
          name?: string
          workspace_id?: string
        }
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          department_id: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          job_title: string | null
          last_seen_at: string | null
          notification_preferences: Json
          phone: string | null
          role_id: string | null
          team_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean
          job_title?: string | null
          last_seen_at?: string | null
          notification_preferences?: Json
          phone?: string | null
          role_id?: string | null
          team_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_seen_at?: string | null
          notification_preferences?: Json
          phone?: string | null
          role_id?: string | null
          team_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          plan: string
          plan_expires_at: string | null
          primary_color: string
          secondary_color: string
          size: string | null
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          plan?: string
          plan_expires_at?: string | null
          primary_color?: string
          secondary_color?: string
          size?: string | null
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          plan?: string
          plan_expires_at?: string | null
          primary_color?: string
          secondary_color?: string
          size?: string | null
          slug?: string
          timezone?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
  }
}