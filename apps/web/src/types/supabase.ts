export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      faculties: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          id: string
          name: string
          description: string | null
          faculty_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          faculty_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          faculty_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: {
          id: string
          name: string
          credits: number
          hours: number
          program_id: string
          default_teacher_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          credits: number
          hours: number
          program_id: string
          default_teacher_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          credits?: number
          hours?: number
          program_id?: string
          default_teacher_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_default_teacher_id_fkey"
            columns: ["default_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      academic_years: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          id: string
          name: string
          program_id: string
          academic_year_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          program_id: string
          academic_year_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          program_id?: string
          academic_year_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          }
        ]
      }
      class_courses: {
        Row: {
          id: string
          class_id: string
          course_id: string
          teacher_id: string
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          course_id: string
          teacher_id: string
          created_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          course_id?: string
          teacher_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_courses_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      exams: {
        Row: {
          id: string
          name: string
          type: string
          date: string
          percentage: number
          class_course_id: string
          is_locked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          date: string
          percentage: number
          class_course_id: string
          is_locked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          date?: string
          percentage?: number
          class_course_id?: string
          is_locked?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_course_id_fkey"
            columns: ["class_course_id"]
            isOneToOne: false
            referencedRelation: "class_courses"
            referencedColumns: ["id"]
          }
        ]
      }
      students: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          registration_number: string
          class_id: string
          created_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          registration_number: string
          class_id: string
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          registration_number?: string
          class_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          }
        ]
      }
      grades: {
        Row: {
          id: string
          student_id: string
          exam_id: string
          score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          exam_id: string
          score: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          exam_id?: string
          score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          email: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
      [_ in never]: never
    }
  }
}

// postgresql://postgres:9RJSqNNrWjghIgId@db.hgetyktmmkuqbrpxmpwk.supabase.co:5432/postgres
// 9RJSqNNrWjghIgId