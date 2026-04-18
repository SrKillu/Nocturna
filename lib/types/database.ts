// Auto-maintained Supabase DB types for the Nocturna schema.
// Keep in sync with /app/supabase/migrations.

export type UserRole = 'student' | 'teacher' | 'admin' | 'super_admin';

export type SubmissionStatus = 'submitted' | 'graded' | 'late' | 'returned';

export interface Database {
  public: {
    Tables: {
      institutions: {
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
        Update: Partial<Database['public']['Tables']['institutions']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          institution_id: string | null;
          role: UserRole;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          institution_id: string | null;
          role: UserRole;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      courses: {
        Row: {
          id: string;
          institution_id: string;
          name: string;
          description: string | null;
          teacher_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          institution_id: string;
          name: string;
          description?: string | null;
          teacher_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['courses']['Insert']>;
      };
      enrollments: {
        Row: {
          id: string;
          institution_id: string;
          course_id: string;
          student_id: string;
          enrolled_at: string;
        };
        Insert: {
          id?: string;
          institution_id: string;
          course_id: string;
          student_id: string;
          enrolled_at?: string;
        };
        Update: Partial<Database['public']['Tables']['enrollments']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          institution_id: string;
          course_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          max_score: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          institution_id: string;
          course_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          max_score?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      submissions: {
        Row: {
          id: string;
          institution_id: string;
          task_id: string;
          student_id: string;
          content: string | null;
          file_path: string | null;
          status: SubmissionStatus;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          institution_id: string;
          task_id: string;
          student_id: string;
          content?: string | null;
          file_path?: string | null;
          status?: SubmissionStatus;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['submissions']['Insert']>;
      };
      grades: {
        Row: {
          id: string;
          institution_id: string;
          submission_id: string;
          teacher_id: string;
          score: number;
          feedback: string | null;
          graded_at: string;
        };
        Insert: {
          id?: string;
          institution_id: string;
          submission_id: string;
          teacher_id: string;
          score: number;
          feedback?: string | null;
          graded_at?: string;
        };
        Update: Partial<Database['public']['Tables']['grades']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      submission_status: SubmissionStatus;
    };
  };
}
